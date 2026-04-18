'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const ROLES = ['admin','coach','trainer','doctor','therapist','receptionist','other']

const roleColors: Record<string, string> = {
  admin: 'bg-red-50 text-red-600',
  coach: 'bg-blue-50 text-blue-600',
  trainer: 'bg-blue-50 text-blue-700',
  doctor: 'bg-teal-50 text-teal-600',
  therapist: 'bg-purple-50 text-purple-600',
  receptionist: 'bg-green-50 text-green-600',
  other: 'bg-gray-50 text-gray-500',
}

export default function OrgTeamPage() {
  const params = useParams()
  const id = params.id as string
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'coach' })
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [editAllowedPages, setEditAllowedPages] = useState<string[]>([])
  const [editAllowedPages, setEditAllowedPages] = useState<string[]>([])

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/organizations/${id}/members`)
    setMembers(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!form.email) return
    setAdding(true)
    const res = await fetch(`/api/organizations/${id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email.toLowerCase().trim(), role: form.role })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(data.already_exists ? 'Member added!' : 'Member added! They will get access when they sign up.')
      setShowForm(false)
      setForm({ email: '', role: 'coach' })
      load()
    } else {
      setMessage(data.error || 'Error')
    }
    setAdding(false)
    setTimeout(() => setMessage(''), 4000)
  }

  async function updateRole(memberId: string) {
    setSaving(memberId)
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, role: editRole })
    })
    setSaving(null)
    setEditId(null)
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

  async function removeMember(memberId: string) {
    if (!confirm('Remove this member?')) return
    await fetch(`/api/organizations/${id}/members/${memberId}`, { method: 'DELETE' })
    load()
  }

  function getDisplay(m: any) {
    const name = m.users?.full_name || m.users?.first_name || ''
    const email = m.users?.email || m.email || ''
    return { name, email }
  }

  const active = members.filter(m => m.status === 'active')
  const inactive = members.filter(m => m.status === 'inactive')
  const pending = members.filter(m => m.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Team</h1>
          <p className="text-xs text-gray-400">{members.length} total · {pending.length} pending</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + Add Member
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('Error') || message.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Add Team Member</h2>
            <p className="text-xs text-gray-400 mb-4">
              Add their email and role. If they already have an account they'll be added immediately. Otherwise they'll get access when they sign up with this email.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL *</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="member@email.com" type="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ROLE</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={adding || !form.email}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {adding ? 'Adding...' : 'Add Member'}
              </button>
              <button onClick={() => { setShowForm(false); setForm({ email: '', role: 'coach' }) }}
                className="border border-gray-200 text-gray-600 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">No team members yet</p>
            <p className="text-gray-400 text-sm mt-1">Add your first team member above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active */}
            {active.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">ACTIVE ({active.length})</p>
                </div>
                {active.map(m => {
                  const { name, email } = getDisplay(m)
                  return (
                    <div key={m.id} className="px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                            {(name || email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            {name && <p className="text-sm font-medium text-gray-900">{name}</p>}
                            <p className="text-xs text-gray-400">{email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {editId === m.id ? (
                            <div className="flex items-center gap-2">
                              <select value={editRole} onChange={e => setEditRole(e.target.value)}
                                className="border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                              </select>
                              <button onClick={() => updateRole(m.id)} disabled={saving === m.id}
                                className="text-xs px-2 py-1 rounded-lg bg-blue-600 text-white font-semibold">
                                {saving === m.id ? '...' : 'Save'}
                              </button>
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">ALLOWED PAGES</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {['dashboard','calendar','sessions','customers','enrollments','packages','invoices','reports','members'].map(page => (
                                    <label key={page} className="flex items-center gap-1.5 cursor-pointer">
                                      <input type="checkbox"
                                        checked={editAllowedPages.includes(page)}
                                        onChange={e => setEditAllowedPages(e.target.checked ? [...editAllowedPages, page] : editAllowedPages.filter(p => p !== page))}
                                        className="w-3.5 h-3.5 accent-blue-600" />
                                      <span className="text-xs text-gray-600 capitalize">{page}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-gray-500 mb-2">ALLOWED PAGES</p>
                                <div className="grid grid-cols-2 gap-1">
                                  {['dashboard','calendar','sessions','customers','enrollments','packages','invoices','reports','members'].map(page => (
                                    <label key={page} className="flex items-center gap-1.5 cursor-pointer">
                                      <input type="checkbox"
                                        checked={editAllowedPages.includes(page)}
                                        onChange={e => setEditAllowedPages(e.target.checked ? [...editAllowedPages, page] : editAllowedPages.filter(p => p !== page))}
                                        className="w-3.5 h-3.5 accent-blue-600" />
                                      <span className="text-xs text-gray-600 capitalize">{page}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                              <button onClick={() => setEditId(null)}
                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-600">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>
                                {m.role}
                              </span>
                              <button onClick={() => { setEditId(m.id); setEditRole(m.role); setEditAllowedPages(m.allowed_pages || []) }}
                                className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100 transition">
                                Edit
                              </button>
                              <button onClick={() => toggleStatus(m)} disabled={saving === m.id}
                                className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition">
                                {saving === m.id ? '...' : 'Deactivate'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
                  <p className="text-xs font-semibold text-amber-600">PENDING — Not signed up yet ({pending.length})</p>
                </div>
                {pending.map(m => {
                  const { name, email } = getDisplay(m)
                  return (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-bold text-sm">
                          {(email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{email}</p>
                          <p className="text-xs text-gray-400">Waiting for signup</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>
                          {m.role}
                        </span>
                        <button onClick={() => removeMember(m.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition">
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Inactive */}
            {inactive.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden opacity-70">
                <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500">INACTIVE ({inactive.length})</p>
                </div>
                {inactive.map(m => {
                  const { name, email } = getDisplay(m)
                  return (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                          {(name || email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          {name && <p className="text-sm font-medium text-gray-700">{name}</p>}
                          <p className="text-xs text-gray-400">{email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || 'bg-gray-50 text-gray-600'}`}>
                          {m.role}
                        </span>
                        <button onClick={() => toggleStatus(m)} disabled={saving === m.id}
                          className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition">
                          {saving === m.id ? '...' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
