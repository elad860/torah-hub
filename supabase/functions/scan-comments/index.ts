import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const CHANNEL_HANDLE = '@yagdil'
const TRIGGER_TEXT = 'קישור לדברי תורה'

// Hebrew year calculation
const ROSH_HASHANA: Record<number, [number, number]> = {
  2015: [9, 14], 2016: [10, 3], 2017: [9, 21], 2018: [9, 10],
  2019: [9, 30], 2020: [9, 19], 2021: [9, 7], 2022: [9, 26],
  2023: [9, 16], 2024: [10, 3], 2025: [9, 23], 2026: [9, 12],
  2027: [10, 2], 2028: [9, 21], 2029: [9, 10], 2030: [9, 28],
}

const HEBREW_YEAR_NAMES: Record<number, string> = {
  5775: 'תשע"ה', 5776: 'תשע"ו', 5777: 'תשע"ז', 5778: 'תשע"ח',
  5779: 'תשע"ט', 5780: 'תש"פ', 5781: 'תשפ"א', 5782: 'תשפ"ב',
  5783: 'תשפ"ג', 5784: 'תשפ"ד', 5785: 'תשפ"ה', 5786: 'תשפ"ו',
  5787: 'תשפ"ז', 5788: 'תשפ"ח', 5789: 'תשפ"ט', 5790: 'תש"צ',
}

function calcHebrewYear(dateStr: string): string | null {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const rh = ROSH_HASHANA[year]
  if (!rh) return null
  const rhDate = new Date(year, rh[0] - 1, rh[1])
  const num = date >= rhDate ? year + 3761 : year + 3760
  return HEBREW_YEAR_NAMES[num] || null
}

async function getChannelId(apiKey: string): Promise<string> {
  const res = await fetch(`${YOUTUBE_API_BASE}/channels?forHandle=${CHANNEL_HANDLE}&part=id&key=${apiKey}`)
  const data = await res.json()
  if (!data.items?.length) throw new Error('Channel not found')
  return data.items[0].id
}

async function getUploadsPlaylistId(apiKey: string, channelId: string): Promise<string> {
  const res = await fetch(`${YOUTUBE_API_BASE}/channels?id=${channelId}&part=contentDetails&key=${apiKey}`)
  const data = await res.json()
  return data.items[0].contentDetails.relatedPlaylists.uploads
}

async function getVideosBatch(apiKey: string, uploadsPlaylistId: string, pageToken: string) {
  const url = `${YOUTUBE_API_BASE}/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
  const res = await fetch(url)
  const data = await res.json()
  
  const videos = (data.items || [])
    .filter((item: any) => {
      const t = item.snippet?.title
      return t && t !== 'Private video' && t !== 'Deleted video'
    })
    .map((item: any) => ({
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description || '',
      publishedAt: item.snippet.publishedAt || '',
    }))
  
  return { videos, nextPageToken: data.nextPageToken || '' }
}

function findSheetUrls(description: string): string[] {
  if (!description.includes(TRIGGER_TEXT)) return []
  const matches = description.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+[^\s)"\n]*/g)
  return matches ? [...new Set(matches)] : []
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 🔒 Admin-only
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured')

    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'scan-only'
    const pageToken = body.pageToken || ''
    const batchCount = body.batchCount || 3
    const autoEnrich = body.autoEnrich !== false // auto-tag hebrew year + content_text by default

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Getting channel ID...')
    const channelId = await getChannelId(apiKey)
    const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, channelId)

    const results: Array<{videoId: string, videoTitle: string, sheetUrl: string, publishedAt: string}> = []
    let currentPageToken = pageToken
    let pagesProcessed = 0
    let videosScanned = 0
    let enrichedCount = 0

    for (let i = 0; i < batchCount; i++) {
      const { videos, nextPageToken } = await getVideosBatch(apiKey, uploadsPlaylistId, currentPageToken)
      videosScanned += videos.length
      
      for (const video of videos) {
        const sheetUrls = findSheetUrls(video.description)
        for (const sheetUrl of sheetUrls) {
          results.push({ videoId: video.videoId, videoTitle: video.title, sheetUrl, publishedAt: video.publishedAt })
        }
      }
      
      pagesProcessed++
      currentPageToken = nextPageToken
      if (!currentPageToken) break
    }

    console.log(`Scanned ${videosScanned} videos across ${pagesProcessed} pages. Found ${results.length} sheet references.`)

    // Deduplicate sheets
    const uniqueSheets = new Map<string, {videoId: string, videoTitle: string, publishedAt: string}>()
    for (const r of results) {
      const id = r.sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
      if (id && !uniqueSheets.has(id)) {
        uniqueSheets.set(id, { videoId: r.videoId, videoTitle: r.videoTitle, publishedAt: r.publishedAt })
      }
    }

    // Parse sheets if mode=process - only process first sheet to avoid timeout
    let parseResults: any[] = []
    if (mode === 'process' && uniqueSheets.size > 0) {
      let processed = 0
      const maxSheets = body.maxSheets || 1 // default to 1 sheet per run to avoid timeout
      for (const [sheetId, info] of uniqueSheets) {
        if (processed >= maxSheets) break
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
        console.log(`Parsing sheet ${sheetId} from video "${info.videoTitle}"`)
        try {
          const parseRes = await fetch(`${supabaseUrl}/functions/v1/parse-sheets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ sheetUrl, sourceVideoId: info.videoId, publishedAt: info.publishedAt }),
          })
          const parseData = await parseRes.json()
          parseResults.push({ sheetId, videoTitle: info.videoTitle, ...parseData })
          processed++
        } catch (e) {
          parseResults.push({ sheetId, videoTitle: info.videoTitle, success: false, error: String(e) })
          processed++
        }
      }
    }

    // Auto-enrich: tag hebrew_year and content_text for items missing them
    if (autoEnrich) {
      // Enrich articles missing hebrew_year
      const { data: articlesNoYear } = await supabase
        .from('articles')
        .select('id, created_at, title, category, source_video_id')
        .is('hebrew_year', null)
        .limit(200)
      
      if (articlesNoYear?.length) {
        for (const a of articlesNoYear) {
          const hy = calcHebrewYear(a.created_at)
          const contentText = `${a.title}. קטגוריה: ${a.category}.`
          const update: any = {}
          if (hy) update.hebrew_year = hy
          if (!a.source_video_id) update.content_text = contentText
          if (Object.keys(update).length > 0) {
            await supabase.from('articles').update(update).eq('id', a.id)
            enrichedCount++
          }
        }
      }

      // Enrich podcasts missing hebrew_year
      const { data: podcastsNoYear } = await supabase
        .from('podcasts')
        .select('id, created_at, title, description')
        .is('hebrew_year', null)
        .limit(200)
      
      if (podcastsNoYear?.length) {
        for (const p of podcastsNoYear) {
          const hy = calcHebrewYear(p.created_at)
          const update: any = {}
          if (hy) update.hebrew_year = hy
          if (!p.content_text) update.content_text = `${p.title}. ${p.description || ''}`
          if (Object.keys(update).length > 0) {
            await supabase.from('podcasts').update(update).eq('id', p.id)
            enrichedCount++
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        videosScanned,
        pagesProcessed,
        sheetsFound: uniqueSheets.size,
        enrichedCount,
        nextPageToken: currentPageToken || null,
        hasMore: !!currentPageToken,
        parseResults: parseResults.length > 0 ? parseResults : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error scanning:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
