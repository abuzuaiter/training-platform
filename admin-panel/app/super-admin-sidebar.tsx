'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, BarChart2, Building2, Package, FileText,
  Users, UserCog, Shield, ScrollText, LogOut, CreditCard
} from 'lucide-react'

const navSections = [
  {
    title: 'ANALYTICS',
    items: [
      { href: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
      { href: '/reports', label: 'Reports',      icon: BarChart2 },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { href: '/organizations', label: 'Organizations', icon: Building2 },
      { href: '/plans',         label: 'Plans',         icon: CreditCard },
      { href: '/packages',      label: 'Packages',      icon: Package },
      { href: '/invoices',      label: 'Invoices',      icon: FileText },
      { href: '/customers',     label: 'Customers',     icon: Users },
      { href: '/users',         label: 'Users',         icon: UserCog },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { href: '/roles',      label: 'Roles & Permissions', icon: Shield },
      { href: '/audit-logs', label: 'Audit Logs',          icon: ScrollText },
    ]
  },
]

const SKIP_PATHS = ['/login', '/org', '/register', '/unauthorized']

export default function SuperAdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [show, setShow] = useState(false)

  const shouldSkip = SKIP_PATHS.some(p => pathname.startsWith(p))

  useEffect(() => {
    if (shouldSkip) return
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.role === 'super_admin' || d?.role === 'custom') {
        setUser(d)
        setShow(true)
      }
    })
  }, [pathname])

  if (!show || shouldSkip) return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="fixed top-0 left-0 w-60 h-full flex flex-col z-50"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
            style={{ background: 'var(--primary)' }}>
            M
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>AlMawid</p>
            <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Smart Appointments</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--divider)' }}>
        <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{user?.email || ''}</p>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
          style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navSections.map(section => (
          <div key={section.title} className="mb-4">
            <p className="text-xs font-semibold px-3 mb-1" style={{ color: 'var(--text-ter)' }}>
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href}>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: isActive ? 'var(--primary-dim)' : 'transparent',
                        color: isActive ? 'var(--primary)' : 'var(--text-sec)',
                      }}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)' }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--divider)' }}>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left"
          style={{ color: 'var(--danger)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-dim)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}
