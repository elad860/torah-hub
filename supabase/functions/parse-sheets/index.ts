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

interface CellData {
  text: string
  url: string | null
}

interface ParsedItem {
  title: string
  category: string
  url: string
  type: 'article' | 'podcast'
}

// Fetch sheet data with hyperlinks using Google Sheets API
async function fetchSheetWithHyperlinks(sheetId: string, apiKey: string): Promise<CellData[][]> {
  // Use includeGridData to get hyperlinks
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?includeGridData=true&ranges=A:Z&key=${apiKey}`
  const res = await fetch(url)
  
  if (!res.ok) {
    const text = await res.text()
    console.error('Sheets API error:', res.status, text)
    throw new Error(`Sheets API failed (${res.status})`)
  }
  
  const data = await res.json()
  const rows: CellData[][] = []
  
  const sheet = data.sheets?.[0]
  if (!sheet?.data?.[0]?.rowData) {
    console.log('No row data found')
    return rows
  }
  
  for (const rowData of sheet.data[0].rowData) {
    const cells: CellData[] = []
    if (rowData.values) {
      for (const cell of rowData.values) {
        const text = cell.formattedValue || cell.effectiveValue?.stringValue || ''
        // Hyperlink can be in cell.hyperlink or in cell.textFormatRuns
        let url: string | null = cell.hyperlink || null
        
        // Also check effectiveFormat for link
        if (!url && cell.effectiveFormat?.textFormat?.link?.uri) {
          url = cell.effectiveFormat.textFormat.link.uri
        }
        
        // Check textFormatRuns for inline hyperlinks
        if (!url && cell.textFormatRuns) {
          for (const run of cell.textFormatRuns) {
            if (run.format?.link?.uri) {
              url = run.format.link.uri
              break
            }
          }
        }
        
        cells.push({ text: text.trim(), url })
      }
    }
    rows.push(cells)
  }
  
  return rows
}

function parseSheetData(rows: CellData[][]): ParsedItem[] {
  const items: ParsedItem[] = []
  let currentCategory = 'כללי'

  for (const row of rows) {
    if (!row[0] || row[0].text.length === 0) continue
    
    // Skip metadata
    if (row[0].text.includes('ניתן לסייע') || row[0].text.includes('נדרים פלוס')) continue

    // Check if any non-first cell has a URL
    const hasUrls = row.slice(1).some(c => c.url)
    
    if (!hasUrls) {
      // Header row
      if (row[0].text.length > 1 && !row[0].url) {
        currentCategory = row[0].text
      }
      continue
    }

    const title = row[0].text

    for (let i = 1; i < row.length; i++) {
      const cell = row[i]
      if (!cell.url) continue
      if (isYouTubeUrl(cell.url)) continue

      if (isAudioLink(cell.text)) {
        items.push({ title, category: currentCategory, url: cell.url, type: 'podcast' })
      } else {
        items.push({ title, category: currentCategory, url: cell.url, type: 'article' })
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

    const apiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured (also used for Sheets API)')

    console.log('Parsing sheet:', sheetUrl)

    const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)
    if (!sheetIdMatch) throw new Error('Invalid Google Sheets URL')
    const sheetId = sheetIdMatch[1]

    const rows = await fetchSheetWithHyperlinks(sheetId, apiKey)
    console.log(`Parsed ${rows.length} rows with hyperlink data`)

    const items = parseSheetData(rows)
    console.log(`Extracted ${items.length} items (articles: ${items.filter(i => i.type === 'article').length}, podcasts: ${items.filter(i => i.type === 'podcast').length})`)

    if (debug) {
      return new Response(
        JSON.stringify({
          success: true,
          debug: true,
          sampleRows: rows.slice(0, 10).map(r => r.map(c => ({ text: c.text.substring(0, 80), url: c.url }))),
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
