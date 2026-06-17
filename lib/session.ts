/**
 * Single active session ("newest login wins"). On each login the account's
 * `profiles.session_token` is set to a fresh value and mirrored in this cookie.
 * The middleware signs out any device whose cookie token no longer matches the
 * stored one — so an account can't be used in two places at once (logging in
 * elsewhere kicks the previous device on its next request).
 */
export const SESSION_COOKIE = 'mp_session'

/** Cookie lifetime (30 days) — long-lived, mirrors the auth session. */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
