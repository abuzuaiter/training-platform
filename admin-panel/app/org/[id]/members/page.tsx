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
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/organizations/${id}/members`)
    setMembers(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function updateRole(memberId: string, role: string) {
    setSaving(memberId)
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, role })
    })
    setSaving(null)
    setMessage('Role updated!')
    setTimeout(() => setMessage(''), 2000)
    load()
  }

  async function updateStatus(memberId: string, status: string) {
    setSaving(memberId)
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, status })
    })
    setSaving(null)
    setMessage('Status updated!')
    setTimeout(() => setMessage(''), 2000)
    load()
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-red-50 text-red-600',
    coach: 'bg-blue-50 text-blue-600',
    trainer: 'bg-blue-50 text-blue-700',
    doctor: 'bg-teal-50 text-teal-600',
    therapist: 'bg-purple-50 text-purple-600',
    receptionist: 'bg-green-50 text-green-600',
    trainee: 'bg-gray-50 text-gray-600',
    parent: 'bg-amber-50 text-amber-600',
    other: 'bg-gray-50 text-gray-500',
  }

  const filtered = members.filter(m =>
    m.users?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.users?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Members</h1>
          <p className="text-xs text-gray-400">{filtered.length} members</p>
        </div>
        <Link href={`/org/${id}/invitations`}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + Invite Member
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">{message}</div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4"
          placeholder="Search members..." />

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-gray-500 font-medium">No members yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">MEMBER</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ROLE</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">JOINED</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => (
                  <tr key={m.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {(m.users?.full_name?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{m.users?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{m.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={m.role}
                        onChange={e => updateRole(m.id, e.target.value)}
                        disabled={saving === m.id}
                        className={`text-xs px-2 py-1 rounded-lg border-0 font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>
                        <option value="admin">Admin</option>
                        <option value="coach">Coach</option>
                        <option value="trainer">Trainer</option>
                        <option value="doctor">Doctor</option>
                        <option value="therapist">Therapist</option>
                        <option value="receptionist">Receptionist</option>
                        <option value="trainee">Trainee</option>
                        <option value="parent">Parent</option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateStatus(m.id, m.status === 'active' ? 'inactive' : 'active')}
                        disabled={saving === m.id}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition ${m.status === 'active' ? 'bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-500' : 'bg-red-50 text-red-500 hover:bg-green-50 hover:text-green-600'}`}>
                        {saving === m.id ? '...' : m.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : '—'}
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
