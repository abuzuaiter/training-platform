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

  const [memberRole, setMemberRole] = useState<string>('admin')

  useEffect(() => {
    if (!id) return
    fetch(`/api/organizations/${id}`).then(r => r.ok ? r.json() : null).then(d => setOrg(d))
    fetch(`/api/organizations/${id}/plans`).then(r => r.ok ? r.json() : null).then(d => setPlan(d?.[0] || null))
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.permissions?.member_role) setMemberRole(d.permissions.member_role)
      else if (d?.role === 'org_admin') setMemberRole('admin')
    })
  }, [id])

  const allowedPages: Record<string, string[]> = {
    admin:        ['dashboard','calendar','sessions','customers','enrollments','packages','invoices','members','invitations'],
    coach:        ['dashboard','calendar','customers'],
    trainer:      ['dashboard','calendar','customers'],
    receptionist: ['dashboard','customers','enrollments'],
    doctor:       ['dashboard','customers'],
    therapist:    ['dashboard','customers'],
    other:        ['dashboard'],
  }

  function canAccess(page: string) {
    const allowed = allowedPages[memberRole] || ['dashboard']
    return allowed.includes(page)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { href: `/org/${id}/dashboard`, label: 'Dashboard' },
    { href: `/org/${id}/calendar`, label: 'Calendar' },
    { href: `/org/${id}/sessions`, label: 'Sessions' },
    { href: `/org/${id}/customers`, label: 'Customers' },
    { href: `/org/${id}/enrollments`, label: 'Enrollments' },
    { href: `/org/${id}/packages`, label: 'Packages' },
    { href: `/org/${id}/invoices`, label: 'Invoices' },
    { href: `/org/${id}/members`, label: 'Team' },

  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
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

        {/* Org Info */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900 truncate">{org?.name || 'Organization'}</p>
          <p className="text-xs text-gray-400 truncate">{org?.category || ''}</p>
          {plan && (
            <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${plan.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {plan.plans?.name}
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.filter(item => {
            const page = item.href.split('/').pop() || 'dashboard'
            return canAccess(page)
          }).map(item => {
            const isActive = pathname === item.href || (item.href !== `/org/${id}/dashboard` && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}>
                <div className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  {item.label}
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
