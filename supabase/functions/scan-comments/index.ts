import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const CHANNEL_HANDLE = '@yagdil'
const TRIGGER_TEXT = 'קישור לדברי תורה'

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

async function getVideosBatch(apiKey: string, uploadsPlaylistId: string, pageToken: string): Promise<{videos: Array<{videoId: string, title: string, description: string}>, nextPageToken: string}> {
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

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured')

    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'scan-only' // scan-only = just find sheets, process = find + parse
    const pageToken = body.pageToken || ''
    const batchCount = body.batchCount || 5 // number of API pages (50 videos each)

    console.log('Getting channel ID...')
    const channelId = await getChannelId(apiKey)
    const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, channelId)

    // Scan in batches of pages
    const results: Array<{videoId: string, videoTitle: string, sheetUrl: string}> = []
    let currentPageToken = pageToken
    let pagesProcessed = 0
    let videosScanned = 0

    for (let i = 0; i < batchCount; i++) {
      const { videos, nextPageToken } = await getVideosBatch(apiKey, uploadsPlaylistId, currentPageToken)
      videosScanned += videos.length
      
      for (const video of videos) {
        const sheetUrls = findSheetUrls(video.description)
        for (const sheetUrl of sheetUrls) {
          results.push({ videoId: video.videoId, videoTitle: video.title, sheetUrl })
        }
      }
      
      pagesProcessed++
      currentPageToken = nextPageToken
      if (!currentPageToken) break
    }

    console.log(`Scanned ${videosScanned} videos across ${pagesProcessed} pages. Found ${results.length} sheet references.`)

    // Deduplicate sheets
    const uniqueSheets = new Map<string, {videoId: string, videoTitle: string}>()
    for (const r of results) {
      const id = r.sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
      if (id && !uniqueSheets.has(id)) {
        uniqueSheets.set(id, { videoId: r.videoId, videoTitle: r.videoTitle })
      }
    }

    // If mode is process, call parse-sheets for each
    let parseResults: any[] = []
    if (mode === 'process' && uniqueSheets.size > 0) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

      for (const [sheetId, info] of uniqueSheets) {
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
        console.log(`Parsing sheet ${sheetId} from video "${info.videoTitle}"`)
        try {
          const parseRes = await fetch(`${supabaseUrl}/functions/v1/parse-sheets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ sheetUrl, sourceVideoId: info.videoId }),
          })
          const parseData = await parseRes.json()
          parseResults.push({ sheetId, videoTitle: info.videoTitle, ...parseData })
        } catch (e) {
          parseResults.push({ sheetId, videoTitle: info.videoTitle, success: false, error: String(e) })
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        videosScanned,
        pagesProcessed,
        sheetsFound: uniqueSheets.size,
        sheets: Array.from(uniqueSheets.entries()).map(([id, info]) => ({
          sheetId: id,
          sheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
          videoId: info.videoId,
          videoTitle: info.videoTitle,
        })),
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
