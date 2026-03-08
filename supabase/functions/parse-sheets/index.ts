import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Parse CSV content manually (handles quoted fields with commas)
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(current.trim())
        current = ''
      } else if (ch === '\n' || (ch === '\r' && text[i + 1] === '\n')) {
        row.push(current.trim())
        current = ''
        if (row.some(cell => cell.length > 0)) rows.push(row)
        row = []
        if (ch === '\r') i++
      } else {
        current += ch
      }
    }
  }
  row.push(current.trim())
  if (row.some(cell => cell.length > 0)) rows.push(row)

  return rows
}

// Extract URL from text - handles plain URLs and hyperlink formulas
function extractUrl(cell: string): string | null {
  if (!cell || cell.trim().length === 0) return null
  
  // Google Sheets HYPERLINK formula: =HYPERLINK("url","text")
  const hyperlinkMatch = cell.match(/=HYPERLINK\("([^"]+)"/)
  if (hyperlinkMatch) return hyperlinkMatch[1]
  
  // Plain URL anywhere in the cell
  const urlMatch = cell.match(/(https?:\/\/[^\s,)"]+)/)
  if (urlMatch) return urlMatch[1]
  
  return null
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isAudioLink(cell: string): boolean {
  const text = cell.toLowerCase()
  return text.includes('לשמיעת') || text.includes('שמיעה') || text.includes('audio') || text.includes('לשמיעה')
}

function isDownloadLink(cell: string): boolean {
  const text = cell.toLowerCase()
  return text.includes('להורדת') || text.includes('הורדה') || text.includes('גליון') || text.includes('pdf') || text.includes('download') || text.includes('להורדה')
}

// Check if a row is a category header
// Header rows have text in the first column and NO URLs in any other column
function isHeaderRow(row: string[]): boolean {
  if (!row[0] || row[0].trim().length === 0) return false
  // If first cell contains a URL, it's not a header
  if (extractUrl(row[0])) return false
  // Check if any other cell has a URL
  for (let i = 1; i < row.length; i++) {
    if (row[i] && extractUrl(row[i])) return false
  }
  // Must have non-trivial text in first col
  return row[0].trim().length > 1
}

interface ParsedItem {
  title: string
  category: string
  url: string
  type: 'article' | 'podcast'
  linkText: string
}

function parseSheetData(rows: string[][]): ParsedItem[] {
  const items: ParsedItem[] = []
  let currentCategory = 'כללי'

  for (const row of rows) {
    // Skip empty rows
    if (!row[0] || row[0].trim().length === 0) continue
    // Skip rows that are just URLs
    if (row[0].startsWith('http')) continue

    // Check if this is a header/category row
    if (isHeaderRow(row)) {
      // Don't use donation/metadata rows as categories
      const first = row[0].trim()
      if (first.includes('נדרים') || first.includes('תרומ') || first.includes('ניתן לסייע')) continue
      currentCategory = first
      continue
    }

    const title = row[0].trim()
    // Skip if title looks like metadata
    if (title.includes('נדרים') || title.includes('ניתן לסייע')) continue

    // Process each cell for URLs
    for (let i = 1; i < row.length; i++) {
      const cell = row[i]
      if (!cell || cell.trim().length === 0) continue

      const url = extractUrl(cell)
      if (!url) continue

      // Skip YouTube links
      if (isYouTubeUrl(url)) continue

      // Determine type
      if (isAudioLink(cell)) {
        items.push({ title, category: currentCategory, url, type: 'podcast', linkText: cell })
      } else {
        items.push({ title, category: currentCategory, url, type: 'article', linkText: cell })
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

    // Extract Google Sheets ID from URL
    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!sheetIdMatch) throw new Error('Invalid Google Sheets URL: ' + sheetUrl)
    const sheetId = sheetIdMatch[1]

    // Export as CSV (works for public sheets)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
    console.log('Fetching CSV from:', csvUrl)

    const csvResponse = await fetch(csvUrl, { redirect: 'follow' })
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch sheet (${csvResponse.status}): ${csvResponse.statusText}`)
    }

    const csvText = await csvResponse.text()
    console.log('CSV length:', csvText.length)

    // Parse CSV
    const rows = parseCSV(csvText)
    console.log('Parsed rows:', rows.length)

    // Debug: log first few rows to understand format
    if (debug || rows.length > 0) {
      console.log('Sample rows:')
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        console.log(`Row ${i}: [${rows[i].map(c => c.substring(0, 60)).join(' | ')}]`)
      }
    }

    // Extract items
    const items = parseSheetData(rows)
    console.log('Extracted items:', items.length, '(articles:', items.filter(i => i.type === 'article').length, ', podcasts:', items.filter(i => i.type === 'podcast').length, ')')

    if (debug) {
      return new Response(
        JSON.stringify({
          success: true,
          debug: true,
          csvPreview: csvText.substring(0, 2000),
          sampleRows: rows.slice(0, 15),
          items: items.slice(0, 20),
          totalRows: rows.length,
          totalItems: items.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert into Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const articles = items
      .filter(i => i.type === 'article')
      .map(i => ({
        title: i.title,
        content: i.title,
        category: i.category,
        download_url: i.url,
        source_video_id: sourceVideoId || null,
      }))

    const podcasts = items
      .filter(i => i.type === 'podcast')
      .map(i => ({
        title: i.title,
        spotify_url: i.url,
        audio_url: i.url,
        description: i.category,
        source_video_id: sourceVideoId || null,
      }))

    let articlesInserted = 0
    let podcastsInserted = 0

    for (const item of articles) {
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('download_url', item.download_url)
        .limit(1)
      if (!existing?.length) {
        const { error } = await supabase.from('articles').insert(item)
        if (!error) articlesInserted++
        else console.error('Article insert error:', error)
      }
    }

    for (const item of podcasts) {
      const { data: existing } = await supabase
        .from('podcasts')
        .select('id')
        .eq('audio_url', item.audio_url)
        .limit(1)
      if (!existing?.length) {
        const { error } = await supabase.from('podcasts').insert(item)
        if (!error) podcastsInserted++
        else console.error('Podcast insert error:', error)
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
