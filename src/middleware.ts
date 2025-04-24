// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  const url = request.nextUrl.clone()

  const token = request.cookies.get('session-token')?.value

  // Simulamos roles en base al token (hasta que conectes con backend real)
  const mockRolesByToken: Record<string, string[]> = {
    'admin-token': ['admin'],
    'sello-token': ['sello'],
    'multi-token': ['admin', 'sello', 'artista'],
  }

  const roles = token ? mockRolesByToken[token] || [] : []

  // LOGIN redirige si ya tiene sesión
  if (hostname.startsWith('login') && token && roles.length === 1) {
    const role = roles[0]
    url.hostname = `${role}.islasounds.com`
    return NextResponse.redirect(url)
  }

  // LOGIN redirige a selector si tiene múltiples roles
  if (hostname.startsWith('login') && token && roles.length > 1) {
    url.pathname = '/seleccionar-cuenta'
    return NextResponse.rewrite(url)
  }

  // Protegemos rutas si no hay token
  const protectedHosts = ['admin', 'distro', 'colabs', 'ajustes']
  if (protectedHosts.some(h => hostname.startsWith(h)) && !token) {
    url.hostname = 'login.islasounds.com'
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|api|static).*)'],
}
