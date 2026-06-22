import type { PracticeQuestion } from '@/types'

/**
 * sessionStorage key used to hand a pre-built question off to the AI tutor.
 * The QCM runner stores a prompt here, then navigates to /student/ia; the tutor
 * reads + clears it on mount and pre-fills the composer. We use sessionStorage
 * (not the URL) so long stems and image markdown don't bloat the address bar.
 */
export const ASK_STORAGE_KEY = 'mp-ask'

/** Drop markdown image embeds (base64 QCM images can't ride along as text). */
function stripImages(md: string): string {
  return md.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\n{3,}/g, '\n\n').trim()
}

/** Build a tutor prompt asking for an explanation of a QCM and its answer. */
export function buildExplainPrompt(q: PracticeQuestion): string {
  const opts: [string, string][] = [
    ['A', q.option_a],
    ['B', q.option_b],
    ['C', q.option_c],
    ['D', q.option_d],
    ...(q.option_e ? ([['E', q.option_e]] as [string, string][]) : []),
  ]
  const rendered = opts.map(([k, t]) => `${k}) ${stripImages(t)}`).join('\n')
  const stem = stripImages(q.question)
  const matiere = q.module ? ` de ${q.module}` : ''
  return `Explique-moi cette question${matiere} :\n\n${stem}\n\n${rendered}\n\nLa bonne réponse est ${q.correct}. Explique pourquoi, simplement.`
}
