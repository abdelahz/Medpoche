import 'server-only'
import { NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'
import type { GeminiSource } from '@/lib/gemini'

/** Pages processed per `/step` call — small enough to stay well under the 60s wall. */
export const BATCH_PAGES = 4

/** Bucket holding the admin's uploaded source files during extraction. */
export const EXTRACTIONS_BUCKET = 'extractions'

/**
 * Authenticate the caller and require admin. Returns the server Supabase client
 * + user, or a ready-to-return NextResponse on failure (use `instanceof NextResponse`).
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs.' }, { status: 403 })
  }
  return { supabase, user }
}

function ext(path: string): string {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)$/)
  return m ? m[1] : ''
}

function isPdf(path: string): boolean {
  return ext(path) === 'pdf'
}

function isText(path: string): boolean {
  return ext(path) === 'txt' || ext(path) === 'md'
}

function imageMime(path: string): string {
  return ext(path) === 'png' ? 'image/png' : 'image/jpeg'
}

/** Page count of a source file. Images and text count as a single page (one batch). */
export async function countPages(bytes: Uint8Array, path: string): Promise<number> {
  if (!isPdf(path)) return 1
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  return doc.getPageCount()
}

/**
 * Build the Gemini source for the questions batch covering pages `[start, end)`.
 * PDFs are sliced into a sub-PDF; images/text are passed whole (they are one batch).
 */
export async function buildBatchSource(
  bytes: Uint8Array,
  path: string,
  start: number,
  end: number
): Promise<GeminiSource> {
  if (isText(path)) {
    return { kind: 'text', text: Buffer.from(bytes).toString('utf8') }
  }
  if (!isPdf(path)) {
    return { kind: 'file', buffer: Buffer.from(bytes), mimeType: imageMime(path), name: path }
  }
  const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const out = await PDFDocument.create()
  const indices = Array.from({ length: end - start }, (_, i) => start + i)
  const pages = await out.copyPages(src, indices)
  pages.forEach((p) => out.addPage(p))
  const sliced = await out.save()
  return { kind: 'file', buffer: Buffer.from(sliced), mimeType: 'application/pdf', name: path }
}

/** Build a whole-document Gemini source (used for the corrections file every batch). */
export function buildWholeSource(bytes: Uint8Array, path: string): GeminiSource {
  if (isText(path)) {
    return { kind: 'text', text: Buffer.from(bytes).toString('utf8') }
  }
  const mimeType = isPdf(path) ? 'application/pdf' : imageMime(path)
  return { kind: 'file', buffer: Buffer.from(bytes), mimeType, name: path }
}
