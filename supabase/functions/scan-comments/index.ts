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

async function getAllVideoIds(apiKey: string, uploadsPlaylistId: string): Promise<Array<{videoId: string, title: string}>> {
  const videos: Array<{videoId: string, title: string}> = []
  let pageToken = ''

  do {
    const url = `${YOUTUBE_API_BASE}/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.items) {
      for (const item of data.items) {
        const vid = item.snippet?.resourceId?.videoId
        const title = item.snippet?.title
        if (vid && title && title !== 'Private video' && title !== 'Deleted video') {
          videos.push({ videoId: vid, title })
        }
      }
    }
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  return videos
}

async function getVideoComments(apiKey: string, videoId: string): Promise<string[]> {
  const comments: string[] = []
  try {
    let pageToken = ''
    do {
      const url = `${YOUTUBE_API_BASE}/commentThreads?videoId=${videoId}&part=snippet&maxResults=100&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
      const res = await fetch(url)
      if (!res.ok) {
        // Comments might be disabled
        console.log(`Comments unavailable for ${videoId}: ${res.status}`)
        return comments
      }
      const data = await res.json()
      if (data.items) {
        for (const item of data.items) {
          const text = item.snippet?.topLevelComment?.snippet?.textOriginal || 
                       item.snippet?.topLevelComment?.snippet?.textDisplay || ''
          comments.push(text)
        }
      }
      pageToken = data.nextPageToken || ''
    } while (pageToken)
  } catch (e) {
    console.log(`Error fetching comments for ${videoId}:`, e)
  }
  return comments
}

function findSheetUrls(comments: string[]): string[] {
  const urls: string[] = []
  for (const comment of comments) {
    // Check if comment contains the trigger text
    if (!comment.includes(TRIGGER_TEXT)) continue

    // Extract Google Sheets URLs
    const matches = comment.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9_-]+[^\s)"]*/g)
    if (matches) {
      urls.push(...matches)
    }
  }
  return [...new Set(urls)] // deduplicate
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
    const mode = body.mode || 'full' // 'full' = scan all, 'recent' = last N videos
    const recentCount = body.recentCount || 20

    // 1. Get channel info
    console.log('Getting channel ID...')
    const channelId = await getChannelId(apiKey)
    const uploadsPlaylistId = await getUploadsPlaylistId(apiKey, channelId)
    console.log('Uploads playlist:', uploadsPlaylistId)

    // 2. Get video IDs
    console.log('Fetching video list...')
    let videos = await getAllVideoIds(apiKey, uploadsPlaylistId)
    console.log(`Total videos: ${videos.length}`)

    if (mode === 'recent') {
      videos = videos.slice(0, recentCount)
      console.log(`Scanning recent ${recentCount} videos`)
    }

    // 3. Scan comments for each video
    const results: ScanResult[] = []
    let scanned = 0
    let quotaUsed = 0

    for (const video of videos) {
      scanned++
      if (scanned % 50 === 0) {
        console.log(`Scanned ${scanned}/${videos.length} videos...`)
      }

      const comments = await getVideoComments(apiKey, video.videoId)
      quotaUsed++ // Each commentThreads.list = 1 unit

      const sheetUrls = findSheetUrls(comments)
      for (const sheetUrl of sheetUrls) {
        results.push({
          videoId: video.videoId,
          videoTitle: video.title,
          sheetUrl,
        })
      }

      // Rate limiting: small delay every 10 videos
      if (scanned % 10 === 0) {
        await new Promise(r => setTimeout(r, 100))
      }
    }

    console.log(`Scan complete. Found ${results.length} sheets across ${scanned} videos.`)

    // 4. For each unique sheet URL, call parse-sheets function
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
        estimatedQuotaUsed: quotaUsed,
        parseResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error scanning comments:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
