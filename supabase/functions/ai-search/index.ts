import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Detect Hebrew year patterns like תשפ"ה, תשפה, תשפ״ה
function detectHebrewYear(query: string): string | null {
  // Match common patterns: תשפ"ה, תשפ״ה, תשפה, תשפ'ה
  const hebrewYearRegex = /ת[שׂ][פצקרשת][א-ת]["״'׳]?[א-ת]?/g
  const matches = query.match(hebrewYearRegex)
  if (matches && matches.length > 0) return matches[0]
  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query || query.trim().length === 0) {
      throw new Error('Query is required')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const searchTerm = `%${query}%`
    const detectedYear = detectHebrewYear(query)

    // Parallel search across all 3 tables with content_text + title
    let lessonsQuery = supabase
      .from('lessons')
      .select('id, title, youtube_url, category, series, published_at, playlist_name')
      .or(`title.ilike.${searchTerm}`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(8)

    let articlesQuery = supabase
      .from('articles')
      .select('id, title, category, download_url, content_text, created_at, hebrew_year')
      .or(`title.ilike.${searchTerm},content_text.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(8)

    let podcastsQuery = supabase
      .from('podcasts')
      .select('id, title, description, spotify_url, audio_url, content_text, created_at, hebrew_year')
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},content_text.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .limit(8)

    if (detectedYear) {
      articlesQuery = articlesQuery.eq('hebrew_year', detectedYear)
      podcastsQuery = podcastsQuery.eq('hebrew_year', detectedYear)
    }

    const [lessonsRes, articlesRes, podcastsRes] = await Promise.all([
      lessonsQuery,
      articlesQuery,
      podcastsQuery,
    ])

    // Build structured results for frontend card rendering
    interface ResultItem {
      type: 'lesson' | 'article' | 'podcast'
      id: string
      title: string
      category?: string
      series?: string
      youtube_url?: string
      download_url?: string
      audio_url?: string
      spotify_url?: string
      hebrew_year?: string | null
    }

    const structuredResults: ResultItem[] = []

    if (lessonsRes.data?.length) {
      for (const l of lessonsRes.data) {
        structuredResults.push({
          type: 'lesson',
          id: l.id,
          title: l.title,
          category: l.category,
          series: l.series ?? undefined,
          youtube_url: l.youtube_url,
        })
      }
    }

    if (articlesRes.data?.length) {
      // Group articles by title+year to merge multi-part
      const articleMap = new Map<string, ResultItem & { all_urls?: string[] }>()
      for (const a of articlesRes.data) {
        const key = `${a.title}||${a.hebrew_year ?? ''}`
        if (articleMap.has(key)) {
          if (a.download_url) {
            articleMap.get(key)!.all_urls?.push(a.download_url)
          }
        } else {
          articleMap.set(key, {
            type: 'article',
            id: a.id,
            title: a.title,
            category: a.category,
            download_url: a.download_url ?? undefined,
            hebrew_year: a.hebrew_year,
            all_urls: a.download_url ? [a.download_url] : [],
          })
        }
      }
      for (const item of articleMap.values()) {
        structuredResults.push(item)
      }
    }

    if (podcastsRes.data?.length) {
      for (const p of podcastsRes.data) {
        structuredResults.push({
          type: 'podcast',
          id: p.id,
          title: p.title,
          audio_url: p.audio_url ?? undefined,
          spotify_url: p.spotify_url,
          hebrew_year: p.hebrew_year,
        })
      }
    }

    // Build context for AI
    const context: string[] = []

    if (lessonsRes.data?.length) {
      context.push(`שיעורי וידאו שנמצאו (${lessonsRes.data.length}):`)
      for (const l of lessonsRes.data) {
        context.push(`- "${l.title}"${l.category ? ' קטגוריה: ' + l.category : ''}${l.series ? ', סדרה: ' + l.series : ''}`)
      }
    }

    if (articlesRes.data?.length) {
      context.push(`\nמאמרים שנמצאו (${articlesRes.data.length}):`)
      for (const a of articlesRes.data) {
        const snippet = a.content_text ? ` | תוכן: ${a.content_text.substring(0, 200)}...` : ''
        context.push(`- "${a.title}" (${a.category}${a.hebrew_year ? ', ' + a.hebrew_year : ''})${snippet}`)
      }
    }

    if (podcastsRes.data?.length) {
      context.push(`\nהקלטות שנמצאו (${podcastsRes.data.length}):`)
      for (const p of podcastsRes.data) {
        const snippet = p.content_text ? ` | ${p.content_text.substring(0, 200)}...` : ''
        context.push(`- "${p.title}"${p.description ? ' (' + p.description + ')' : ''}${snippet}`)
      }
    }

    const contextStr = context.length > 0
      ? context.join('\n')
      : 'לא נמצאו תוצאות רלוונטיות במאגר.'

    const hasResults = structuredResults.length > 0

    const systemPrompt = `אתה עוזר חכם ומקצועי באתר של הרב אורן נזרית ("יגדיל תורה").
תפקידך לעזור למשתמשים למצוא ולהבין שיעורים, מאמרים והקלטות.
ענה בעברית בצורה חמה, ידידותית ומכבדת.
${hasResults ? 'יש תוצאות — תאר אותן בקצרה ובהתלהבות, ציין כמה פריטים מכל סוג. אל תכלול כתובות URL בתשובתך.' : 'לא נמצאו תוצאות — הצע מילות חיפוש חלופיות.'}
אל תמציא תוכן שאינו קיים.`

    const userPrompt = `שאלת המשתמש: "${query}"
${detectedYear ? `(זוהתה שנה עברית: ${detectedYear})` : ''}

תוצאות חיפוש:
${contextStr}

ענה בצורה ידידותית ומסכמת.`

    // Encode the structured results as the FIRST SSE event
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Stream: first send structured results, then pipe AI stream
    ;(async () => {
      try {
        // Send structured results event
        const resultsJson = JSON.stringify(structuredResults)
        await writer.write(encoder.encode(`data: [RESULTS]${resultsJson}\n\n`))

        // Call AI for text response
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            stream: true,
          }),
        })

        if (!aiResponse.ok) {
          if (aiResponse.status === 429) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'יותר מדי בקשות, נסה שוב בעוד דקה' })}\n\n`))
          } else if (aiResponse.status === 402) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'נדרשת הוספת קרדיטים' })}\n\n`))
          } else {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ error: 'שגיאה בשירות AI' })}\n\n`))
          }
          await writer.close()
          return
        }

        const reader = aiResponse.body!.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          await writer.write(value)
        }
      } catch (e) {
        console.error('Stream error:', e)
      } finally {
        await writer.close().catch(() => {})
      }
    })()

    return new Response(readable, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    })
  } catch (error) {
    console.error('AI search error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
