'use client'
import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Calendar, BookOpen, Users, ClipboardList,
  Package, FileText, RefreshCw, BarChart2, Users2, Shield,
  ScrollText, Settings, LogOut, ChevronRight
} from 'lucide-react'

const ALL_LINKS = [
  { href: 'dashboard',          label: 'Dashboard',     icon: LayoutDashboard },
  { href: 'calendar',           label: 'Calendar',      icon: Calendar },
  { href: 'sessions',           label: 'Sessions',      icon: BookOpen },
  { href: 'customers',          label: 'Customers',     icon: Users },
  { href: 'enrollments',        label: 'Enrollments',   icon: ClipboardList },
  { href: 'packages',           label: 'Packages',      icon: Package },
  { href: 'invoices',           label: 'Invoices',      icon: FileText },
  { href: 'reschedule-requests',label: 'Reschedule',    icon: RefreshCw },
  { href: 'reports',            label: 'Reports',       icon: BarChart2 },
  { href: 'members',            label: 'Team',          icon: Users2 },
  { href: 'roles',              label: 'Roles',         icon: Shield },
  { href: 'audit-logs',         label: 'Audit Logs',    icon: ScrollText },
  { href: 'settings',           label: 'Settings',      icon: Settings },
]

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const id = params.id as string
  const pathname = usePathname()
  const router = useRouter()
  const [org, setOrg] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [visibleLinks, setVisibleLinks] = useState(ALL_LINKS)
  const [pendingReschedule, setPendingReschedule] = useState(0)

  useEffect(() => {
    if (!id) return
    fetch(`/api/organizations/${id}`).then(r => r.ok ? r.json() : null).then(d => setOrg(d))
    fetch(`/api/organizations/${id}/plans`).then(r => r.ok ? r.json() : null).then(d => setPlan(d?.[0] || null))
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d || d.role === 'org_admin' || d.role === 'super_admin') return
      const allowed: string[] = d.permissions?.allowed_pages || []
      if (allowed.length > 0) setVisibleLinks(ALL_LINKS.filter(l => allowed.includes(l.href)))
    })

    const fetchPending = () =>
      fetch(`/api/reschedule-requests?org_id=${id}&status=pending`)
        .then(r => r.ok ? r.json() : [])
        .then(d => setPendingReschedule(Array.isArray(d) ? d.length : 0))
    fetchPending()
    window.addEventListener('reschedule-updated', fetchPending)
    return () => window.removeEventListener('reschedule-updated', fetchPending)
  }, [id])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside className="w-60 fixed h-full z-10 flex flex-col" style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
      }}>
        {/* Logo */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <div className="flex items-center gap-3">
            {org?.logo_url ? (
              <img src={org.logo_url} alt="Logo"
                className="w-10 h-10 rounded-xl object-contain border p-0.5"
                style={{ borderColor: 'var(--border)' }} />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'var(--primary)' }}>
                {org?.name?.charAt(0) || 'O'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--ink)', maxWidth: '120px' }}>
                {org?.name || 'Organization'}
              </p>
              {org?.name_ar && (
                <p className="text-xs truncate" style={{ color: 'var(--text-ter)' }}>{org.name_ar}</p>
              )}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
          {visibleLinks.map(link => {
            const href = `/org/${id}/${link.href}`
            const active = pathname === href || (link.href !== 'dashboard' && pathname.startsWith(href))
            const badge = link.href === 'reschedule-requests' && pendingReschedule > 0 ? pendingReschedule : null
            const Icon = link.icon
            return (
              <Link key={link.href} href={href}>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: active ? 'var(--primary-dim)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--text-sec)',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)' }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    <span>{link.label}</span>
                  </div>
                  {badge !== null && (
                    <span className="text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none text-white"
                      style={{ background: 'var(--danger)' }}>
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid var(--divider)' }}>
          {plan && (
            <div className="px-3 py-2 rounded-xl mb-2" style={{ background: 'var(--bg)' }}>
              <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Plan expires</p>
              <p className="text-xs font-semibold" style={{ color: 'var(--ink)' }}>
                {new Date(plan.end_date).toLocaleDateString()}
              </p>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ color: 'var(--danger)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--danger-dim)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60">
        {children}
      </main>
    </div>
  )
}
