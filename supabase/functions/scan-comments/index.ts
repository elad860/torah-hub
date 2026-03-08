import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const CHANNEL_HANDLE = '@yagdil'
const TRIGGER_TEXT = 'קישור לדברי תורה'

interface ScanResult {
  videoId: string
  videoTitle: string
  sheetUrl: string
}

async function getChannelId(apiKey: string): Promise<string> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/channels?forHandle=${CHANNEL_HANDLE}&part=id&key=${apiKey}`
  )
  const data = await res.json()
  if (!data.items?.length) throw new Error('Channel not found')
  return data.items[0].id
}

async function getUploadsPlaylistId(apiKey: string, channelId: string): Promise<string> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/channels?id=${channelId}&part=contentDetails&key=${apiKey}`
  )
  const data = await res.json()
  return data.items[0].contentDetails.relatedPlaylists.uploads
}

async function getAllVideosWithDescriptions(apiKey: string, uploadsPlaylistId: string, limit?: number): Promise<Array<{videoId: string, title: string, description: string}>> {
  const videos: Array<{videoId: string, title: string, description: string}> = []
  let pageToken = ''

  do {
    const url = `${YOUTUBE_API_BASE}/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.items) {
      for (const item of data.items) {
        const vid = item.snippet?.resourceId?.videoId
        const title = item.snippet?.title
        const description = item.snippet?.description || ''
        if (vid && title && title !== 'Private video' && title !== 'Deleted video') {
          videos.push({ videoId: vid, title, description })
        }
      }
    }
    pageToken = data.nextPageToken || ''
    if (limit && videos.length >= limit) {
      return videos.slice(0, limit)
    }
  } while (pageToken)

  return videos
}

function findSheetUrlsInDescription(description: string): string[] {
  const urls: string[] = []
  // Check if description contains the trigger text
  if (!description.includes(TRIGGER_TEXT)) return urls

  // Extract Google Sheets URLs
  const matches = description.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+[^\s)"\n]*/g)
  if (matches) {
    urls.push(...matches)
  }
  return [...new Set(urls)]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'full'
    const recentCount = body.recentCount || 50

    // 1. Get channel info
    console.log('Getting channel ID...')
    const channelId = await getChannelId(apiKey)
    const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, channelId)

    // 2. Get videos with descriptions (no extra API calls needed!)
    console.log('Fetching videos with descriptions...')
    const limit = mode === 'recent' ? recentCount : undefined
    const videos = await getAllVideosWithDescriptions(apiKey, uploadsPlaylistId, limit)
    console.log(`Got ${videos.length} videos`)

    // 3. Scan descriptions for sheet URLs
    const results: ScanResult[] = []
    let scanned = 0

    for (const video of videos) {
      scanned++
      const sheetUrls = findSheetUrlsInDescription(video.description)
      for (const sheetUrl of sheetUrls) {
        results.push({
          videoId: video.videoId,
          videoTitle: video.title,
          sheetUrl,
        })
      }
    }

    console.log(`Scan complete. Found ${results.length} sheets across ${scanned} videos.`)

    // 4. Parse unique sheets
    const uniqueSheets = new Map<string, { videoId: string, videoTitle: string }>()
    for (const r of results) {
      if (!uniqueSheets.has(r.sheetUrl)) {
        uniqueSheets.set(r.sheetUrl, { videoId: r.videoId, videoTitle: r.videoTitle })
      }
    }

    const parseResults = []
    for (const [sheetUrl, info] of uniqueSheets) {
      console.log(`Parsing sheet from video "${info.videoTitle}": ${sheetUrl}`)
      try {
        const parseRes = await fetch(`${supabaseUrl}/functions/v1/parse-sheets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ sheetUrl, sourceVideoId: info.videoId }),
        })
        const parseData = await parseRes.json()
        parseResults.push({ sheetUrl, videoTitle: info.videoTitle, ...parseData })
      } catch (e) {
        console.error('Failed to parse sheet:', sheetUrl, e)
        parseResults.push({ sheetUrl, videoTitle: info.videoTitle, success: false, error: String(e) })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        videosScanned: scanned,
        sheetsFound: uniqueSheets.size,
        parseResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error scanning descriptions:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
