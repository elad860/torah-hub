import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hebrew year calculation: given a Gregorian date, determine the Hebrew year name
function getHebrewYear(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-based
  const day = date.getDate()

  // Approximate Rosh Hashana dates (1 Tishrei)
  // These are approximate - Rosh Hashana falls in Sep/Oct
  const roshHashanaDates: Record<number, [number, number]> = {
    2010: [9, 9], 2011: [9, 29], 2012: [9, 17], 2013: [9, 5],
    2014: [9, 25], 2015: [9, 14], 2016: [10, 3], 2017: [9, 21],
    2018: [9, 10], 2019: [9, 30], 2020: [9, 19], 2021: [9, 7],
    2022: [9, 26], 2023: [9, 16], 2024: [10, 3], 2025: [9, 23],
    2026: [9, 12], 2027: [10, 2], 2028: [9, 21], 2029: [9, 10],
    2030: [9, 28],
  }

  // Determine Hebrew year number
  let hebrewYearNum: number
  const rh = roshHashanaDates[year]
  if (rh) {
    const rhDate = new Date(year, rh[0] - 1, rh[1])
    hebrewYearNum = date >= rhDate ? year + 3761 : year + 3760
  } else {
    // Fallback: assume Rosh Hashana is ~Sep 15
    hebrewYearNum = (month > 8 || (month === 8 && day >= 15)) ? year + 3761 : year + 3760
  }

  // Convert to Hebrew year name
  const hebrewYearNames: Record<number, string> = {
    5770: 'תש"ע', 5771: 'תשע"א', 5772: 'תשע"ב', 5773: 'תשע"ג',
    5774: 'תשע"ד', 5775: 'תשע"ה', 5776: 'תשע"ו', 5777: 'תשע"ז',
    5778: 'תשע"ח', 5779: 'תשע"ט', 5780: 'תש"פ', 5781: 'תשפ"א',
    5782: 'תשפ"ב', 5783: 'תשפ"ג', 5784: 'תשפ"ד', 5785: 'תשפ"ה',
    5786: 'תשפ"ו', 5787: 'תשפ"ז', 5788: 'תשפ"ח', 5789: 'תשפ"ט',
    5790: 'תש"צ', 5791: 'תשצ"א',
  }

  return hebrewYearNames[hebrewYearNum] || `${hebrewYearNum}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({}))
    const batchSize = body.batchSize || 500
    const table = body.table || 'both' // 'articles', 'podcasts', or 'both'

    let articlesUpdated = 0
    let podcastsUpdated = 0

    // Process articles
    if (table === 'articles' || table === 'both') {
      let offset = 0
      while (true) {
        const { data: articles } = await supabase
          .from('articles')
          .select('id, created_at, source_video_id')
          .is('hebrew_year', null)
          .range(offset, offset + batchSize - 1)

        if (!articles || articles.length === 0) break

        // For articles with source_video_id, try to get the lesson's published_at
        for (const article of articles) {
          let dateToUse = new Date(article.created_at)

          if (article.source_video_id) {
            const { data: lesson } = await supabase
              .from('lessons')
              .select('published_at')
              .eq('youtube_url', `https://www.youtube.com/watch?v=${article.source_video_id}`)
              .maybeSingle()

            if (lesson?.published_at) {
              dateToUse = new Date(lesson.published_at)
            }
          }

          const hebrewYear = getHebrewYear(dateToUse)
          const { error } = await supabase
            .from('articles')
            .update({ hebrew_year: hebrewYear })
            .eq('id', article.id)

          if (!error) articlesUpdated++
        }

        if (articles.length < batchSize) break
        offset += batchSize
      }
    }

    // Process podcasts - use created_at directly for speed
    if (table === 'podcasts' || table === 'both') {
      const { data: podcasts } = await supabase
        .from('podcasts')
        .select('id, created_at')
        .is('hebrew_year', null)
        .limit(batchSize)

      if (podcasts) {
        for (const podcast of podcasts) {
          const hebrewYear = getHebrewYear(new Date(podcast.created_at))
          const { error } = await supabase
            .from('podcasts')
            .update({ hebrew_year: hebrewYear })
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
    console.error('Error populating hebrew year:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
