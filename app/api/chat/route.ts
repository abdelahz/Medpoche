import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  embedQuery,
  streamTutorAnswer,
  transcribeImageQuestion,
  type ContextBlock,
  type ChatTurn,
  type ImagePart,
} from '@/lib/gemini'
import { parseMcqRef } from '@/lib/mcq-ref'
import { getAiInstructions } from '@/app/actions/settings'
import { checkAiQuota, recordAiUsage } from '@/lib/usage'
import { PLAN_LIMITS, isUnlimited } from '@/lib/plans'
import type { ChunkMatch, Plan } from '@/types'

// 60s = Vercel Hobby max. On Pro you can raise this (up to 300) for longer answers.
export const maxDuration = 60

const MIN_SIMILARITY = 0.4
const TOP_K = 10
const MAX_CONTEXT = 6
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

interface Source {
  title: string
  page: number | null
}

function b64Header(value: string): string {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}

function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (h): h is ChatTurn =>
        !!h &&
        typeof (h as ChatTurn).text === 'string' &&
        ((h as ChatTurn).role === 'user' || (h as ChatTurn).role === 'model')
    )
    .slice(-6)
    .map((h) => ({ role: h.role, text: String(h.text).slice(0, 4000) }))
}

function streamText(text: string, headers: Record<string, string>): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Non authentifié.', { status: 401 })

  // Parse either JSON (text only) or multipart (with a photo).
  let question = ''
  let history: ChatTurn[] = []
  let image: ImagePart | undefined

  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    question = String(form.get('question') ?? '').trim()
    try {
      history = sanitizeHistory(JSON.parse(String(form.get('history') ?? '[]')))
    } catch {
      history = []
    }
    const file = form.get('image')
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_IMAGE_BYTES) return new Response('Image trop volumineuse.', { status: 413 })
      const buffer = Buffer.from(await file.arrayBuffer())
      image = { data: buffer.toString('base64'), mimeType: file.type || 'image/jpeg' }
    }
  } else {
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return new Response('Requête invalide.', { status: 400 })
    }
    const b = (body ?? {}) as { question?: unknown; history?: unknown }
    question = typeof b.question === 'string' ? b.question.trim() : ''
    history = sanitizeHistory(b.history)
  }

  if (!question && !image) return new Response('Question vide.', { status: 400 })

  // ── Daily AI quota (cost/abuse safety) ──
  // The tutor is the only metered feature; limits scale with the student's plan.
  const isPhoto = !!image
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  const plan = ((profile?.plan as Plan) ?? 'gratuit') as Plan

  // Free plans don't include the AI tutor at all — return a feature lock, not a
  // "daily limit" message (the UI already shows a lock screen; this guards the API).
  const limits = PLAN_LIMITS[plan]
  if (!isUnlimited(limits.aiMessages) && limits.aiMessages === 0) {
    return new Response(
      "L'assistant IA est réservé aux abonnés Basic et Premium. Passe à un plan supérieur pour l'utiliser.",
      { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Quota-Exceeded': 'feature' } }
    )
  }

  const quota = await checkAiQuota(supabase, user.id, plan, isPhoto)
  if (!quota.allowed) {
    const message =
      quota.reason === 'photos'
        ? "Tu as utilisé toutes tes questions par photo pour aujourd'hui 📸 Reviens demain, ou passe à un plan supérieur pour continuer sans limite."
        : "Tu as utilisé toutes tes questions IA pour aujourd'hui 🌙 Reviens demain, ou passe à un plan supérieur pour continuer sans limite."
    return new Response(message, {
      status: 429,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Quota-Exceeded': quota.reason },
    })
  }

  // Quota is charged once an answer actually starts streaming (see below), so a
  // hard model failure that produces no output doesn't cost the user a message.

  // Photo path: read the question off the image; abstain if unreadable.
  let retrievalQuery = question
  if (image) {
    const ocr = await transcribeImageQuestion(image)
    if (!ocr.readable && !question) {
      // An unreadable photo still consumed an OCR call — count it (and curbs spam).
      await recordAiUsage(supabase, user.id, 'photo')
      return streamText(
        "Je n'arrive pas à bien lire la question sur la photo. Reprends-la nette, bien cadrée et lisible, puis renvoie-la 🙂",
        { 'X-Question': b64Header('Question par photo (illisible)'), 'X-Sources': b64Header('[]') }
      )
    }
    retrievalQuery = [question, ocr.text].filter(Boolean).join('\n')
  }

  const questionForPrompt = question || retrievalQuery || 'Question fournie en photo.'

  // Retrieve grounded context (best-effort).
  let context: ContextBlock[] = []
  const sources: Source[] = []
  try {
    if (retrievalQuery.trim()) {
      const embedding = await embedQuery(retrievalQuery)
      const { data } = await supabase.rpc('match_chunks', {
        query_embedding: embedding,
        match_count: TOP_K,
        filter_module: null,
      })
      const kept = ((data ?? []) as ChunkMatch[])
        .filter((c) => c.similarity >= MIN_SIMILARITY)
        // Float PRIMARY-reference chunks to the front (stable, so similarity order
        // is preserved within each tier). They only match relevant questions, so a
        // physique-chimie tips book never intrudes on a maths/SVT answer.
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        .slice(0, MAX_CONTEXT)

      // Only sources that ALSO exist in the student library may be named/cited;
      // internal references (tips books, scans, cadres) are used silently.
      const titles = Array.from(
        new Set(kept.map((c) => c.source_title).filter((t): t is string => !!t))
      )
      const libTitles = new Set<string>()
      if (titles.length) {
        const { data: lib } = await supabase.from('library').select('title').in('title', titles)
        for (const l of lib ?? []) libTitles.add(String(l.title).trim().toLowerCase())
      }
      const inLibrary = (t: string | null) => !!t && libTitles.has(t.trim().toLowerCase())

      context = kept.map((c) => ({
        source: c.source_title ?? 'Document',
        page: c.page,
        content: c.content,
        priority: (c.priority ?? 0) > 0,
        inLibrary: inLibrary(c.source_title),
      }))
      // Citation chips: library resources only (the student can actually open them).
      const seen = new Set<string>()
      for (const c of kept) {
        if (!inLibrary(c.source_title)) continue
        const key = `${c.source_title}|${c.page}`
        if (!seen.has(key)) {
          seen.add(key)
          sources.push({ title: c.source_title ?? 'Document', page: c.page })
        }
      }
    }
  } catch {
    // ignore — answer without retrieved context
  }

  // Direct MCQ reference (e.g. "explique la question 3 de SVT 2022") → fetch the
  // exact QCM by position/matière/année and put it at the FRONT of the context,
  // so the tutor answers from that question's real text, options and correction.
  try {
    const ref = parseMcqRef(question || retrievalQuery)
    if (ref) {
      let mq = createAdminClient()
        .from('mcqs')
        .select('question, option_a, option_b, option_c, option_d, option_e, correct, explanation, module, year, exam_blanc, position')
        .eq('status', 'ready')
        .eq('position', ref.position)
      if (ref.module) mq = mq.eq('module', ref.module)
      if (ref.year !== null) mq = mq.eq('year', ref.year)
      if (ref.examBlanc) mq = mq.eq('exam_blanc', ref.examBlanc)
      const { data: refMcqs } = await mq.order('year', { ascending: false }).limit(4)
      const blocks: ContextBlock[] = (refMcqs ?? []).map((m) => {
        const options = [
          `A) ${m.option_a}`,
          `B) ${m.option_b}`,
          `C) ${m.option_c}`,
          `D) ${m.option_d}`,
          m.option_e ? `E) ${m.option_e}` : '',
        ]
          .filter(Boolean)
          .join('\n')
        const label = `QCM ${[m.module, m.year, m.exam_blanc].filter(Boolean).join(' ')} — question ${m.position}`
        const content = `${label} :\n${m.question}\n${options}\nBonne réponse : ${m.correct}${
          m.explanation ? `\nExplication officielle : ${m.explanation}` : ''
        }`
        return { source: label, page: null, content, priority: true, inLibrary: false }
      })
      if (blocks.length) context = [...blocks, ...context]
    }
  } catch {
    // ignore — answer without the referenced MCQ
  }

  const instructions = await getAiInstructions()

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let charged = false
      try {
        for await (const piece of streamTutorAnswer({
          question: questionForPrompt,
          context,
          history,
          instructions,
          image,
        })) {
          // Charge the quota only once the answer actually starts streaming — a
          // failed call (no output) won't consume the user's daily message.
          if (!charged) {
            charged = true
            void recordAiUsage(supabase, user.id, isPhoto ? 'photo' : 'text')
          }
          controller.enqueue(encoder.encode(piece))
        }
      } catch (err) {
        console.error('[chat] streamTutorAnswer failed:', err)
        controller.enqueue(encoder.encode('\n\n*Une erreur est survenue. Réessaie dans un instant.*'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Sources': Buffer.from(JSON.stringify(sources)).toString('base64'),
      // The text the server treated as the question (typed text or OCR), so the
      // client can persist a meaningful chat_history entry for photo messages.
      'X-Question': b64Header(questionForPrompt),
    },
  })
}
