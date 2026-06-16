/**
 * A `fetch` wrapper that retries transient NETWORK failures — the kind that
 * surface as `TypeError: fetch failed` with an underlying `ENOTFOUND` /
 * `EAI_AGAIN` (flaky DNS), `ECONNRESET`, `ETIMEDOUT`, or undici connect timeout.
 *
 * On some dev networks the local resolver intermittently drops the Supabase
 * host for a moment, which made the AI tutor (and other Supabase calls) fail
 * with "Une erreur est survenue" even though the next attempt succeeds. A few
 * short retries make those blips invisible. Real HTTP responses (including
 * 4xx/5xx) are returned as-is and never retried — we only retry when `fetch`
 * itself throws before getting a response.
 */
const TRANSIENT =
  /ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET|ECONNREFUSED|UND_ERR_CONNECT_TIMEOUT|fetch failed|network|socket hang up/i

export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fetch(input, init)
    } catch (err) {
      lastErr = err
      const cause = (err as { cause?: { code?: string; message?: string } }).cause
      const haystack = `${cause?.code ?? ''} ${cause?.message ?? ''} ${
        err instanceof Error ? err.message : String(err)
      }`
      if (!TRANSIENT.test(haystack)) throw err
      // 150ms, 300ms, 450ms — quick recovery from a momentary DNS/connect blip.
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)))
    }
  }
  throw lastErr
}
