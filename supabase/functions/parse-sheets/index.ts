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
  // Last row
  row.push(current.trim())
  if (row.some(cell => cell.length > 0)) rows.push(row)

  return rows
}

// Extract URL from markdown-style link or plain URL
function extractUrl(cell: string): string | null {
  // Markdown link: [text](url)
  const mdMatch = cell.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/)
  if (mdMatch) return mdMatch[1]
  // Plain URL
  const urlMatch = cell.match(/(https?:\/\/[^\s,]+)/)
  if (urlMatch) return urlMatch[1]
  return null
}

// Extract link text from markdown link
function extractLinkText(cell: string): string | null {
  const mdMatch = cell.match(/\[(.*?)\]\(/)
  if (mdMatch) return mdMatch[1]
  return null
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isAudioLink(cell: string): boolean {
  const text = cell.toLowerCase()
  return text.includes('לשמיעת') || text.includes('שמיעה') || text.includes('audio')
}

function isDownloadLink(cell: string): boolean {
  const text = cell.toLowerCase()
  return text.includes('להורדת') || text.includes('הורדה') || text.includes('גליון') || text.includes('pdf') || text.includes('download')
}

function isHeaderRow(row: string[]): boolean {
  // A header row has content only in the first column (or first is non-empty, rest are empty)
  if (!row[0] || row[0].trim().length === 0) return false
  const otherCells = row.slice(1)
  return otherCells.every(cell => !cell || cell.trim().length === 0 || !extractUrl(cell))
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
    // Skip empty rows
    if (!row[0] || row[0].trim().length === 0) continue

    // Check if this is a header/category row
    if (isHeaderRow(row)) {
      currentCategory = row[0].trim()
      continue
    }

    const title = row[0].trim()

    // Process each cell (skip first which is title)
    for (let i = 1; i < row.length; i++) {
      const cell = row[i]
      if (!cell || cell.trim().length === 0) continue

      const url = extractUrl(cell)
      if (!url) continue

      // Skip YouTube links
      if (isYouTubeUrl(url)) continue

      // Determine type based on link text
      if (isAudioLink(cell)) {
        items.push({ title, category: currentCategory, url, type: 'podcast' })
      } else if (isDownloadLink(cell)) {
        items.push({ title, category: currentCategory, url, type: 'article' })
      } else {
        // Default: treat as article/download
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
    const { sheetUrl, sourceVideoId } = await req.json()
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

    // Extract items
    const items = parseSheetData(rows)
    console.log('Extracted items:', items.length, '(articles:', items.filter(i => i.type === 'article').length, ', podcasts:', items.filter(i => i.type === 'podcast').length, ')')

    // Insert into Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const articles = items
      .filter(i => i.type === 'article')
      .map(i => ({
        title: i.title,
        content: i.title, // Use title as content placeholder
        category: i.category,
        download_url: i.url,
        source_video_id: sourceVideoId || null,
      }))

    const podcasts = items
      .filter(i => i.type === 'podcast')
      .map(i => ({
        title: i.title,
        spotify_url: i.url, // Reuse spotify_url field for audio links
        audio_url: i.url,
        description: i.category,
        source_video_id: sourceVideoId || null,
      }))

    let articlesInserted = 0
    let podcastsInserted = 0

    if (articles.length > 0) {
      // Avoid duplicates: check by download_url
      for (let i = 0; i < articles.length; i += 50) {
        const batch = articles.slice(i, i + 50)
        const { error } = await supabase
          .from('articles')
          .upsert(batch, { onConflict: 'download_url', ignoreDuplicates: true })
        if (error) {
          // If upsert fails (no unique constraint), fall back to insert with duplicate check
          console.log('Upsert not supported, using manual check')
          for (const item of batch) {
            const { data: existing } = await supabase
              .from('articles')
              .select('id')
              .eq('download_url', item.download_url)
              .limit(1)
            if (!existing?.length) {
              const { error: insertError } = await supabase.from('articles').insert(item)
              if (!insertError) articlesInserted++
              else console.error('Article insert error:', insertError)
            }
          }
          continue
        }
        articlesInserted += batch.length
      }
    }

    if (podcasts.length > 0) {
      for (let i = 0; i < podcasts.length; i += 50) {
        const batch = podcasts.slice(i, i + 50)
        for (const item of batch) {
          const { data: existing } = await supabase
            .from('podcasts')
            .select('id')
            .eq('audio_url', item.audio_url)
            .limit(1)
          if (!existing?.length) {
            const { error: insertError } = await supabase.from('podcasts').insert(item)
            if (!insertError) podcastsInserted++
            else console.error('Podcast insert error:', insertError)
          }
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
