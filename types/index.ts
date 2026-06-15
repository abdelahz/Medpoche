export type FlagValue =
  | 'missing_correction'
  | 'image_required'
  | 'ambiguous_answer'
  | 'low_confidence_module'
  | 'duplicate'

/** Bac filières (controlled list for the student profile). */
export const FILIERES = [
  'Sciences Math A',
  'Sciences Math B',
  'Sciences Physique',
  'Sciences de la Vie et de la Terre',
  'Sciences Agronomiques',
] as const
export type Filiere = (typeof FILIERES)[number]

/** Subscription tiers. Real billing wires up in Step 14; `plan` is the source of truth going forward. */
export const PLANS = ['gratuit', 'basic', 'premium'] as const
export type Plan = (typeof PLANS)[number]

/** One row of the weekly leaderboard (return shape of the weekly_leaderboard RPC). */
export interface LeaderboardRow {
  rank: number
  user_id: string
  display: string
  filiere: string | null
  xp: number
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  prenom: string | null
  nom: string | null
  filiere: string | null
  phone: string | null
  plan: Plan
  is_premium: boolean
  is_admin: boolean
  questions_today: number
  mcqs_today: number
  created_at: string
}

export interface MCQ {
  id: number
  question: string
  has_list: boolean
  image_url: string | null
  image_required: boolean
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string | null
  correct: string
  explanation: string | null
  module: string | null
  subject: string | null
  year: number | null
  exam_blanc: string | null
  position: number | null
  status: string
  flags: FlagValue[]
  created_at: string
}

/**
 * An MCQ as returned by Gemini extraction, before it is saved to the DB.
 * No id/status/flags yet — those are assigned on save. QCMs are single-answer:
 * `correct` is one letter (A–E), or "" when unknown. `exam_blanc` is admin-set
 * (not extracted), so it defaults to null.
 */
export interface ExtractedMCQ {
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string | null
  correct: string
  explanation: string | null
  module: string | null
  subject: string | null
  year: number | null
  exam_blanc: string | null
  position: number | null
  has_list: boolean
  image_required: boolean
}

export type ExtractionStatus = 'pending' | 'processing' | 'done' | 'error'

/**
 * A durable, chunked MCQ-extraction job (admin importer). The source PDF is
 * processed a few pages at a time so each request stays under the serverless
 * function time limit; `result` accumulates across batches.
 */
export interface ExtractionJob {
  id: string
  admin_id: string
  status: ExtractionStatus
  questions_path: string
  corrections_path: string | null
  cursor: number
  total_pages: number | null
  result: ExtractedMCQ[]
  error: string | null
  created_at: string
  updated_at: string
}

/** A QCM as served to the student training runner. Single-answer: `correct` is one letter. */
export interface PracticeQuestion {
  id: number
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string | null
  correct: string
  explanation: string | null
  module: string | null
  has_list: boolean
  image_required: boolean
  bookmarked: boolean
}

export type PracticeMode = 'apprentissage' | 'entrainement'

/** Facet row used to build the practice setup options (ready MCQs only). */
export interface PracticeFacet {
  module: string | null
  year: number | null
  subject: string | null
  exam_blanc: string | null
}

/** Official chapitres per matière — controlled vocabulary for tagging QCMs. */
export const COURS_BY_MATIERE: Record<string, string[]> = {
  Mathématiques: [
    'Limites et continuité',
    'Dérivation et étude de fonctions',
    'Les suites numériques',
    'Les fonctions logarithmes',
    'Les fonctions exponentielles',
    'Les nombres complexes',
    'Les fonctions primitives et calcul intégral',
    "La géométrie dans l'espace",
    'Calcul des probabilités',
  ],
  Physique: [
    'Les ondes',
    'Le nucléaire',
    "L'électricité",
    'La mécanique',
  ],
  Chimie: [
    'Cinétique chimique',
    'Équilibres chimiques',
    'Réactions acido-basiques',
    'Évolution spontanée et forcée',
    'Chimie organique',
  ],
  SVT: [
    "Consommation de la matière organique et flux d'énergie",
    "Nature et mécanisme de l'expression de l'information génétique",
    "Transmission de l'information génétique par reproduction sexuée",
    'Génétique humaine',
    'Génétique des populations',
    'Immunologie',
  ],
}

/** The four matières (modules), in display order. Canonical source. */
export const MODULES = ['Mathématiques', 'Chimie', 'Physique', 'SVT'] as const
export type Module = (typeof MODULES)[number]

export const LIBRARY_TYPES = ['Cours', 'Résumé', 'QCMs', 'Fiche', 'Annale', 'Vidéo', 'Autre'] as const
export type LibraryType = (typeof LIBRARY_TYPES)[number]

export interface LibraryItem {
  id: number
  title: string
  type: string
  module: string | null
  subject: string | null
  file_url: string | null
  created_at: string
}

export type IndexStatus = 'pending' | 'indexing' | 'indexed' | 'failed'

export interface DatasetItem {
  id: number
  title: string
  subject: string | null
  file_url: string | null
  index_status: IndexStatus
  indexed_at: string | null
  chunk_count: number
  created_at: string
  priority: number // > 0 = a primary reference; its chunks are surfaced first in retrieval
}

/** A retrieved knowledge-base chunk (return shape of the match_chunks RPC). */
export interface ChunkMatch {
  id: number
  content: string
  source_title: string | null
  page: number | null
  module: string | null
  subject: string | null
  priority?: number // source document's priority (0 for MCQ chunks)
  similarity: number
}

export interface StudentFile {
  id: number
  user_id: string
  name: string | null
  type: string | null
  url: string | null
  created_at: string
}

export interface ChatMessage {
  id: number
  user_id: string
  question: string | null
  answer: string | null
  created_at: string
}

export interface MCQAttempt {
  id: number
  user_id: string
  mcq_id: number
  selected: string | null
  is_correct: boolean | null
  created_at: string
}

export interface Bookmark {
  id: number
  user_id: string
  mcq_id: number
  created_at: string
}
