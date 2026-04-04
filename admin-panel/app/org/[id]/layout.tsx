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

  useEffect(() => {
    if (!id) return
    fetch(`/api/organizations/${id}`).then(r => r.ok ? r.json() : null).then(d => setOrg(d))
    fetch(`/api/organizations/${id}/plans`).then(r => r.ok ? r.json() : null).then(d => setPlan(d?.[0] || null))
  }, [id])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const navItems = [
    { href: `/org/${id}/dashboard`, label: 'Dashboard', icon: '🏠' },
    { href: `/org/${id}/calendar`, label: 'Calendar', icon: '📅' },
    { href: `/org/${id}/customers`, label: 'Customers', icon: '🧑‍🤝‍🧑' },
    { href: `/org/${id}/members`, label: 'Members', icon: '👥' },
    { href: `/org/${id}/activities`, label: 'Activities', icon: '📋' },
    { href: `/org/${id}/packages`, label: 'Packages', icon: '📦' },
    { href: `/org/${id}/packages`, label: 'Packages', icon: '📦' },
    { href: `/org/${id}/enrollments`, label: 'Enrollments', icon: '🎓' },
    { href: `/org/${id}/invitations`, label: 'Invitations', icon: '✉️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="white" strokeWidth="2"/>
                <path d="M3 9h18" stroke="white" strokeWidth="2"/>
                <path d="M8 2v4M16 2v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M7 14l3 3 7-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">mawid</p>
              <p className="text-xs text-gray-400 leading-none">موعد</p>
            </div>
          </div>
        </div>

        {/* Org Info */}
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900 truncate">{org?.name || 'Organization'}</p>
          <p className="text-xs text-gray-400 truncate">{org?.category || ''}</p>
          {plan && (
            <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${plan.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {plan.plans?.name}
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== `/org/${id}` && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          {plan && (
            <div className="px-3 py-2 bg-gray-50 rounded-xl mb-2">
              <p className="text-xs text-gray-500">Plan expires</p>
              <p className="text-xs font-medium text-gray-700">{new Date(plan.end_date).toLocaleDateString()}</p>
            </div>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
            <span>🚪</span> Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  )
}
