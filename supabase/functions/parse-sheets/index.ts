import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be')
}

function isAudioUrl(url: string): boolean {
  // Audio hosting sites
  return url.includes('audio.com') || url.includes('soundcloud.com') || 
         url.includes('anchor.fm') || url.includes('podcasters.spotify.com') ||
         url.includes('buzz') || url.includes('podbean')
}

function isDocumentUrl(url: string): boolean {
  // Google Drive, PDF links, document hosting
  return url.includes('drive.google.com') || url.includes('docs.google.com/document') ||
         url.toLowerCase().endsWith('.pdf') || url.includes('dropbox.com') ||
         url.includes('onedrive') || url.includes('sharepoint')
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

// Download .xlsx file from Google Drive and parse with hyperlinks
async function fetchAndParseXlsx(sheetId: string): Promise<{ rows: Array<Array<{text: string, url: string | null}>> }> {
  // Google Drive direct download for public files
  const downloadUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`
  console.log('Downloading xlsx from:', downloadUrl)
  
  const res = await fetch(downloadUrl, { redirect: 'follow' })
  if (!res.ok) {
    throw new Error(`Failed to download xlsx (${res.status})`)
  }
  
  const arrayBuffer = await res.arrayBuffer()
  console.log('Downloaded bytes:', arrayBuffer.byteLength)
  
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  
  if (!sheet) throw new Error('No sheet found in workbook')
  
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const rows: Array<Array<{text: string, url: string | null}>> = []
  
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: Array<{text: string, url: string | null}> = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[cellRef]
      
      if (!cell) {
        row.push({ text: '', url: null })
        continue
      }
      
      const text = (cell.v !== undefined && cell.v !== null) ? String(cell.v) : ''
      // Hyperlinks are stored in cell.l.Target
      const url = cell.l?.Target || null
      
      row.push({ text: text.trim(), url })
    }
    rows.push(row)
  }
  
  return { rows }
}

function parseSheetData(rows: Array<Array<{text: string, url: string | null}>>): ParsedItem[] {
  const items: ParsedItem[] = []
  let currentCategory = 'כללי'

  for (const row of rows) {
    if (!row[0] || row[0].text.length === 0) continue
    
    // Skip metadata
    if (row[0].text.includes('ניתן לסייע') || row[0].text.includes('נדרים פלוס')) continue

    // Check if any non-first cell has a URL
    const hasUrls = row.slice(1).some(c => c.url)
    
    if (!hasUrls) {
      // Header row - no links in any cell
      if (row[0].text.length > 1 && !row[0].url) {
        currentCategory = row[0].text
      }
      continue
    }

    const title = row[0].text

    for (let i = 1; i < row.length; i++) {
      const cell = row[i]
      if (!cell.url) continue
      // Skip YouTube links entirely - already synced from channel
      if (isYouTubeUrl(cell.url)) continue

      // Classify by URL pattern first, then by Hebrew text hint
      if (isAudioUrl(cell.url) || isAudioLink(cell.text)) {
        items.push({ title, category: currentCategory, url: cell.url, type: 'podcast' })
      } else if (isDocumentUrl(cell.url) || cell.url.toLowerCase().includes('.pdf')) {
        items.push({ title, category: currentCategory, url: cell.url, type: 'article' })
      }
      // If URL doesn't match audio or document patterns, skip it
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

    const { rows } = await fetchAndParseXlsx(sheetId)
    console.log(`Parsed ${rows.length} rows from xlsx`)

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
