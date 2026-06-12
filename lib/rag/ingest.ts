import 'server-only'
import { PDFDocument } from 'pdf-lib'
import { transcribeDocument } from '@/lib/gemini'

// A page with at least this many extracted characters is treated as digital
// text; below it, the page is considered scanned and sent to OCR.
const MIN_TEXT_CHARS = 40
// Scanned pages are OCR'd by Gemini in page batches. 25-page batches timed out;
// 8 keeps each call's output under the token cap while limiting round-trips.
const OCR_BATCH = 8
// OCR batches run concurrently (bounded) instead of strictly serially — this is
// the main lever on total indexing time for large scanned PDFs. Keep modest to
// stay within the per-minute request quota.
const OCR_CONCURRENCY = 4

/** Run `fn` over `items` with at most `limit` in flight; preserves order. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function worker(): Promise<void> {
    while (true) {
      const i = next++
      if (i >= items.length) return
      results[i] = await fn(items[i], i)
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

export interface PageText {
  text: string
  /** 1-based page number (for citation). */
  startPage: number
}

// Minimal shape of the pdfjs legacy API we use (dynamically imported, Node-side).
interface PdfTextItem {
  str?: string
}
interface PdfTextContent {
  items: PdfTextItem[]
}
interface PdfPageProxy {
  getTextContent(): Promise<PdfTextContent>
}
interface PdfDocumentProxy {
  numPages: number
  getPage(n: number): Promise<PdfPageProxy>
  destroy(): Promise<void>
}
interface PdfjsLib {
  getDocument(src: {
    data: Uint8Array
    useWorkerFetch?: boolean
    isEvalSupported?: boolean
    useSystemFonts?: boolean
  }): { promise: Promise<PdfDocumentProxy> }
}

// Unpaired UTF-16 surrogates — Postgres rejects them when parsing the JSON
// insert body ("invalid input syntax for type json"). They appear when a chunk
// boundary slices through a surrogate pair (e.g. astral math glyphs like the
// mathematical bold letters used in formulas).
const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g
// NUL / C0+C1 control chars that Postgres `text` also rejects.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

function cleanup(text: string): string {
  return text.replace(CONTROL_CHARS, ' ').replace(/\s+/g, ' ').trim()
}

/** Make a chunk safe to store: drop unpaired surrogates Postgres can't store. */
export function pgSafe(text: string): string {
  return text.replace(LONE_SURROGATE, '')
}

/**
 * Extract a document to per-page Markdown/text. Digital PDF pages are read
 * directly with pdfjs (fast, free, exact); pages with no extractable text are
 * assumed scanned and OCR'd by Gemini in small batches. Images go straight to
 * OCR. Page numbers are preserved for citation.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  name: string
): Promise<PageText[]> {
  if (mimeType !== 'application/pdf') {
    const text = await transcribeDocument({ kind: 'file', buffer, mimeType, name })
    return [{ text: cleanup(text), startPage: 1 }]
  }

  const pdfjs = (await import('pdfjs-dist/legacy/build/pdf.mjs')) as unknown as PdfjsLib
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise

  const total = doc.numPages
  const pageTexts: (string | null)[] = []
  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i)
    const tc = await page.getTextContent()
    const text = cleanup(tc.items.map((it) => it.str ?? '').join(' '))
    pageTexts[i - 1] = text.length >= MIN_TEXT_CHARS ? text : null
  }
  await doc.destroy()

  // OCR the scanned pages (those with no extractable text), in page batches.
  const scanned = pageTexts.map((t, i) => (t === null ? i : -1)).filter((i) => i >= 0)
  if (scanned.length > 0) {
    const src = await PDFDocument.load(buffer, { ignoreEncryption: true })
    // Pre-build each batch's sub-PDF locally (pdf-lib isn't safe to run in
    // parallel against the same source doc), then OCR the batches concurrently.
    const batches: { firstIdx: number; idxs: number[]; bytes: Buffer }[] = []
    for (let b = 0; b < scanned.length; b += OCR_BATCH) {
      const idxs = scanned.slice(b, b + OCR_BATCH)
      const sub = await PDFDocument.create()
      const copied = await sub.copyPages(src, idxs)
      copied.forEach((p) => sub.addPage(p))
      batches.push({ firstIdx: idxs[0], idxs, bytes: Buffer.from(await sub.save()) })
    }

    const texts = await mapLimit(batches, OCR_CONCURRENCY, async (batch) => {
      const text = await transcribeDocument({
        kind: 'file',
        buffer: batch.bytes,
        mimeType: 'application/pdf',
        name: `${name}-ocr-p${batch.firstIdx + 1}`,
      })
      return cleanup(text)
    })

    batches.forEach((batch, bi) => {
      // Attribute the batch's OCR text to its first page.
      pageTexts[batch.firstIdx] = texts[bi]
      for (let k = 1; k < batch.idxs.length; k++) pageTexts[batch.idxs[k]] = ''
    })
  }

  const out: PageText[] = []
  pageTexts.forEach((t, i) => {
    if (t && t.trim()) out.push({ text: t, startPage: i + 1 })
  })
  return out
}

export interface Chunk {
  content: string
  page: number
  index: number
}

/** Split extracted pages into overlapping, paragraph-aware chunks. */
export function chunkPages(pages: PageText[], maxChars = 1800, overlap = 200): Chunk[] {
  const chunks: Chunk[] = []
  let index = 0
  for (const { text, startPage } of pages) {
    for (const piece of splitText(text, maxChars, overlap)) {
      const content = pgSafe(piece.trim())
      if (content.length < 20) continue
      chunks.push({ content, page: startPage, index: index++ })
    }
  }
  return chunks
}

/** Greedy paragraph packing with a character overlap between consecutive chunks. */
function splitText(text: string, maxChars: number, overlap: number): string[] {
  const paragraphs = text.split(/\n\s*\n/)
  const out: string[] = []
  let cur = ''

  const flush = () => {
    if (cur.trim()) out.push(cur.trim())
  }

  for (const para of paragraphs) {
    const p = para.trim()
    if (!p) continue

    if (cur && cur.length + p.length + 2 > maxChars) {
      flush()
      const tail = cur.slice(Math.max(0, cur.length - overlap))
      cur = `${tail}\n\n${p}`
    } else {
      cur = cur ? `${cur}\n\n${p}` : p
    }

    while (cur.length > maxChars * 1.5) {
      out.push(cur.slice(0, maxChars).trim())
      cur = cur.slice(maxChars - overlap)
    }
  }
  flush()
  return out
}
