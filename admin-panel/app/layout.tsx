import type { Metadata } from 'next'
import './globals.css'
import SuperAdminSidebarWrapper from './sidebar-wrapper'

export const metadata: Metadata = {
  title: 'MawedQo — موعدكو',
  description: 'Smart Appointment Management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SuperAdminSidebarWrapper>
          {children}
        </SuperAdminSidebarWrapper>
      </body>
    </html>
  )
}
