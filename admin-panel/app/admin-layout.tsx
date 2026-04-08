'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/organizations', label: 'Organizations' },
  { href: '/plans', label: 'Plans' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/customers', label: 'Customers' },
  { href: '/users', label: 'Users' },
  { href: '/roles', label: 'Roles' },
  { href: '/audit-logs', label: 'Audit Logs' },
  { href: '/calendar', label: 'Calendar' },
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100">
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
              <p className="text-sm font-bold text-gray-900 leading-none">MawedQo</p>
              <p className="text-xs text-gray-400 leading-none">موعدكو</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-900 truncate">{user?.email || '...'}</p>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Super Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
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
          <button onClick={handleLogout}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition text-left">
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-60">
        {children}
      </div>
    </div>
  )
}
