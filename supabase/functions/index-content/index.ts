import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { requireAdmin } from '../_shared/auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // 🔒 Admin-only
  const auth = await requireAdmin(req)
  if (!auth.ok) return auth.response

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const limit = body.limit || 200
    const table = body.table || 'both'

    let articlesUpdated = 0
    let podcastsUpdated = 0

    if (table === 'articles' || table === 'both') {
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, category, source_video_id, content_text')
        .is('content_text', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (articles) {
        for (const article of articles) {
          let contentText = `${article.title}. קטגוריה: ${article.category}.`
          
          if (article.source_video_id) {
            const { data: lesson } = await supabase
              .from('lessons')
              .select('title')
              .eq('youtube_url', `https://www.youtube.com/watch?v=${article.source_video_id}`)
              .limit(1)
              .maybeSingle()
            
            if (lesson) {
              contentText += ` מתוך שיעור: ${lesson.title}.`
            }
          }

          const { error } = await supabase
            .from('articles')
            .update({ content_text: contentText })
            .eq('id', article.id)

          if (!error) articlesUpdated++
        }
      }
    }

    if (table === 'podcasts' || table === 'both') {
      const { data: podcasts } = await supabase
        .from('podcasts')
        .select('id, title, description, source_video_id, content_text')
        .is('content_text', null)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (podcasts) {
        for (const podcast of podcasts) {
          let contentText = `${podcast.title}.`
          if (podcast.description) {
            contentText += ` ${podcast.description}.`
          }
          
          if (podcast.source_video_id) {
            const { data: lesson } = await supabase
              .from('lessons')
              .select('title')
              .eq('youtube_url', `https://www.youtube.com/watch?v=${podcast.source_video_id}`)
              .limit(1)
              .maybeSingle()
            
            if (lesson) {
              contentText += ` מתוך שיעור: ${lesson.title}.`
            }
          }

          const { error } = await supabase
            .from('podcasts')
            .update({ content_text: contentText })
            .eq('id', podcast.id)

          if (!error) podcastsUpdated++
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, articlesUpdated, podcastsUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error indexing content:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})