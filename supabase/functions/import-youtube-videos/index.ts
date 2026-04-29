import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'
const CHANNEL_HANDLE = '@yagdil'

interface YouTubePlaylist {
  id: string
  snippet: {
    title: string
    description: string
    publishedAt: string
  }
}

interface YouTubePlaylistItem {
  snippet: {
    title: string
    description: string
    publishedAt: string
    resourceId: { videoId: string }
    playlistId: string
  }
}

async function getChannelId(apiKey: string): Promise<string> {
  const res = await fetch(
    `${YOUTUBE_API_BASE}/channels?forHandle=${CHANNEL_HANDLE}&part=id&key=${apiKey}`
  )
  const data = await res.json()
  if (!data.items?.length) throw new Error('Channel not found for handle ' + CHANNEL_HANDLE)
  return data.items[0].id
}

async function getPlaylists(apiKey: string, channelId: string): Promise<YouTubePlaylist[]> {
  const playlists: YouTubePlaylist[] = []
  let pageToken = ''

  do {
    const url = `${YOUTUBE_API_BASE}/playlists?channelId=${channelId}&part=snippet&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.items) playlists.push(...data.items)
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  return playlists
}

async function getPlaylistVideos(apiKey: string, playlistId: string): Promise<YouTubePlaylistItem[]> {
  const items: YouTubePlaylistItem[] = []
  let pageToken = ''

  do {
    const url = `${YOUTUBE_API_BASE}/playlistItems?playlistId=${playlistId}&part=snippet&maxResults=50&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.items) items.push(...data.items)
    pageToken = data.nextPageToken || ''
  } while (pageToken)

  return items
}

// Map playlist names to our category system
function categorizePlaylist(playlistName: string): string {
  const lower = playlistName
  const categoryMap: Record<string, string[]> = {
    'פרשת השבוע': ['פרשת', 'פרשה', 'בראשית', 'נח', 'לך לך', 'שמות', 'ויקרא', 'במדבר', 'דברים'],
    'הלכה': ['הלכה', 'הלכות', 'שבת', 'כשרות', 'תפילה', 'ברכות', 'שולחן ערוך'],
    'מוסר': ['מוסר', 'מידות', 'אמונה', 'ביטחון', 'תשובה', 'עבודת ה', 'חינוך'],
    'חגים': ['ראש השנה', 'יום כיפור', 'סוכות', 'פסח', 'שבועות', 'פורים', 'חנוכה'],
    'זוהר וקבלה': ['זוהר', 'קבלה', 'סוד', 'אור החיים'],
    'הילולות צדיקים': ['הילולת', 'הילולא', 'צדיקים', 'רבי'],
  }

  for (const [cat, patterns] of Object.entries(categoryMap)) {
    if (patterns.some(p => lower.includes(p))) return cat
  }
  return 'כללי'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 🔒 Admin-only: prevents anonymous DELETE-then-INSERT wiping the lessons table
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const apiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get channel ID
    console.log('Fetching channel ID...')
    const channelId = await getChannelId(apiKey)
    console.log('Channel ID:', channelId)

    // 2. Get all playlists
    console.log('Fetching playlists...')
    const playlists = await getPlaylists(apiKey, channelId)
    console.log(`Found ${playlists.length} playlists`)

    // 3. Fetch videos from each playlist
    const allVideos: Array<{
      youtube_url: string
      title: string
      category: string
      series: string | null
      playlist_id: string
      playlist_name: string
      published_at: string
    }> = []

    const seenVideoIds = new Set<string>()

    for (const playlist of playlists) {
      console.log(`Fetching videos from playlist: ${playlist.snippet.title}`)
      const items = await getPlaylistVideos(apiKey, playlist.id)
      const category = categorizePlaylist(playlist.snippet.title)

      for (const item of items) {
        const videoId = item.snippet.resourceId?.videoId
        if (!videoId || seenVideoIds.has(videoId)) continue
        seenVideoIds.add(videoId)

        // Skip private/deleted videos
        if (item.snippet.title === 'Private video' || item.snippet.title === 'Deleted video') continue

        // Decode HTML entities
        let title = item.snippet.title
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")

        allVideos.push({
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          title,
          category,
          series: playlist.snippet.title,
          playlist_id: playlist.id,
          playlist_name: playlist.snippet.title,
          published_at: item.snippet.publishedAt,
        })
      }
    }

    console.log(`Total unique videos: ${allVideos.length}`)

    if (allVideos.length > 0) {
      // Clear existing lessons
      const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

      if (deleteError) console.error('Delete error:', deleteError)

      // Insert in batches of 100
      for (let i = 0; i < allVideos.length; i += 100) {
        const batch = allVideos.slice(i, i + 100)
        const { error: insertError } = await supabase.from('lessons').insert(batch)
        if (insertError) {
          console.error(`Insert error batch ${i}:`, insertError)
          throw insertError
        }
        console.log(`Inserted batch ${i / 100 + 1} (${batch.length} videos)`)
      }
    }

    // Build category summary
    const categoryCounts: Record<string, number> = {}
    const playlistCounts: Record<string, number> = {}
    for (const v of allVideos) {
      categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1
      playlistCounts[v.playlist_name] = (playlistCounts[v.playlist_name] || 0) + 1
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: allVideos.length,
        playlists: playlists.length,
        categories: categoryCounts,
        playlistCounts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error importing videos:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
