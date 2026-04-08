'use client'
import { usePathname } from 'next/navigation'
import SuperAdminSidebar from './super-admin-sidebar'

const SKIP_PATHS = ['/login', '/org', '/register', '/unauthorized']

export default function SuperAdminSidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const shouldSkip = SKIP_PATHS.some(p => pathname.startsWith(p))

  if (shouldSkip) return <>{children}</>

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar />
      <div className="flex-1 ml-60">
        {children}
      </div>
    </div>
  )
}
