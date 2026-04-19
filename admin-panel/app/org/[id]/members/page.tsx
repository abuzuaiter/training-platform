'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const ROLES = ['admin','coach','trainer','doctor','therapist','receptionist','other']
const ALL_PAGES = ['dashboard','calendar','sessions','customers','enrollments','packages','invoices','reports','members']

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
      body: JSON.stringify(form)
    })
    const d = await res.json()
    if (res.ok) {
      setMessage(d.already_exists ? 'Member added and activated!' : 'Invitation sent!')
      setShowForm(false)
      setForm({ email: '', role: 'coach' })
      load()
    } else {
      setMessage(d.error || 'Error')
    }
    setAdding(false)
    setTimeout(() => setMessage(''), 4000)
  }

  async function handleSave(memberId: string) {
    setSaving(memberId)
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, role: editRole, allowed_pages: editAllowedPages })
    })
    setEditId(null)
    setSaving(null)
    load()
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this member?')) return
    await fetch(`/api/organizations/${id}/members/${memberId}`, { method: 'DELETE' })
    load()
  }

  async function toggleStatus(memberId: string, current: string) {
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, status: current === 'active' ? 'inactive' : 'active' })
    })
    load()
  }

  const active = members.filter(m => m.status === 'active')
  const pending = members.filter(m => m.status === 'pending')
  const inactive = members.filter(m => m.status === 'inactive')

  function exportCSV() {
    const headers = ['email','role','status']
    const rows = members.map(m => [m.email, m.role, m.status])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'team.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `email,role,allowed_pages
# INSTRUCTIONS:
# email: Required. Member email address
# role: Required. admin / coach / trainer / doctor / therapist / receptionist / other
# allowed_pages: Optional. Pages separated by | e.g. dashboard|calendar|sessions
# Available pages: dashboard|calendar|sessions|customers|enrollments|packages|invoices|reports|members
# Members will receive an invitation and activate on first login
# Delete comment lines before importing
coach@example.com,coach,dashboard|calendar
trainer@example.com,trainer,dashboard|calendar|sessions
doctor@example.com,doctor,dashboard|calendar|customers`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'team-template.csv'; a.click()
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => {
      const trimmed = l.trim()
      return trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('\uFEFF#')
    })
    if (lines.length < 2) { alert('No data found in file'); e.target.value = ''; return }
    const sep = lines[0].includes('\t') ? '\t' : ','
    const firstLine = lines[0].toLowerCase().replace(/"/g, '')
    const isHeaderRow = firstLine.includes('email') && firstLine.includes('role')
    const dataStart = isHeaderRow ? 1 : 0
    let success = 0, failed = 0, errors: string[] = []
    for (let i = dataStart; i < lines.length; i++) {
      const parts = lines[i].split(sep).map(p => p.trim().replace(/"/g, ''))
      const email = parts[0] || ''
      const role = parts[1] || 'coach'
      const allowed_pages = parts[2] ? parts[2].split('|').map(p => p.trim()).filter(Boolean) : ['dashboard','calendar']
      if (!email || !email.includes('@')) { failed++; errors.push(`Row ${i+1}: Invalid email "${email}"`); continue }
      if (!ROLES.includes(role)) { failed++; errors.push(`Row ${i+1}: Invalid role "${role}"`); continue }
      const res = await fetch(`/api/organizations/${id}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, allowed_pages })
      })
      if (res.ok) { success++ } else {
        const d = await res.json().catch(() => ({}))
        if (res.status !== 400) { failed++; errors.push(`Row ${i+1} (${email}): ${d.error || 'HTTP '+res.status}`) }
      }
    }
    const msg = [`✅ Success: ${success}`, `❌ Failed: ${failed}`]
    if (errors.length) msg.push('\nErrors:\n' + errors.join('\n'))
    alert(msg.join('\n'))
    e.target.value = ''
    load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Team</h1>
          <p className="text-xs text-gray-400">{active.length} active members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">📋 Template</button>
          <label className="cursor-pointer border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            📥 Import
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <button onClick={exportCSV} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">📤 Export</button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + Add Member
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium">{message}</div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Add Member by Email</h2>
            <div className="flex gap-3">
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="Email address" type="email"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                {ROLES.filter(r => r !== 'admin').map(r => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
              <button onClick={handleAdd} disabled={adding}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                {adding ? '...' : 'Add'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Active */}
            {active.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 px-1">ACTIVE</p>
                <div className="space-y-2">
                  {active.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                            {(m.users?.full_name || m.email || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{m.users?.full_name || '—'}</p>
                            <p className="text-xs text-gray-400">{m.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || roleColors.other}`}>
                            {m.role}
                          </span>
                          <button onClick={() => { setEditId(m.id); setEditRole(m.role); setEditAllowedPages(m.allowed_pages || []) }}
                            className="text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100">
                            Edit
                          </button>
                          <button onClick={() => toggleStatus(m.id, m.status)}
                            className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100">
                            Deactivate
                          </button>
                          <button onClick={() => handleRemove(m.id)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                            Remove
                          </button>
                        </div>
                      </div>

                      {editId === m.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-3 mb-4">
                            <select value={editRole} onChange={e => setEditRole(e.target.value)}
                              className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
                              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                            </select>
                          </div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">ALLOWED PAGES</p>
                          <div className="grid grid-cols-3 gap-2 mb-4">
                            {ALL_PAGES.map(page => (
                              <label key={page} className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox"
                                  checked={editAllowedPages.includes(page)}
                                  onChange={e => setEditAllowedPages(
                                    e.target.checked
                                      ? [...editAllowedPages, page]
                                      : editAllowedPages.filter(p => p !== page)
                                  )}
                                  className="w-3.5 h-3.5 accent-blue-600" />
                                <span className="text-xs text-gray-600 capitalize">{page}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSave(m.id)} disabled={saving === m.id}
                              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
                              {saving === m.id ? 'Saving...' : 'Save'}
                            </button>
                            <button onClick={() => setEditId(null)}
                              className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 px-1">PENDING — Not signed up yet</p>
                <div className="space-y-2">
                  {pending.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm">
                            {m.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">{m.email}</p>
                            <p className="text-xs text-amber-500">Awaiting signup</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[m.role] || roleColors.other}`}>
                            {m.role}
                          </span>
                          <button onClick={() => handleRemove(m.id)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive */}
            {inactive.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2 px-1">INACTIVE</p>
                <div className="space-y-2">
                  {inactive.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 opacity-60">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-bold text-sm">
                            {(m.users?.full_name || m.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{m.users?.full_name || '—'}</p>
                            <p className="text-xs text-gray-400">{m.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleStatus(m.id, m.status)}
                            className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                            Activate
                          </button>
                          <button onClick={() => handleRemove(m.id)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {members.length === 0 && (
              <div className="text-center py-16 text-gray-400">No team members yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
