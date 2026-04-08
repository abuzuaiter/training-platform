'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  full_name: string
  email: string | null
  mobile: string | null
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data || [])
    setLoading(false)
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile?.includes(search)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Users</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-500 text-sm mt-1">{users.length} users total</p>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or mobile..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 w-72"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No users found</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">NAME</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">EMAIL</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">MOBILE</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">JOINED</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <tr key={user.id} className={`border-b border-gray-50 hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {user.full_name?.charAt(0) || '?'}
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{user.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.mobile || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/users/${user.id}`}
                        className="text-xs text-blue-600 font-semibold hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}