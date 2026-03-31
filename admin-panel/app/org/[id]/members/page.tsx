'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrgMembersPage() {
  const params = useParams()
  const id = params.id as string
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/organizations/${id}/members`)
    setMembers(await res.json() || [])
    setLoading(false)
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-50 text-red-600', coach: 'bg-blue-50 text-blue-600',
    receptionist: 'bg-green-50 text-green-600', trainee: 'bg-purple-50 text-purple-600', parent: 'bg-amber-50 text-amber-600',
  }

  const filtered = members.filter(m =>
    m.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.users?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/org/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Members</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} members</p>
          </div>
          <Link href={`/org/${id}/invitations`} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">+ Invite Member</Link>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4" placeholder="Search members..." />
        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No members yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">MEMBER</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ROLE</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">JOINED</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">{m.users?.full_name?.charAt(0).toUpperCase() || '?'}</div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{m.users?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{m.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>{m.role}</span></td>
                    <td className="px-6 py-4 text-xs text-gray-400">{m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}</td>
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
