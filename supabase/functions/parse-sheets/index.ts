import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Parse HTML table from Google Sheets export
function parseHTMLTable(html: string): string[][] {
  const rows: string[][] = []
  
  // Find all <tr> elements
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1]
    const cells: string[] = []
    
    // Find all <td> elements in this row
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let tdMatch
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      cells.push(tdMatch[1])
    }
    
    if (cells.length > 0) rows.push(cells)
  }
  
  return rows
}

// Extract URL from HTML cell content (preserves <a href> links)
function extractUrlFromHtml(cellHtml: string): { url: string | null, text: string } {
  const linkMatch = cellHtml.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
  if (linkMatch) {
    // Clean up URL (Google redirect)
    let url = linkMatch[1]
    // Google Sheets wraps links in redirects
    const googleRedirect = url.match(/[?&]q=(https?[^&]+)/)
    if (googleRedirect) {
      url = decodeURIComponent(googleRedirect[1])
    }
    const text = linkMatch[2].replace(/<[^>]+>/g, '').trim()
    return { url, text }
  }
  
  // Plain text, no link
  const plainText = cellHtml.replace(/<[^>]+>/g, '').trim()
  return { url: null, text: plainText }
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isAudioLink(text: string): boolean {
  return text.includes('לשמיעת') || text.includes('שמיעה') || text.includes('לשמיעה')
}

function isHeaderRow(cells: Array<{url: string | null, text: string}>): boolean {
  if (!cells[0] || cells[0].text.length === 0) return false
  if (cells[0].url) return false
  // No URLs in any cell
  return cells.slice(1).every(c => !c.url)
}

interface ParsedItem {
  title: string
  category: string
  url: string
  type: 'article' | 'podcast'
}

function parseSheetData(rows: string[][]): ParsedItem[] {
  const items: ParsedItem[] = []
  let currentCategory = 'כללי'

  for (const row of rows) {
    // Parse each cell for URLs and text
    const parsed = row.map(cell => extractUrlFromHtml(cell))
    
    // Skip empty rows
    if (!parsed[0] || parsed[0].text.length === 0) continue
    // Skip metadata rows
    if (parsed[0].text.includes('ניתן לסייע') || parsed[0].text.includes('נדרים')) continue

    // Check if header row
    if (isHeaderRow(parsed)) {
      currentCategory = parsed[0].text
      continue
    }

    const title = parsed[0].text

    // Process cells with URLs
    for (let i = 1; i < parsed.length; i++) {
      const { url, text } = parsed[i]
      if (!url) continue
      if (isYouTubeUrl(url)) continue

      if (isAudioLink(text)) {
        items.push({ title, category: currentCategory, url, type: 'podcast' })
      } else {
        items.push({ title, category: currentCategory, url, type: 'article' })
      }
    }
  }

  return items
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { sheetUrl, sourceVideoId, debug } = await req.json()
    if (!sheetUrl) throw new Error('sheetUrl is required')

    console.log('Parsing sheet:', sheetUrl, 'from video:', sourceVideoId)

    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!sheetIdMatch) throw new Error('Invalid Google Sheets URL: ' + sheetUrl)
    const sheetId = sheetIdMatch[1]

    // Use HTML export to preserve hyperlinks
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=html`
    console.log('Fetching HTML from:', htmlUrl)

    const htmlResponse = await fetch(htmlUrl, { redirect: 'follow' })
    if (!htmlResponse.ok) {
      throw new Error(`Failed to fetch sheet (${htmlResponse.status}): ${htmlResponse.statusText}`)
    }

    const htmlText = await htmlResponse.text()
    console.log('HTML length:', htmlText.length)

    const rows = parseHTMLTable(htmlText)
    console.log('Parsed rows:', rows.length)

    const items = parseSheetData(rows)
    console.log('Extracted items:', items.length, '(articles:', items.filter(i => i.type === 'article').length, ', podcasts:', items.filter(i => i.type === 'podcast').length, ')')

    if (debug) {
      return new Response(
        JSON.stringify({
          success: true,
          debug: true,
          sampleRows: rows.slice(0, 5).map(r => r.map(c => c.substring(0, 200))),
          items: items.slice(0, 20),
          totalRows: rows.length,
          totalItems: items.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert into DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    let articlesInserted = 0
    let podcastsInserted = 0

    for (const item of items) {
      if (item.type === 'article') {
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('download_url', item.url)
          .limit(1)
        if (!existing?.length) {
          const { error } = await supabase.from('articles').insert({
            title: item.title,
            content: item.title,
            category: item.category,
            download_url: item.url,
            source_video_id: sourceVideoId || null,
          })
          if (!error) articlesInserted++
          else console.error('Article insert error:', error)
        }
      } else {
        const { data: existing } = await supabase
          .from('podcasts')
          .select('id')
          .eq('audio_url', item.url)
          .limit(1)
        if (!existing?.length) {
          const { error } = await supabase.from('podcasts').insert({
            title: item.title,
            spotify_url: item.url,
            audio_url: item.url,
            description: item.category,
            source_video_id: sourceVideoId || null,
          })
          if (!error) podcastsInserted++
          else console.error('Podcast insert error:', error)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        parsed: items.length,
        articlesInserted,
        podcastsInserted,
        sheetId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error parsing sheet:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
