import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const channelId = 'UC8p9UcdygL7bIdbyoOZuNPQ'
    
    // Fetch YouTube RSS feed (gives latest 15 videos)
    console.log('Fetching YouTube RSS feed...')
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
    const rssResponse = await fetch(rssUrl)
    
    if (!rssResponse.ok) {
      throw new Error(`RSS feed failed: ${rssResponse.status}`)
    }
    
    const rssText = await rssResponse.text()
    
    // Parse video IDs and titles from RSS
    const videoMatches = rssText.matchAll(/<yt:videoId>([^<]+)<\/yt:videoId>[\s\S]*?<title>([^<]+)<\/title>/g)
    const rssVideos: { id: string; title: string }[] = []
    
    for (const match of videoMatches) {
      rssVideos.push({ id: match[1], title: match[2] })
    }
    
    console.log(`Found ${rssVideos.length} videos from RSS`)

    // Also try to scrape using Firecrawl with different approaches
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY')
    const additionalVideos: { id: string; title: string }[] = []
    
    if (apiKey) {
      // Try multiple pages and playlists
      const urlsToScrape = [
        `https://www.youtube.com/channel/${channelId}/videos`,
        `https://www.youtube.com/channel/${channelId}/playlists`,
        // Try with @handle format
        'https://www.youtube.com/@הרבאורןנזרית/videos',
      ]

      for (const scrapeUrl of urlsToScrape) {
        try {
          console.log(`Scraping: ${scrapeUrl}`)
          const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: scrapeUrl,
              formats: ['rawHtml'],
              waitFor: 8000,
            }),
          })

          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json()
            const html = scrapeData.data?.rawHtml || scrapeData.rawHtml || ''
            
            // Extract video IDs using multiple patterns
            const patterns = [
              /\"videoId\":\"([a-zA-Z0-9_-]{11})\"/g,
              /watch\?v=([a-zA-Z0-9_-]{11})/g,
              /\/shorts\/([a-zA-Z0-9_-]{11})/g,
            ]

            for (const pattern of patterns) {
              const matches = html.matchAll(pattern)
              for (const match of matches) {
                const id = match[1]
                if (!rssVideos.find(v => v.id === id) && !additionalVideos.find(v => v.id === id)) {
                  additionalVideos.push({ id, title: '' })
                }
              }
            }
            
            console.log(`Found ${additionalVideos.length} additional unique video IDs so far`)
          }
        } catch (e) {
          console.log(`Scrape failed for ${scrapeUrl}:`, e)
        }
      }
    }

    // Combine all videos, prioritizing RSS (has titles)
    const allVideos = [...rssVideos, ...additionalVideos]
    console.log(`Total unique videos before processing: ${allVideos.length}`)

    // Process videos - limit to 100 and fetch titles via oEmbed
    const videos = []
    const processedIds = new Set<string>()
    
    const categoryPatterns: Record<string, string[]> = {
      'פרשת השבוע': ['פרשת', 'פרשה', 'בראשית', 'נח', 'לך לך', 'וירא', 'חיי שרה', 'תולדות', 'ויצא', 'וישלח', 'וישב', 'מקץ', 'ויגש', 'ויחי', 'שמות', 'וארא', 'בא', 'בשלח', 'יתרו', 'משפטים', 'תרומה', 'תצוה', 'כי תשא', 'ויקהל', 'פקודי', 'ויקרא', 'צו', 'שמיני', 'תזריע', 'מצורע', 'אחרי מות', 'קדושים', 'אמור', 'בהר', 'בחוקותי', 'במדבר', 'נשא', 'בהעלותך', 'שלח', 'קרח', 'חוקת', 'בלק', 'פינחס', 'מטות', 'מסעי', 'דברים', 'ואתחנן', 'עקב', 'ראה', 'שופטים', 'כי תצא', 'כי תבוא', 'נצבים', 'וילך', 'האזינו', 'וזאת הברכה'],
      'הלכה': ['הלכה', 'הלכות', 'דין', 'שבת', 'כשרות', 'תפילה', 'ברכות', 'שולחן ערוך', 'ש"ע', 'קיצור'],
      'מוסר': ['מוסר', 'מידות', 'אמונה', 'ביטחון', 'תשובה', 'עבודת ה', 'חינוך', 'יסוד'],
      'חגים': ['ראש השנה', 'יום כיפור', 'סוכות', 'פסח', 'שבועות', 'פורים', 'חנוכה', 'ט באב', 'תשעה באב', 'ל"ג בעומר', 'ט"ו בשבט'],
      'זוהר וקבלה': ['זוהר', 'קבלה', 'סוד', 'תיקון', 'אור החיים'],
      'הילולות צדיקים': ['הילולת', 'הילולא', 'זיע', 'זיע"א', 'רבי', 'האדמו"ר'],
    }

    // Batch fetch titles using Promise.all for speed
    const batchSize = 10
    for (let i = 0; i < allVideos.length && videos.length < 100; i += batchSize) {
      const batch = allVideos.slice(i, i + batchSize).filter(v => !processedIds.has(v.id))
      
      const titlePromises = batch.map(async (video) => {
        if (video.title && video.title.length > 3) {
          return { id: video.id, title: video.title }
        }
        
        try {
          const url = `https://www.youtube.com/watch?v=${video.id}`
          const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
            signal: AbortSignal.timeout(5000)
          })
          if (oembedResponse.ok) {
            const oembedData = await oembedResponse.json()
            return { id: video.id, title: oembedData.title || '' }
          }
        } catch (e) {
          // Ignore timeout errors
        }
        return { id: video.id, title: '' }
      })

      const results = await Promise.all(titlePromises)
      
      for (const result of results) {
        if (processedIds.has(result.id)) continue
        if (videos.length >= 100) break
        
        processedIds.add(result.id)
        
        let title = result.title || `שיעור מהרב אורן נזרית`
        let category = 'כללי'

        // Decode HTML entities
        title = title
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")

        // Categorize based on title
        for (const [cat, patterns] of Object.entries(categoryPatterns)) {
          if (patterns.some(pattern => title.includes(pattern))) {
            category = cat
            break
          }
        }

        videos.push({
          youtube_url: `https://www.youtube.com/watch?v=${result.id}`,
          title,
          category,
          description: null,
          series: null,
        })
      }
      
      console.log(`Processed batch, total videos: ${videos.length}`)
    }

    console.log(`Final count: ${videos.length} videos ready for import`)

    if (videos.length > 0) {
      // Delete existing lessons
      const { error: deleteError } = await supabase.from('lessons').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      if (deleteError) {
        console.error('Delete error:', deleteError)
      }
      
      // Insert new videos
      const { error: insertError } = await supabase.from('lessons').insert(videos)
      if (insertError) {
        console.error('Insert error:', insertError)
        throw insertError
      }
    }

    // Return summary by category
    const categoryCounts: Record<string, number> = {}
    for (const video of videos) {
      categoryCounts[video.category] = (categoryCounts[video.category] || 0) + 1
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: videos.length, 
        categories: categoryCounts,
        sampleVideos: videos.slice(0, 5) 
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
