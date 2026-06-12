import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractMcqs, type GeminiSource } from '@/lib/gemini'

export const maxDuration = 300

const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/markdown']
const MAX_BYTES = 15 * 1024 * 1024 // 15 MB

/** Validate a File and convert it to a Gemini source (text inline, or base64 for binaries). */
async function fileToSource(
  file: File
): Promise<{ ok: true; source: GeminiSource } | { ok: false; error: string }> {
  if (file.size > MAX_BYTES) {
    return { ok: false, error: 'Fichier trop volumineux (max 15 Mo).' }
  }
  const mimeType = file.type || 'application/octet-stream'
  const isText = mimeType.startsWith('text/') || /\.(txt|md)$/i.test(file.name)
  if (!isText && !ACCEPTED.includes(mimeType)) {
    return { ok: false, error: 'Type de fichier non supporté. Utilisez PDF, PNG, JPG ou TXT.' }
  }
  if (isText) {
    return { ok: true, source: { kind: 'text', text: await file.text() } }
  }
  const buffer = Buffer.from(await file.arrayBuffer())
  return { ok: true, source: { kind: 'file', buffer, mimeType, name: file.name } }
}

export async function POST(request: Request) {
  // ── Admin gate ──
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

  // ── Read files ──
  let questionsFile: File | null = null
  let correctionsFile: File | null = null
  try {
    const form = await request.formData()
    const q = form.get('file')
    const c = form.get('corrections')
    if (q instanceof File) questionsFile = q
    if (c instanceof File) correctionsFile = c
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }

  if (!questionsFile) {
    return NextResponse.json({ error: 'Aucun fichier de questions fourni.' }, { status: 400 })
  }

  // ── Build sources ──
  const questions = await fileToSource(questionsFile)
  if (!questions.ok) {
    return NextResponse.json({ error: questions.error }, { status: 400 })
  }

  let corrections: GeminiSource | undefined
  if (correctionsFile) {
    const c = await fileToSource(correctionsFile)
    if (!c.ok) {
      return NextResponse.json({ error: `Corrigé : ${c.error}` }, { status: 400 })
    }
    corrections = c.source
  }

  // ── Extract via Gemini ──
  try {
    const mcqs = await extractMcqs(questions.source, corrections)
    return NextResponse.json({ mcqs })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de l'extraction."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
