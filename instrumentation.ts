/**
 * Runs once at server startup (Node runtime).
 * Forces IPv4-first DNS resolution: on some Windows/IPv6 setups, undici tries
 * NAT64 IPv6 addresses first and hangs for minutes before falling back to IPv4,
 * which made outbound calls to Gemini / Supabase time out. ipv4first avoids that.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns')
    dns.setDefaultResultOrder('ipv4first')
    console.log('[instrumentation] dns result order →', dns.getDefaultResultOrder())
  }
}
