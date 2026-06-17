import 'server-only'

/**
 * A reference to a specific QCM inside a free-text question, e.g.
 * "explique la question 3 de SVT 2022" → { position: 3, module: 'SVT', year: 2022 }.
 * Lets the AI tutor pull the exact MCQ (text + answer + explanation) instead of
 * relying on semantic retrieval, which can't pinpoint "question N".
 */
export interface McqRef {
  position: number
  module: string | null
  year: number | null
  examBlanc: string | null
}

/** Parse an MCQ reference from a question. Returns null when none is found. */
export function parseMcqRef(text: string): McqRef | null {
  const t = (text ?? '').toLowerCase()

  // A question number, e.g. "question 3", "qcm 3", "q3", "n°3", "numéro 3", "exercice 3".
  const num = t.match(/(?:questions?|qcm|q|n[°o]|num[ée]ro|exercice|item)\s*\.?\s*(\d{1,2})\b/)
  if (!num) return null
  const position = Number(num[1])

  const yearMatch = t.match(/\b(20[0-3]\d)\b/)
  const year = yearMatch ? Number(yearMatch[1]) : null

  let matiere: string | null = null
  if (/\b(maths?|math[ée]matiques?)\b/.test(t)) matiere = 'Mathématiques'
  else if (/\bchimie\b/.test(t)) matiere = 'Chimie'
  else if (/\bphysiques?\b/.test(t)) matiere = 'Physique'
  else if (/\b(svt|biologie|sciences? de la vie)\b/.test(t)) matiere = 'SVT'

  const eb = t.match(/examens?\s*blancs?\s*(?:n[°o]\s*)?(\d+)/)
  const examBlanc = eb ? `Examen blanc ${eb[1]}` : null

  // Need at least one locator besides the number, or it's too ambiguous to use.
  if (!matiere && year === null && !examBlanc) return null
  return { position, module: matiere, year, examBlanc }
}
