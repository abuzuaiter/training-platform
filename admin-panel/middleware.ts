import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get('admin_session')?.value

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    if (session && pathname === '/login') {
      const data = JSON.parse(session)
      if (data.role === 'super_admin') return NextResponse.redirect(new URL('/', req.url))
      if (data.role === 'org_admin') return NextResponse.redirect(new URL(`/org/${data.organization_id}`, req.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
