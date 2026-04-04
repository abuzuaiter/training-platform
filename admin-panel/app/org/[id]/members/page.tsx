'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrgTeamPage() {
  const params = useParams()
  const id = params.id as string
  const [members, setMembers] = useState<any[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'coach' })
  const [adding, setAdding] = useState(false)

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const [membRes, invRes] = await Promise.all([
      fetch(`/api/organizations/${id}/members`),
      fetch(`/api/invitations?org_id=${id}`)
    ])
    setMembers(membRes.ok ? await membRes.json() : [])
    setInvitations(invRes.ok ? await invRes.json() : [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!form.email) { setMessage('Email is required'); return }
    setAdding(true)

    // Try to find existing user
    const userRes = await fetch(`/api/users?email=${form.email}`)
    const users = userRes.ok ? await userRes.json() : []
    const user = users.find((u: any) => u.email === form.email)

    if (user) {
      // Add directly
      const res = await fetch(`/api/organizations/${id}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, role: form.role, status: 'active' })
      })
      if (res.ok) { setMessage('Member added!') }
      else { const d = await res.json(); setMessage(d.error || 'Error') }
    } else {
      // Send invitation
      const res = await fetch('/api/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, role: form.role, organization_id: id })
      })
      if (res.ok) { setMessage('Invitation sent!') }
      else { const d = await res.json(); setMessage(d.error || 'Error') }
    }

    setAdding(false)
    setShowForm(false)
    setForm({ email: '', role: 'coach' })
    setTimeout(() => setMessage(''), 3000)
    load()
  }

  async function updateRole(memberId: string, role: string) {
    setSaving(memberId)
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, role })
    })
    setSaving(null)
    load()
  }

  async function toggleStatus(m: any) {
    setSaving(m.id)
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: m.id, status: m.status === 'active' ? 'inactive' : 'active' })
    })
    setSaving(null)
    load()
  }

  async function sendInvite(email: string, role: string) {
    await fetch('/api/invitations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, organization_id: id })
    })
    setMessage('Invitation sent!')
    setTimeout(() => setMessage(''), 3000)
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

  // Get pending invitations not yet accepted
  const pendingInvites = invitations.filter(i => i.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Team</h1>
          <p className="text-xs text-gray-400">{filtered.length} members · {pendingInvites.length} pending</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + Add Member
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            <h2 className="text-base font-bold text-gray-900 mb-3">Add Team Member</h2>
            <p className="text-xs text-gray-400 mb-3">If the email is registered → added directly. If not → invitation sent.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL *</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="member@email.com" type="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ROLE</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
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
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={handleAdd} disabled={adding}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {adding ? 'Processing...' : 'Add / Invite'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4"
          placeholder="Search team..." />

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

            {/* Active Members */}
            {filtered.length > 0 && (
              <>
                <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">MEMBERS</p>
                </div>
                {filtered.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                        {(m.users?.full_name?.charAt(0) || '?').toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{m.users?.full_name || m.users?.email}</p>
                        <p className="text-xs text-gray-400">{m.users?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={m.role} onChange={e => updateRole(m.id, e.target.value)} disabled={saving === m.id}
                        className={`text-xs px-2 py-1 rounded-lg border-0 font-medium focus:outline-none cursor-pointer ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {m.status}
                      </span>
                      <button onClick={() => toggleStatus(m)} disabled={saving === m.id}
                        className={`text-xs px-3 py-1 rounded-lg font-semibold transition ${m.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {saving === m.id ? '...' : m.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => sendInvite(m.users?.email, m.role)}
                        className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                        Resend Invite
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Pending Invitations */}
            {pendingInvites.length > 0 && (
              <>
                <div className="px-6 py-2 bg-amber-50 border-b border-amber-100">
                  <p className="text-xs font-semibold text-amber-600">PENDING INVITATIONS</p>
                </div>
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-semibold text-sm">
                        {inv.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                        <p className="text-xs text-gray-400">Invited {new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[inv.role] || 'bg-gray-50 text-gray-600'}`}>
                        {inv.role}
                      </span>
                      <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">pending</span>
                      <button onClick={() => sendInvite(inv.email, inv.role)}
                        className="text-xs px-3 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                        Resend
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {filtered.length === 0 && pendingInvites.length === 0 && (
              <div className="text-center py-12 text-gray-400">No team members yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
