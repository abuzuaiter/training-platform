import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/register', '/api/calendar-sessions', '/api/calendar-bookings', '/api/customers/lookup']

// Map pages to their route paths
const PAGE_ROUTES: Record<string, string> = {
  organizations: '/organizations',
  plans: '/plans',
  invoices: '/invoices',
  customers: '/customers',
  subscriptions: '/subscriptions',
  users: '/users',
  invitations: '/invitations',
  activities: '/activities',
  audit_logs: '/audit-logs',
  roles: '/roles',
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const session = req.cookies.get('admin_session')?.value

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    if (session && pathname === '/login') {
      const data = JSON.parse(session)
      if (data.role === 'super_admin') return NextResponse.redirect(new URL('/', req.url))
      if (data.role === 'org_admin') return NextResponse.redirect(new URL(`/org/${data.organization_id}`, req.url))
    }
    return NextResponse.next()
  }

  // No session — redirect to login
  // Allow all API routes with session
  if (pathname.startsWith('/api/')) {
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const sessionData = JSON.parse(session)

  // Super admin — full access
  if (sessionData.role === 'super_admin') {
    return NextResponse.next()
  }

  // Org admin — only /org routes
  if (sessionData.role === 'org_admin') {
    if (pathname.startsWith('/org/')) return NextResponse.next()
    return NextResponse.redirect(new URL(`/org/${sessionData.organization_id}`, req.url))
  }

  // Custom role user — check permissions
  if (sessionData.role === 'custom' && sessionData.permissions) {
    const permissions = sessionData.permissions as Record<string, string[]>

    // Allow API routes that match their permissions
    if (pathname.startsWith('/api/')) {
      return NextResponse.next() // API-level check handled separately
    }

    // Check page access
    for (const [pageKey, routePath] of Object.entries(PAGE_ROUTES)) {
      if (pathname.startsWith(routePath)) {
        const pagePerms = permissions[pageKey] || []
        if (pagePerms.includes('view')) return NextResponse.next()
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Dashboard always accessible
    if (pathname === '/') return NextResponse.next()

    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
