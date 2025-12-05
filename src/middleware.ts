import { NextResponse } from 'next/server'

type Bucket = { tokens: number; last: number }
const store = (globalThis as any).__rate_limiter__ || ((globalThis as any).__rate_limiter__ = new Map<string, Bucket>())

function rateLimit(key: string, rate: number, capacity: number): boolean {
  const now = Date.now()
  const b = store.get(key) || { tokens: capacity, last: now }
  const elapsed = Math.max(0, now - b.last) / 60000
  const refill = elapsed * rate
  b.tokens = Math.min(capacity, b.tokens + refill)
  b.last = now
  if (b.tokens < 1) {
    store.set(key, b)
    return false
  }
  b.tokens -= 1
  store.set(key, b)
  return true
}

function buildCsp(dev: boolean): string {
  const base = [
    dev ? "default-src 'self' blob: data:" : "default-src 'self'",
    dev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:" : "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    dev ? "img-src 'self' data: blob: https:" : "img-src 'self' data: https:",
    "font-src 'self' data:",
    dev ? "connect-src 'self' ws: wss: https://manager.dinastiapi.evolutta.com.br https://webhooks.evolutta.com.br https://*.supabase.co https://*.supabase.in" : "connect-src 'self' https://manager.dinastiapi.evolutta.com.br https://webhooks.evolutta.com.br https://*.supabase.co https://*.supabase.in",
    dev ? "worker-src 'self' blob:" : "worker-src 'self'",
    dev ? "frame-ancestors *" : "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ]
  return base.join('; ')
}

export function middleware(req: Request) {
  const url = new URL(req.url)
  const dev = process.env.NODE_ENV !== 'production'
  const res = NextResponse.next()

  const ip = (req as any).ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0'
  const method = (req as any).method || 'GET'
  const path = url.pathname

  const isDashboardPost = method === 'POST' && path.startsWith('/dashboard')
  if (isDashboardPost) {
    const ok = rateLimit(`${ip}:dashboard`, 120, 120)
    if (!ok) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  const csp = buildCsp(dev)
  res.headers.set('Content-Security-Policy', csp)
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'no-referrer')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  if (!dev) {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
}
