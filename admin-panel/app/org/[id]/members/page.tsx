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
  const [editMember, setEditMember] = useState<any>(null)
  const [form, setForm] = useState({ email: '', role: 'coach' })
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', mobile: '', role: '' })
  const [adding, setAdding] = useState(false)

  const roleOptions = ['admin','coach','trainer','doctor','therapist','receptionist','trainee','parent','other']
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

  function getName(m: any) {
    const first = m.users?.first_name || ''
    const last = m.users?.last_name || ''
    if (first || last) return `${first} ${last}`.trim()
    return m.users?.full_name || m.users?.email || m.email || 'Unknown'
  }
  
  function getEmail(m: any) {
    return m.users?.email || m.email || ''
  }

  async function handleAdd() {
    if (!form.email) { setMessage('Email is required'); return }
    setAdding(true)
    const res = await fetch(`/api/organizations/${id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.toLowerCase(), role: form.role })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(data.already_exists ? 'Member added and activated!' : 'Member added! They can now sign up with this email.')
    } else {
      setMessage(data.error || 'Error')
    }
    setAdding(false)
    setShowForm(false)
    setForm({ email: '', role: 'coach' })
    setTimeout(() => setMessage(''), 4000)
    load()
  }

  async function handleSaveEdit() {
    if (!editMember) return
    setSaving(editMember.id)
    const fullName = `${editForm.first_name} ${editForm.last_name}`.trim()
    await fetch(`/api/users/${editMember.users?.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: editForm.first_name, last_name: editForm.last_name, mobile: editForm.mobile, full_name: fullName })
    })
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: editMember.id, role: editForm.role })
    })
    setSaving(null)
    setEditMember(null)
    setMessage('Member updated!')
    setTimeout(() => setMessage(''), 3000)
    load()
  }

  async function toggleStatus(m: any) {
    setSaving(m.id)
    const newStatus = m.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: m.id, status: newStatus })
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

  const activeMembers = members.filter(m => m.status === 'active' || m.status === 'inactive' || (m.status === 'pending' && m.email && !m.users?.id))
  const pendingMembers = members.filter(m => m.status === 'pending' && m.users?.id)
  const pendingInvites = invitations.filter(i => i.status === 'pending')

  const filteredActive = activeMembers.filter(m =>
    getName(m).toLowerCase().includes(search.toLowerCase()) ||
    m.users?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Team</h1>
          <p className="text-xs text-gray-400">{activeMembers.length} members · {pendingMembers.length + pendingInvites.length} pending</p>
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
            <h2 className="text-base font-bold text-gray-900 mb-1">Add Team Member</h2>
            <p className="text-xs text-gray-400 mb-3">Add their email and role. They can sign up with this email to get access automatically.</p>
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
                  {roleOptions.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <button onClick={handleAdd} disabled={adding}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
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

            {/* Active/Inactive Members */}
            {filteredActive.length > 0 && (
              <>
                <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">MEMBERS ({filteredActive.length})</p>
                </div>
                {filteredActive.map(m => (
                  <div key={m.id}>
                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-50 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                          {(getName(m) || getEmail(m) || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getName(m)}</p>
                          <p className="text-xs text-gray-400">{getEmail(m)}</p>
                          {m.users?.mobile && <p className="text-xs text-gray-400">{m.users.mobile}</p>}
                          {!m.users?.id && <span className="text-xs bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">Not signed up yet</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>
                          {m.role}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {m.status}
                        </span>
                        <button onClick={() => { setEditMember(m); setEditForm({ first_name: m.users?.first_name || '', last_name: m.users?.last_name || '', mobile: m.users?.mobile || '', role: m.role }) }}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100 transition">
                          Edit
                        </button>
                        <button onClick={() => toggleStatus(m)} disabled={saving === m.id}
                          className={`text-xs px-2 py-1 rounded-lg font-semibold transition ${m.status === 'active' ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {saving === m.id ? '...' : m.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => sendInvite(m.users?.email, m.role)}
                          className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                          Resend
                        </button>
                      </div>
                    </div>
                    {editMember?.id === m.id && (
                      <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">FIRST NAME</label>
                            <input value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">LAST NAME</label>
                            <input value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
                            <input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" placeholder="+974..." />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">ROLE</label>
                            <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
                              {roleOptions.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveEdit} disabled={saving === m.id}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                            {saving === m.id ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditMember(null)}
                            className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {/* Pending Members */}
            {pendingMembers.length > 0 && (
              <>
                <div className="px-6 py-2 bg-orange-50 border-b border-orange-100">
                  <p className="text-xs font-semibold text-orange-600">AWAITING ACTIVATION ({pendingMembers.length})</p>
                </div>
                {pendingMembers.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                        {getName(m).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{getName(m)}</p>
                        <p className="text-xs text-gray-400">{m.users?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>{m.role}</span>
                      <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">pending</span>
                      <button onClick={() => toggleStatus(m)} disabled={saving === m.id}
                        className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition">
                        {saving === m.id ? '...' : 'Activate'}
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
                  <p className="text-xs font-semibold text-amber-600">PENDING INVITATIONS ({pendingInvites.length})</p>
                </div>
                {pendingInvites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between px-6 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm">
                        {inv.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                        <p className="text-xs text-gray-400">Invited {new Date(inv.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[inv.role] || 'bg-gray-50 text-gray-600'}`}>{inv.role}</span>
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

            {filteredActive.length === 0 && pendingMembers.length === 0 && pendingInvites.length === 0 && (
              <div className="text-center py-12 text-gray-400">No team members yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
