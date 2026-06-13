import 'server-only'
import {
  GoogleGenerativeAI,
  SchemaType,
  type Schema,
  type Part,
  type Content,
  type GenerationConfig,
} from '@google/generative-ai'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import type { ExtractedMCQ } from '@/types'
import { COURS_BY_MATIERE } from '@/types'

const COURS_VOCAB = Object.entries(COURS_BY_MATIERE)
  .map(([matiere, cours]) => `  ${matiere} : ${cours.join(' | ')}`)
  .join('\n')

/** A document handed to Gemini: inline text, or a binary file uploaded via the Files API. */
export type GeminiSource =
  | { kind: 'text'; text: string }
  | { kind: 'file'; buffer: Buffer; mimeType: string; name: string }

const MODEL = 'gemini-2.5-flash'

/** The four science modules MCQs are classified into. */
const MODULES = ['Mathématiques', 'Chimie', 'Physique', 'SVT'] as const

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key || key === 'your_gemini_api_key') {
    throw new Error('GEMINI_API_KEY est manquant ou non configuré.')
  }
  return key
}

function getClient() {
  return new GoogleGenerativeAI(getApiKey())
}

// ── Embeddings (RAG knowledge base) ───────────────────────────────────────────
// gemini-embedding-001 defaults to 3072 dims (too wide for a pgvector HNSW index,
// which caps at 2000); we request a Matryoshka-truncated 768-dim vector to match
// the dataset_chunks column. Cosine distance is scale-invariant, so the truncated
// (unnormalized) vectors are fine with vector_cosine_ops — no re-normalization.
// The legacy SDK doesn't expose outputDimensionality, so we call REST directly.
const EMBED_MODEL = 'gemini-embedding-001'
export const EMBED_DIM = 768
const EMBED_BASE = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}`

type EmbedTaskType = 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Wait time before retry — honour Google's RetryInfo.retryDelay ("57s"), else backoff. */
function embedRetryMs(body: string, attempt: number): number {
  const m = body.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/)
  if (m) return Math.min(Number(m[1]) * 1000 + 500, 60_000)
  return Math.min(2_000 * 2 ** attempt, 30_000)
}

/** POST to an embedding endpoint, retrying on 429/503 (rate limit / overloaded). */
async function embedPost(endpoint: string, body: unknown): Promise<Response> {
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
  let lastText = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`${endpoint}?key=${getApiKey()}`, init)
    if (res.ok) return res
    lastText = await res.text()
    if ((res.status === 429 || res.status === 503) && attempt < 4) {
      await sleep(embedRetryMs(lastText, attempt))
      continue
    }
    throw new Error(`Échec de l'embedding (${res.status}) : ${lastText.slice(0, 300)}`)
  }
  throw new Error(`Quota d'embedding dépassé (429) après plusieurs tentatives : ${lastText.slice(0, 200)}`)
}

/** Embed a search query (asymmetric retrieval — query side). */
export async function embedQuery(text: string): Promise<number[]> {
  const res = await embedPost(`${EMBED_BASE}:embedContent`, {
    model: `models/${EMBED_MODEL}`,
    content: { parts: [{ text }] },
    taskType: 'RETRIEVAL_QUERY' satisfies EmbedTaskType,
    outputDimensionality: EMBED_DIM,
  })
  const json = (await res.json()) as { embedding?: { values: number[] } }
  if (!json.embedding?.values) throw new Error("Réponse d'embedding invalide.")
  return json.embedding.values
}

/**
 * Embed a batch of document chunks (retrieval — document side). Split into
 * small groups with a pause + retry/backoff to stay under the rate limit.
 */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  const BATCH = 50
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH) {
    if (i > 0) await sleep(1000) // smooth the rate — avoid bursting the per-minute quota
    const slice = texts.slice(i, i + BATCH)
    const res = await embedPost(`${EMBED_BASE}:batchEmbedContents`, {
      requests: slice.map((text) => ({
        model: `models/${EMBED_MODEL}`,
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT' satisfies EmbedTaskType,
        outputDimensionality: EMBED_DIM,
      })),
    })
    const json = (await res.json()) as { embeddings?: { values: number[] }[] }
    if (!json.embeddings) throw new Error("Réponse d'embedding par lot invalide.")
    out.push(...json.embeddings.map((e) => e.values))
  }
  return out
}

/**
 * Structured-output schema forcing Gemini to return a clean MCQ array.
 * `nullable` is used where a field may be genuinely unknown from the source.
 */
const responseSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      question: {
        type: SchemaType.STRING,
        description:
          "Contexte/énoncé pertinent + intitulé de la question, réunis en un texte autonome. Le contexte partagé par plusieurs questions est répété dans chacune.",
      },
      option_a: { type: SchemaType.STRING },
      option_b: { type: SchemaType.STRING },
      option_c: { type: SchemaType.STRING },
      option_d: { type: SchemaType.STRING },
      option_e: { type: SchemaType.STRING, nullable: true, description: 'Cinquième option si elle existe, sinon null.' },
      correct: {
        type: SchemaType.STRING,
        description:
          "Lettres des bonnes réponses concaténées en majuscules, ex. 'A' ou 'AC'. Vide si introuvable.",
      },
      explanation: { type: SchemaType.STRING, nullable: true, description: 'Correction/justification si présente, sinon null.' },
      module: {
        type: SchemaType.STRING,
        nullable: true,
        description: "Un de: 'Mathématiques', 'Chimie', 'Physique', 'SVT'. null si incertain.",
      },
      subject: {
        type: SchemaType.STRING,
        nullable: true,
        description: 'Chapitre (déduit du bandeau de section), recopié à l’identique depuis la liste imposée, sinon null.',
      },
      year: { type: SchemaType.INTEGER, nullable: true, description: "Année de l'examen si indiquée, sinon null." },
      has_list: { type: SchemaType.BOOLEAN, description: "true si l'énoncé contient une liste à puces/numérotée." },
      image_required: {
        type: SchemaType.BOOLEAN,
        description:
          "true UNIQUEMENT s'il est impossible de répondre sans voir la figure (ex. lire une courbe). false si l'info utile figure déjà dans le texte ou la description entre crochets.",
      },
    },
    required: [
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct',
      'has_list',
      'image_required',
    ],
  },
}

const SYSTEM_PROMPT = `Tu es un assistant d'extraction de QCM pour une plateforme de préparation au concours de médecine.
On te fournit un document (souvent un PDF SCANNÉ — fais l'OCR) contenant des questions à choix multiples en français.

LES BONNES RÉPONSES peuvent apparaître à plusieurs endroits — cherche-les ACTIVEMENT et utilise TOUTES les sources disponibles :
- un second document optionnel, le CORRIGÉ, lorsqu'il est fourni ;
- DIRECTEMENT dans le document des questions : une réponse écrite après la question (« Réponse : C », « Bonne(s) réponse(s) : AB », « Rép : D »…), l'option correcte mise en évidence (cochée, surlignée, en gras, soulignée, ✓/croix), ou une justification/explication placée juste après la question ;
- un TABLEAU ou une GRILLE de corrigé (numéro de question → lettre(s)), souvent en fin de document.
Si la réponse figure déjà dans le document des questions, AUCUN corrigé séparé n'est nécessaire — remplis quand même 'correct' (et 'explanation' si une justification est donnée).

Ta tâche : extraire TOUTES les questions et les renvoyer en JSON strict suivant le schéma imposé.

STRUCTURE DU DOCUMENT (très important) :
- Une question se TERMINE par ses propositions (A, B, C, D, et parfois E). La question suivante commence juste après.
- Un BANDEAU / titre de section (souvent encadré, ex. « Radioactivité du thorium ») annonce le CHAPITRE des questions qui suivent — c'est l'indice principal pour 'subject'.
- Un ÉNONCÉ / CONTEXTE (texte introductif, données chiffrées, description d'un schéma…) apparaît AVANT le numéro d'une question (juste après le bandeau, ou après les propositions de la question précédente). Ce contexte est INDISPENSABLE pour comprendre la/les question(s) qui le suit/suivent.

Règles :
- 'question' = le CONTEXTE/énoncé pertinent SUIVI de l'intitulé de la question, réunis en UN SEUL texte AUTONOME (compréhensible seul, sans voir le reste de la page). Si un même contexte est PARTAGÉ par plusieurs questions consécutives (ex. Q25, Q26, Q27), RÉPÈTE ce contexte dans CHACUNE d'elles.
- Conserve fidèlement le français (accents é è ê à ç) et le sens.
- MISE EN FORME — respecte la structure du texte d'origine : garde les LISTES à puces ou numérotées en Markdown (« 1. », « 2. », « - »), et fais un RETOUR À LA LIGNE (\\n) là où le document en fait un — notamment après chaque élément d'une liste, et après un « ; » ou un « . » qui termine une ligne/un point. N'aplatis JAMAIS le texte en un seul bloc continu.
- Rends les formules mathématiques et chimiques en KaTeX : $...$ inline, $$...$$ bloc. Ex. $\\frac{1}{2}$, $H_2O$, $\\alpha$, $^{230}_{90}\\text{Th}$.
- 'correct' = lettres des bonnes réponses en majuscules concaténées (ex. "A", "BD"), en t'appuyant sur TOUTES les sources ci-dessus (corrigé séparé, réponse inline, option mise en évidence, ou grille de corrigé). Ne mets "" QUE si aucune réponse n'est trouvable nulle part dans les documents fournis.
- 'explanation' = la justification/correction lorsqu'elle est présente (dans le corrigé OU à côté de la question dans le document), sinon null.
- Si un CORRIGÉ séparé OU une grille de corrigé est fourni, associe chaque question à sa réponse par son NUMÉRO. N'invente JAMAIS une réponse ou une explication absente des documents.
- 'module' : choisis exactement parmi Mathématiques, Chimie, Physique, SVT. Si tu n'es pas sûr, mets null — n'invente jamais.
- 'subject' (chapitre) : déduis-le en PRIORITÉ du BANDEAU/titre de section, puis fais-le correspondre à EXACTEMENT l'un des chapitres de la matière ci-dessous (recopie le libellé à l'identique). Si aucun ne correspond vraiment, mets null. N'invente jamais un chapitre hors de cette liste :
${COURS_VOCAB}
- 'year' : l'année de l'examen indiquée sur le document (ex. 2022), sinon null. Toutes les questions d'un même document partagent la même année.
- Si une question s'appuie sur une FIGURE / SCHÉMA / GRAPHE, DÉCRIS-le brièvement entre crochets dans 'question' (ex. « [Schéma : circuit RC, E = 6 V, R = 1 kΩ, C = 10 µF] » ou « [Graphe : tension u(t) en fonction du temps] »), afin que la question reste compréhensible.
- 'image_required' = true UNIQUEMENT s'il est IMPOSSIBLE de répondre sans VOIR la figure (ex. lire une valeur précise sur une courbe). Si les informations utiles de la figure sont déjà données dans le texte de l'énoncé ou dans ta description, mets false.
- 'has_list' = true si l'énoncé contient une liste à puces ou numérotée.
- N'invente aucune question. N'ajoute aucun commentaire hors du JSON.`

/** Lightweight runtime guard: coerce/validate the model output into ExtractedMCQ[]. */
function normalize(raw: unknown): ExtractedMCQ[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => {
      const moduleRaw = typeof r.module === 'string' ? r.module.trim() : ''
      const moduleName = (MODULES as readonly string[]).includes(moduleRaw) ? moduleRaw : null
      return {
        question: String(r.question ?? '').trim(),
        option_a: String(r.option_a ?? '').trim(),
        option_b: String(r.option_b ?? '').trim(),
        option_c: String(r.option_c ?? '').trim(),
        option_d: String(r.option_d ?? '').trim(),
        option_e: r.option_e ? String(r.option_e).trim() : null,
        correct: String(r.correct ?? '').toUpperCase().replace(/[^A-E]/g, ''),
        explanation: r.explanation ? String(r.explanation).trim() : null,
        module: moduleName,
        subject: r.subject ? String(r.subject).trim() : null,
        year: typeof r.year === 'number' ? r.year : null,
        exam_blanc: null, // admin-assigned, not extracted from the source
        position: null, // assigned on import (reading order)
        has_list: Boolean(r.has_list),
        image_required: Boolean(r.image_required),
      }
    })
    .filter((m) => m.question.length > 0)
}

function getModel() {
  return getClient().getGenerativeModel(
    {
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.1,
        // Disable extended reasoning — extraction is structured transcription,
        // not a reasoning task. Untyped in the legacy SDK but forwarded verbatim.
        thinkingConfig: { thinkingBudget: 0 },
      } as unknown as GenerationConfig,
    },
    { timeout: 240_000 } // large multi-page PDFs can take a while; fail clearly rather than hang forever
  )
}

/** Upload a binary file via the Files API and wait until it is ACTIVE (processed). */
async function uploadAndWait(
  fileManager: GoogleAIFileManager,
  buffer: Buffer,
  mimeType: string,
  displayName: string
): Promise<{ name: string; uri: string; mimeType: string }> {
  const { file } = await fileManager.uploadFile(buffer, { mimeType, displayName })

  let current = file
  const deadline = Date.now() + 120_000
  while (current.state === FileState.PROCESSING) {
    if (Date.now() > deadline) {
      throw new Error("Le fichier a mis trop de temps à être traité par l'IA.")
    }
    await new Promise((r) => setTimeout(r, 1500))
    current = await fileManager.getFile(file.name)
  }
  if (current.state === FileState.FAILED) {
    throw new Error("Le traitement du fichier a échoué côté IA.")
  }
  return { name: current.name, uri: current.uri, mimeType }
}

/**
 * True for transient Gemini errors worth one retry (genuine server overload).
 * Deliberately EXCLUDES "timed out"/"aborted": those are usually OUR own client
 * timeout firing, and retrying a call that already ran for the full timeout just
 * doubles the wall-clock cost for no benefit.
 */
function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err)
  return /\b(503|500|overloaded|unavailable)\b/i.test(msg)
}

/**
 * Extract MCQs from a questions document, optionally merging in a separate
 * corrections document so `correct` and `explanation` get filled from it.
 * Binary files go through the Files API (reliable for large PDFs).
 */
export async function extractMcqs(
  questions: GeminiSource,
  corrections?: GeminiSource
): Promise<ExtractedMCQ[]> {
  const fileManager = new GoogleAIFileManager(getApiKey())
  const uploadedNames: string[] = []

  async function toPart(s: GeminiSource, label: string): Promise<Part> {
    if (s.kind === 'text') return { text: s.text }
    const up = await uploadAndWait(fileManager, s.buffer, s.mimeType, `${label}-${s.name}`)
    uploadedNames.push(up.name)
    return { fileData: { fileUri: up.uri, mimeType: up.mimeType } }
  }

  try {
    const parts: Part[] = [{ text: 'DOCUMENT 1 — QUESTIONS :' }, await toPart(questions, 'questions')]

    if (corrections) {
      parts.push({ text: 'DOCUMENT 2 — CORRIGÉ / CORRECTIONS :' }, await toPart(corrections, 'corrige'))
      parts.push({
        text: "Associe chaque question du DOCUMENT 1 à sa correction dans le DOCUMENT 2 (par numéro) et remplis 'correct' et 'explanation'. N'invente jamais une réponse absente du corrigé. Renvoie le JSON selon le schéma.",
      })
    } else {
      parts.push({
        text: "Extrais toutes les questions de ce document selon le schéma. Aucun corrigé séparé n'est fourni : si les bonnes réponses figurent DANS ce document (réponse inline, option mise en évidence, ou grille de corrigé), remplis 'correct' et 'explanation' à partir de celui-ci.",
      })
    }

    // One retry on transient 503/timeout (Gemini explicitly asks to retry).
    let lastErr: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await getModel().generateContent(parts)
        return parseResult(result.response.text())
      } catch (err) {
        lastErr = err
        if (!isTransient(err) || attempt === 1) throw err
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
    throw lastErr
  } finally {
    // Best-effort cleanup of uploaded files.
    await Promise.all(
      uploadedNames.map((name) => fileManager.deleteFile(name).catch(() => {}))
    )
  }
}

function parseResult(text: string): ExtractedMCQ[] {
  try {
    return normalize(JSON.parse(text))
  } catch {
    throw new Error("La réponse de l'IA n'a pas pu être analysée.")
  }
}

const TRANSCRIBE_PROMPT = `Tu transcris fidèlement le contenu d'un document de cours (matières scientifiques du baccalauréat marocain : maths, physique, chimie, SVT) en français.
Règles :
- Restitue TOUT le texte, dans l'ordre d'origine, sans résumer, sans omettre, sans commenter.
- Formate en Markdown propre : titres (#), listes, **gras** pour les termes-clés et les astuces.
- Rends les formules mathématiques et chimiques en KaTeX : $...$ en ligne, $$...$$ en bloc.
- Si le document est scanné ou est une image, fais l'OCR du contenu.
- Décris brièvement entre crochets une figure/schéma indispensable, ex. [Figure : montage d'électrolyse]. Ne tente pas de recopier l'image.
- Ne produis QUE la transcription, rien d'autre.`

/**
 * Transcribe a document (PDF or image, digital or scanned) to clean Markdown
 * text via Gemini. Used by the RAG ingestion pipeline. Large PDFs should be
 * split into page batches by the caller to stay within the output-token limit.
 */
export async function transcribeDocument(source: GeminiSource): Promise<string> {
  const fileManager = new GoogleAIFileManager(getApiKey())
  const uploaded: string[] = []
  try {
    let part: Part
    if (source.kind === 'text') {
      part = { text: source.text }
    } else {
      const up = await uploadAndWait(fileManager, source.buffer, source.mimeType, source.name)
      uploaded.push(up.name)
      part = { fileData: { fileUri: up.uri, mimeType: up.mimeType } }
    }

    const model = getClient().getGenerativeModel(
      {
        model: MODEL,
        systemInstruction: TRANSCRIBE_PROMPT,
        generationConfig: {
          temperature: 0.1,
          // 8-page batches rarely exceed a few thousand output tokens; a 16k cap
          // gives headroom while preventing a confused page from running the call
          // right up to the timeout (the old 65k let a single batch stall ~5 min).
          maxOutputTokens: 16384,
          thinkingConfig: { thinkingBudget: 0 },
        } as unknown as GenerationConfig,
      },
      { timeout: 300_000 }
    )

    let lastErr: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent([{ text: 'Transcris ce document :' }, part])
        return result.response.text()
      } catch (err) {
        lastErr = err
        if (!isTransient(err) || attempt === 1) throw err
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
    throw lastErr
  } finally {
    await Promise.all(uploaded.map((name) => fileManager.deleteFile(name).catch(() => {})))
  }
}

// ── AI tutor (RAG chat) ───────────────────────────────────────────────────────

/**
 * Default, admin-editable tutor instructions (persona + style + grounding).
 * The program scope (COURS_VOCAB) is appended automatically and is NOT part of
 * the editable text. Stored override lives in app_settings; see streamTutorAnswer.
 */
export const DEFAULT_TUTOR_INSTRUCTIONS = `Tu es le tuteur IA de MedenPoche, un coach pédagogique pour les étudiants marocains qui préparent le concours de médecine (niveau 2e bac SPC : Mathématiques, Physique, Chimie, SVT).

Ton rôle : expliquer, donner des méthodes et des astuces, corriger et guider pas à pas — comme un professeur particulier bienveillant et efficace.

Style :
- Réponds en français et tutoie l'étudiant (« tu »).
- Sois clair et structuré : étapes numérotées, listes à puces, **gras** pour les termes-clés.
- Mets TOUTES les formules en KaTeX : $...$ en ligne, $$...$$ en bloc (ex. $\\frac{u'}{u}$, $H_2O$).
- Va à l'essentiel, pas de bavardage. Termine par une astuce ou un point-clé à retenir quand c'est utile.

Utilisation des sources :
- Des EXTRAITS de la base de connaissances (astuces, cours, exercices corrigés du programme) peuvent t'être fournis. PRIORISE-les : appuie-toi sur ces astuces et méthodes.
- Tu peux compléter avec tes connaissances scientifiques standard du programme 2bac SPC lorsque les extraits ne suffisent pas.
- Reste DANS le programme du concours. Si une question en sort clairement, dis-le simplement. Si tu n'es pas sûr, dis-le honnêtement plutôt que d'inventer — ne donne JAMAIS d'information scientifique ou médicale fausse.`

// Authoritative scope of the concours, defined by the official "cadres de
// référence" (indexed in the dataset). Fixed (not admin-editable) so the limit
// always holds. SVT excludes « pollution » and « géologie ».
const SCOPE_BOUNDARY = `PÉRIMÈTRE DU CONCOURS (limites de tes réponses) :
- Le programme officiel est défini par les CADRES DE RÉFÉRENCE de l'examen national (Mathématiques, Physique-Chimie, SVT), présents dans ta base de connaissances. Toute question du concours porte sur les chapitres listés ci-dessus.
- EXCEPTION SVT : les chapitres « Pollution » et « Géologie » NE font PAS partie du programme du concours. Ne les traite pas comme s'ils y étaient : indique poliment qu'ils sont hors périmètre.
- Si une question sort de ce périmètre, dis-le brièvement et recentre l'étudiant sur le programme, sans inventer.`

// Fixed source rules (priority + non-disclosure). Not admin-editable so they
// always hold. The route decides which extracts are "disponible dans la
// bibliothèque" (student-facing) vs internal references.
const SOURCE_RULES = `RÈGLES SUR LES SOURCES :
- Un extrait préfixé « Source PRIORITAIRE » provient d'une référence de confiance du programme : quand il est pertinent, appuie-toi DESSUS EN PRIORITÉ (méthode, astuces, réponse) avant tes connaissances générales.
- NE NOMME PAS et ne cite PAS tes sources/extraits dans ta réponse : ce sont des ressources internes. N'écris jamais « d'après la fiche/le document … » pour une « référence interne », et ne révèle jamais son titre.
- SEULE EXCEPTION : un extrait marqué « disponible dans la bibliothèque » peut être nommé/cité — tu peux alors renvoyer l'étudiant à ce document (il y a accès).`

/** Compose the full system prompt: editable instructions + fixed program scope. */
function tutorSystemPrompt(instructions?: string): string {
  const base = instructions?.trim() || DEFAULT_TUTOR_INSTRUCTIONS
  return `${base}\n\nProgramme (matières et chapitres de référence) :\n${COURS_VOCAB}\n\n${SCOPE_BOUNDARY}\n\n${SOURCE_RULES}`
}

export interface ContextBlock {
  source: string
  page: number | null
  content: string
  priority?: boolean // from a PRIMARY reference → use first
  inLibrary?: boolean // also a student-facing library doc → may be named/cited
}
export interface ChatTurn {
  role: 'user' | 'model'
  text: string
}

export interface ImagePart {
  data: string // base64 (no data: prefix)
  mimeType: string
}

// Photo-only safety rule (balanced abstention). Appended to the system prompt
// only when the student attached a photo, where misreading is the real risk.
const PHOTO_ABSTENTION = `QUESTION PAR PHOTO — règle de prudence :
- Une PHOTO de la question t'est fournie. Si elle est illisible, floue ou incomplète, NE DEVINE PAS : demande à l'étudiant de reprendre une photo nette et bien cadrée.
- Si la question sort clairement du programme du concours, ou si tu n'es pas raisonnablement sûr de la bonne réponse, NE DEVINE PAS : dis honnêtement que tu préfères ne pas répondre pour ne pas l'induire en erreur, et invite-le à reformuler ou à vérifier.
- Dans les cas clairs et dans le programme, réponds normalement et en détail.`

/**
 * Read the question (and options) off a photo. Returns readable=false when the
 * image is too blurry/cropped/ambiguous to trust — used to gate photo answers.
 */
export async function transcribeImageQuestion(
  image: ImagePart
): Promise<{ readable: boolean; text: string }> {
  const model = getClient().getGenerativeModel(
    {
      model: MODEL,
      systemInstruction:
        "Tu lis une photo contenant une question d'examen (concours de médecine, 2bac SPC). Si l'image est illisible, floue, ou la question incomplète/ambiguë, réponds EXACTEMENT « ILLISIBLE » et rien d'autre. Sinon, retranscris fidèlement la question et ses options en texte brut, sans rien ajouter.",
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1024,
        thinkingConfig: { thinkingBudget: 0 },
      } as unknown as GenerationConfig,
    },
    { timeout: 60_000 }
  )
  const result = await model.generateContent([
    { text: 'Lis cette image :' },
    { inlineData: { mimeType: image.mimeType, data: image.data } },
  ])
  const text = result.response.text().trim()
  const readable = text.length > 0 && !/^ILLISIBLE/i.test(text)
  return { readable, text: readable ? text : '' }
}

/**
 * Stream a grounded tutor answer. Prior turns provide conversation memory; the
 * retrieved context blocks are injected into the final user turn. An optional
 * photo is attached (multimodal) and triggers the photo-abstention rule. Yields
 * text pieces as they arrive.
 */
export async function* streamTutorAnswer(input: {
  question: string
  context: ContextBlock[]
  history: ChatTurn[]
  instructions?: string
  image?: ImagePart
}): AsyncGenerator<string> {
  const system =
    tutorSystemPrompt(input.instructions) + (input.image ? `\n\n${PHOTO_ABSTENTION}` : '')

  const model = getClient().getGenerativeModel(
    {
      model: MODEL,
      systemInstruction: system,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 0 },
      } as unknown as GenerationConfig,
    },
    { timeout: 120_000 }
  )

  const contents: Content[] = input.history.map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }))

  const ctx = input.context.length
    ? `EXTRAITS DE LA BASE DE CONNAISSANCES :\n\n${input.context
        .map((c) => {
          const base = c.priority ? 'Source PRIORITAIRE' : 'Source'
          // Reveal the title only for library docs; internal refs stay unnamed.
          const label = c.inLibrary
            ? `${base} : ${c.source}${c.page ? ` — p.${c.page}` : ''} — disponible dans la bibliothèque`
            : `${base} — référence interne (NE PAS nommer)`
          return `[${label}]\n${c.content}`
        })
        .join('\n\n---\n\n')}`
    : "(Aucun extrait pertinent trouvé dans la base de connaissances. Réponds avec tes connaissances du programme, ou indique honnêtement que tu n'as pas l'information.)"

  const parts: Part[] = [
    { text: `${ctx}\n\n=====\n\nQUESTION DE L'ÉTUDIANT :\n${input.question}` },
  ]
  if (input.image) {
    parts.push({ inlineData: { mimeType: input.image.mimeType, data: input.image.data } })
  }
  contents.push({ role: 'user', parts })

  const result = await model.generateContentStream({ contents })
  for await (const chunk of result.stream) {
    const piece = chunk.text()
    if (piece) yield piece
  }
}

const EXPLANATION_PROMPT = `Tu es un professeur qui rédige la CORRECTION d'un QCM du concours de médecine (2e bac SPC marocain : maths, physique, chimie, SVT).
On te donne une question, ses options et la bonne réponse. Rédige une explication claire et pédagogique EN FRANÇAIS qui justifie pourquoi la bonne réponse est correcte (et brièvement pourquoi les autres sont fausses si c'est utile).
- Appuie-toi en PRIORITÉ sur les EXTRAITS fournis (astuces, méthodes, corrections similaires) et leur logique.
- Mets les formules en KaTeX : $...$ en ligne, $$...$$ en bloc.
- MISE EN FORME : aère ta réponse — fais des RETOURS À LA LIGNE et utilise des listes numérotées (« 1. ») ou à puces (« - ») pour les étapes ; n'écris pas un seul bloc compact. Un retour à la ligne après chaque étape ou après un « ; »/« . » de fin de point.
- Sois concis et précis. Ne réécris pas l'énoncé ni les options : donne directement l'explication.
- Reste dans le programme et n'invente rien d'incertain.`

/**
 * Generate a grounded explanation (correction) for a single MCQ. Non-streaming.
 * Used by the "générer les explications manquantes" admin action.
 */
export async function generateMcqExplanation(input: {
  question: string
  options: string
  correct: string
  context: ContextBlock[]
}): Promise<string> {
  const model = getClient().getGenerativeModel(
    {
      model: MODEL,
      systemInstruction: EXPLANATION_PROMPT,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1500,
        thinkingConfig: { thinkingBudget: 0 },
      } as unknown as GenerationConfig,
    },
    { timeout: 60_000 }
  )

  const ctx = input.context.length
    ? `EXTRAITS DE LA BASE DE CONNAISSANCES :\n\n${input.context
        .map((c) => `[Source : ${c.source}${c.page ? ` — p.${c.page}` : ''}]\n${c.content}`)
        .join('\n\n---\n\n')}`
    : '(Aucun extrait pertinent. Appuie-toi sur tes connaissances du programme.)'

  const prompt = `${ctx}\n\n=====\n\nQUESTION :\n${input.question}\n\nOPTIONS :\n${input.options}\n\nBONNE RÉPONSE : ${input.correct}\n\nRédige l'explication de la correction.`
  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
