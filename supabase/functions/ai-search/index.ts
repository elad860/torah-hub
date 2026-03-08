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
    const { query } = await req.json()
    if (!query || query.trim().length === 0) {
      throw new Error('Query is required')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Search across all content tables
    const searchTerm = `%${query}%`

    const [lessonsRes, articlesRes, podcastsRes] = await Promise.all([
      supabase
        .from('lessons')
        .select('id, title, youtube_url, category, series, published_at')
        .ilike('title', searchTerm)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(20),
      supabase
        .from('articles')
        .select('id, title, category, download_url, content_text, created_at')
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},content_text.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('podcasts')
        .select('id, title, description, spotify_url, audio_url, content_text, created_at')
        .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},content_text.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    const context = []

    if (lessonsRes.data?.length) {
      context.push('שיעורי וידאו שנמצאו:')
      for (const l of lessonsRes.data) {
        context.push(`- "${l.title}" (קטגוריה: ${l.category}${l.series ? ', סדרה: ' + l.series : ''}) - ${l.youtube_url}`)
      }
    }

    if (articlesRes.data?.length) {
      context.push('\nמאמרים/גליונות שנמצאו:')
      for (const a of articlesRes.data) {
        const snippet = a.content_text ? ` | תוכן: ${a.content_text.substring(0, 300)}...` : ''
        context.push(`- "${a.title}" (קטגוריה: ${a.category})${a.download_url ? ' - קישור: ' + a.download_url : ''}${snippet}`)
      }
    }

    if (podcastsRes.data?.length) {
      context.push('\nהקלטות/פודקאסטים שנמצאו:')
      for (const p of podcastsRes.data) {
        const snippet = p.content_text ? ` | תוכן: ${p.content_text.substring(0, 300)}...` : ''
        context.push(`- "${p.title}"${p.description ? ' (' + p.description + ')' : ''} - ${p.audio_url || p.spotify_url}${snippet}`)
      }
    }

    const contextStr = context.length > 0 
      ? context.join('\n') 
      : 'לא נמצאו תוצאות רלוונטיות במאגר.'

    const systemPrompt = `אתה עוזר חכם באתר של הרב אורן נזרית (ערוץ "יגדיל תורה"). 
תפקידך לעזור למשתמשים למצוא שיעורים, מאמרים ופודקאסטים רלוונטיים.
ענה בעברית, בצורה ידידותית וברורה.
אם נמצאו תוצאות, הצג אותן בצורה מסודרת עם קישורים.
אם לא נמצאו תוצאות, הצע למשתמש לנסות מילות חיפוש אחרות.
אל תמציא תוכן שלא קיים במאגר.`

    const userPrompt = `שאלת המשתמש: "${query}"

להלן תוצאות החיפוש במאגר:
${contextStr}

בבקשה ענה למשתמש בהתבסס על התוצאות.`

    // Stream response from Lovable AI
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
        return new Response(JSON.stringify({ error: 'יותר מדי בקשות, נסה שוב בעוד דקה' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'נדרשת הוספת קרדיטים' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const t = await aiResponse.text()
      console.error('AI gateway error:', aiResponse.status, t)
      throw new Error('AI gateway error')
    }

    return new Response(aiResponse.body, {
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
