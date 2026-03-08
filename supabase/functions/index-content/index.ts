import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function extractTextFromUrl(url: string, firecrawlKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error(`Firecrawl error for ${url}: ${response.status} ${errText}`)
      return null
    }

    const data = await response.json()
    const markdown = data.data?.markdown || data.markdown || null
    if (!markdown) return null

    // Truncate to ~10k chars to keep DB manageable
    return markdown.length > 10000 ? markdown.substring(0, 10000) : markdown
  } catch (e) {
    console.error(`Error extracting ${url}:`, e)
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 100
    const type = body.type || 'both' // 'articles', 'podcasts', or 'both'

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlKey) throw new Error('FIRECRAWL_API_KEY not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let articlesIndexed = 0
    let podcastsIndexed = 0
    let articleErrors = 0
    let podcastErrors = 0

    // Index articles - get those without content_text, with a download_url
    if (type === 'both' || type === 'articles') {
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, download_url')
        .not('download_url', 'is', null)
        .is('content_text', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      console.log(`Found ${articles?.length || 0} articles to index`)

      for (const article of (articles || [])) {
        if (!article.download_url) continue
        console.log(`Indexing article: \"${article.title}\" - ${article.download_url}`)
        
        const text = await extractTextFromUrl(article.download_url, firecrawlKey)
        if (text) {
          const { error } = await supabase
            .from('articles')
            .update({ content_text: text })
            .eq('id', article.id)
          if (!error) articlesIndexed++
          else { console.error('Update error:', error); articleErrors++ }
        } else {
          articleErrors++
        }

        // Small delay to respect Firecrawl rate limits
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // Index podcasts - get those without content_text, with an audio_url
    if (type === 'both' || type === 'podcasts') {
      const { data: podcasts } = await supabase
        .from('podcasts')
        .select('id, title, audio_url, spotify_url')
        .not('audio_url', 'is', null)
        .is('content_text', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      console.log(`Found ${podcasts?.length || 0} podcasts to index`)

      for (const podcast of (podcasts || [])) {
        const url = podcast.audio_url || podcast.spotify_url
        if (!url) continue
        console.log(`Indexing podcast: \"${podcast.title}\" - ${url}`)

        const text = await extractTextFromUrl(url, firecrawlKey)
        if (text) {
          const { error } = await supabase
            .from('podcasts')
            .update({ content_text: text })
            .eq('id', podcast.id)
          if (!error) podcastsIndexed++
          else { console.error('Update error:', error); podcastErrors++ }
        } else {
          podcastErrors++
        }

        await new Promise(r => setTimeout(r, 1000))
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        articlesIndexed,
        articleErrors,
        podcastsIndexed,
        podcastErrors,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Indexing error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
