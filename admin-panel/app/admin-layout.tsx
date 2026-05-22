'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Building2, CreditCard, FileText,
  Users, UserCog, Shield, ScrollText, Calendar, LogOut
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/organizations',label: 'Organizations', icon: Building2 },
  { href: '/plans',        label: 'Plans',         icon: CreditCard },
  { href: '/invoices',     label: 'Invoices',      icon: FileText },
  { href: '/customers',    label: 'Customers',     icon: Users },
  { href: '/users',        label: 'Users',         icon: UserCog },
  { href: '/roles',        label: 'Roles',         icon: Shield },
  { href: '/audit-logs',   label: 'Audit Logs',    icon: ScrollText },
  { href: '/calendar',     label: 'Calendar',      icon: Calendar },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d || !d.role) { router.push('/login'); return }
      setUser(d)
    })
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside className="w-60 fixed h-full z-10 flex flex-col"
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
          <p className="text-xs font-medium truncate" style={{ color: 'var(--ink)' }}>{user?.email || '...'}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
            Super Admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60">
        {children}
      </main>
    </div>
  )
}
