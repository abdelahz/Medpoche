/**
 * Runs once at server startup (Node runtime).
 *
 * On some Windows/IPv6 setups, Node's fetch (undici) tries NAT64 IPv6 addresses
 * first and hangs until the 10s connect timeout, which makes outbound calls to
 * Gemini / Supabase intermittently fail (ConnectTimeoutError) — even though the
 * IPv4 route is healthy (curl works). Two settings fix it:
 *  1. ipv4first      → DNS returns IPv4 addresses first.
 *  2. autoSelectFamily off → undici stops racing IPv6 (Happy Eyeballs) and just
 *     connects to that first IPv4 address, so it never waits on a dead IPv6 path.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns')
    dns.setDefaultResultOrder('ipv4first')

    const net = await import('node:net')
    if (typeof net.setDefaultAutoSelectFamily === 'function') {
      net.setDefaultAutoSelectFamily(false)
    }

    console.log(
      '[instrumentation] dns →',
      dns.getDefaultResultOrder(),
      '| autoSelectFamily off'
    )
  }
}
