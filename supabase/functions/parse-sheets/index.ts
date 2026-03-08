import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isAudioLink(text: string): boolean {
  return text.includes('לשמיעת') || text.includes('שמיעה') || text.includes('לשמיעה')
}

interface ParsedItem {
  title: string
  category: string
  url: string
  type: 'article' | 'podcast'
}

// Try multiple export strategies
async function fetchSheetContent(sheetId: string): Promise<{ rows: string[][], format: string }> {
  // Strategy 1: Google Sheets API (public access, no auth needed for public sheets)
  try {
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:Z?key=${Deno.env.get('YOUTUBE_API_KEY')}`
    const res = await fetch(apiUrl)
    if (res.ok) {
      const data = await res.json()
      if (data.values) {
        console.log('Fetched via Sheets API')
        return { rows: data.values, format: 'api-plain' }
      }
    }
  } catch (e) {
    console.log('Sheets API failed:', e)
  }

  // Strategy 2: TSV export (sometimes works better than CSV for preserving structure)
  try {
    const tsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=tsv`
    const res = await fetch(tsvUrl, { redirect: 'follow' })
    if (res.ok) {
      const text = await res.text()
      const rows = text.split('\n').map(line => line.split('\t').map(c => c.trim()))
      console.log('Fetched via TSV export')
      return { rows, format: 'tsv' }
    }
  } catch (e) {
    console.log('TSV export failed:', e)
  }

  // Strategy 3: CSV export as fallback
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
  const res = await fetch(csvUrl, { redirect: 'follow' })
  if (!res.ok) throw new Error(`All export strategies failed (${res.status})`)
  const text = await res.text()
  const rows = text.split('\n').map(line => {
    // Simple CSV parse
    const cells: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (inQuotes) {
        if (ch === '"') inQuotes = false
        else current += ch
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === ',') { cells.push(current.trim()); current = '' }
        else current += ch
      }
    }
    cells.push(current.trim())
    return cells
  })
  console.log('Fetched via CSV export')
  return { rows, format: 'csv' }
}

function parseSheetRows(rows: string[][]): ParsedItem[] {
  const items: ParsedItem[] = []
  let currentCategory = 'כללי'

  for (const row of rows) {
    if (!row[0] || row[0].trim().length === 0) continue
    const firstCell = row[0].trim()
    
    // Skip metadata
    if (firstCell.includes('ניתן לסייע') || firstCell.includes('נדרים פלוס')) continue

    // Check for URLs in cells
    const cellUrls: Array<{url: string, text: string}> = []
    for (let i = 0; i < row.length; i++) {
      const cell = row[i] || ''
      // Extract URLs from cell
      const urlMatches = cell.match(/https?:\/\/[^\s,)"]+/g)
      if (urlMatches) {
        for (const url of urlMatches) {
          cellUrls.push({ url, text: cell })
        }
      }
    }

    // If no URLs found, this might be a header row
    if (cellUrls.length === 0) {
      // Check if other cells are empty (header pattern)
      const otherCellsEmpty = row.slice(1).every(c => !c || c.trim().length === 0 || !c.match(/https?:\/\//))
      if (otherCellsEmpty && firstCell.length > 1) {
        currentCategory = firstCell
      }
      continue
    }

    // This is a data row with URLs
    // If the cell text is just "לשמיעת השיעור לחץ כאן" without a URL,
    // that means the URLs were stripped. In that case we can't extract them.
    // But if we found URLs, process them
    for (const { url, text } of cellUrls) {
      if (isYouTubeUrl(url)) continue
      
      if (isAudioLink(text)) {
        items.push({ title: firstCell, category: currentCategory, url, type: 'podcast' })
      } else {
        items.push({ title: firstCell, category: currentCategory, url, type: 'article' })
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

    console.log('Parsing sheet:', sheetUrl)

    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!sheetIdMatch) throw new Error('Invalid Google Sheets URL')
    const sheetId = sheetIdMatch[1]

    const { rows, format } = await fetchSheetContent(sheetId)
    console.log(`Parsed ${rows.length} rows (format: ${format})`)

    const items = parseSheetRows(rows)
    console.log(`Extracted ${items.length} items (articles: ${items.filter(i => i.type === 'article').length}, podcasts: ${items.filter(i => i.type === 'podcast').length})`)

    if (debug) {
      return new Response(
        JSON.stringify({
          success: true,
          debug: true,
          format,
          sampleRows: rows.slice(0, 10).map(r => r.map(c => (c || '').substring(0, 100))),
          items: items.slice(0, 30),
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
          else console.error('Insert error:', error)
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
          else console.error('Insert error:', error)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, parsed: items.length, articlesInserted, podcastsInserted, sheetId }),
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
