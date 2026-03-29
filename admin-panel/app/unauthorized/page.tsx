'use client'
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}