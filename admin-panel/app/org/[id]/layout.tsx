'use client'
import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const id = params.id as string
  const pathname = usePathname()
  const router = useRouter()
  const [org, setOrg] = useState<any>(null)
  const [plan, setPlan] = useState<any>(null)
  const [navLinks, setNavLinks] = useState<typeof links | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/organizations/${id}`).then(r => r.ok ? r.json() : null).then(d => setOrg(d))
    fetch(`/api/organizations/${id}/plans`).then(r => r.ok ? r.json() : null).then(d => setPlan(d?.[0] || null))
  }, [id])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const base = `/org/${id}`
  const allLinks = [
    { href: `${base}/dashboard`, label: 'Dashboard' },
    { href: `${base}/calendar`, label: 'Calendar' },
    { href: `${base}/sessions`, label: 'Sessions' },
    { href: `${base}/customers`, label: 'Customers' },
    { href: `${base}/enrollments`, label: 'Enrollments' },
    { href: `${base}/packages`, label: 'Packages' },
    { href: `${base}/invoices`, label: 'Invoices' },
    { href: `${base}/reports`, label: 'Reports' },
    { href: `${base}/members`, label: 'Team' },
  ]
  const links = navLinks ?? allLinks

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d || d.role === 'org_admin' || d.role === 'super_admin') {
        setNavLinks(allLinks)
        return
      }
      const allowed: string[] = d.permissions?.allowed_pages || ['dashboard', 'calendar']
      setNavLinks(allLinks.filter(l => {
        const page = l.href.split('/').pop() || 'dashboard'
        return allowed.includes(page)
      }))
    })
  }, [id])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">

        {/* Logo / Org */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {org?.logo_url ? (
              <img src={org.logo_url} alt="Logo" className="w-10 h-10 rounded-xl object-contain border border-gray-100 bg-white p-0.5" />
            ) : (
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {org?.name?.charAt(0) || 'O'}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none truncate max-w-32">{org?.name || 'Organization'}</p>
              {org?.name_ar && <p className="text-xs text-gray-400 leading-none">{org.name_ar}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {links.map(link => {
            const active = pathname === link.href || (link.href !== `${base}/dashboard` && pathname.startsWith(link.href))
            return (
              <Link key={link.href} href={link.href}>
                <div className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  {link.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 border-t border-gray-100">
          {plan && (
            <div className="px-3 py-2 bg-gray-50 rounded-xl mb-2">
              <p className="text-xs text-gray-500">Plan expires</p>
              <p className="text-xs font-medium text-gray-700">{new Date(plan.end_date).toLocaleDateString()}</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition text-left">
            Sign out
          </button>
        </div>
      </div>

      <div className="flex-1 ml-60">
        {children}
      </div>
    </div>
  )
}
