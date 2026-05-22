'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users2, Plus, Download, Upload, FileText, UserCheck, UserX, Trash2 } from 'lucide-react'

const ROLES = ['admin','coach','trainer','doctor','therapist','receptionist','other']
const ALL_PAGES = ['dashboard','calendar','sessions','customers','enrollments','packages','invoices','reports','members']

const roleStyle = (role: string): React.CSSProperties => {
  const map: Record<string, { background: string; color: string }> = {
    admin:        { background: 'var(--danger-dim)',  color: 'var(--danger)'  },
    coach:        { background: 'var(--primary-dim)', color: 'var(--primary)' },
    trainer:      { background: 'var(--primary-dim)', color: 'var(--primary)' },
    doctor:       { background: 'var(--teal-dim)',    color: 'var(--teal)'    },
    therapist:    { background: 'var(--teal-dim)',    color: 'var(--teal)'    },
    receptionist: { background: 'var(--green-dim)',   color: 'var(--green)'   },
    other:        { background: 'var(--bg)',          color: 'var(--text-sec)'},
  }
  return map[role] || map.other
}

const inp: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: 12,
  padding: '8px 12px', fontSize: 14, background: 'var(--bg)',
  color: 'var(--ink)', outline: 'none',
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

  function showMsg(text: string) { setMessage(text); setTimeout(() => setMessage(''), 4000) }

  async function handleAdd() {
    if (!form.email) return
    setAdding(true)
    const res = await fetch(`/api/organizations/${id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const d = await res.json()
    if (res.ok) {
      showMsg(d.already_exists ? 'Member added and activated!' : 'Invitation sent!')
      setShowForm(false); setForm({ email: '', role: 'coach' }); load()
    } else { showMsg(d.error || 'Error') }
    setAdding(false)
  }

  async function handleSave(memberId: string) {
    setSaving(memberId)
    await fetch(`/api/organizations/${id}/members`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id: memberId, role: editRole, allowed_pages: editAllowedPages })
    })
    setEditId(null); setSaving(null); load()
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

  function exportCSV() {
    const headers = ['email','role','status']
    const rows = members.map(m => [m.email, m.role, m.status])
    const csv = ['\uFEFFsep=,', headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'team.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `\uFEFFsep=,
email,role,allowed_pages
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
    const lines = text.split('\n').filter(l => { const t = l.trim(); return t && !t.startsWith('#') && !t.startsWith('\uFEFF#') && !t.toLowerCase().startsWith('sep=') })
    if (lines.length < 2) { alert('No data found in file'); e.target.value = ''; return }
    const sep = lines[0].includes('\t') ? '\t' : ','
    const firstLine = lines[0].toLowerCase().replace(/"/g, '')
    const isHeaderRow = firstLine.includes('email') && firstLine.includes('role')
    const dataStart = isHeaderRow ? 1 : 0
    let success = 0, failed = 0, errors: string[] = []
    for (let i = dataStart; i < lines.length; i++) {
      const parts = lines[i].split(sep).map(p => p.trim().replace(/"/g, ''))
      const email = parts[0] || '', role = parts[1] || 'coach'
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
    e.target.value = ''; load()
  }

  const active   = members.filter(m => m.status === 'active')
  const pending  = members.filter(m => m.status === 'pending')
  const inactive = members.filter(m => m.status === 'inactive')

  const MemberCard = ({ m, section }: { m: any; section: 'active' | 'pending' | 'inactive' }) => {
    const initial = (m.users?.full_name || m.email || '?').charAt(0).toUpperCase()
    return (
      <div className="rounded-2xl p-4" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        opacity: section === 'active' ? 1 : 0.65,
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
              {initial}
            </div>
            <div>
              {section !== 'pending' && (
                <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{m.users?.full_name || '—'}</p>
              )}
              <p className="text-xs" style={{ color: section === 'pending' ? 'var(--text-sec)' : 'var(--text-ter)' }}>{m.email}</p>
              {section === 'pending' && (
                <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--warn)' }}>Awaiting signup</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={roleStyle(m.role)}>
              {m.role}
            </span>
            {section === 'active' && (
              <button onClick={() => { setEditId(m.id); setEditRole(m.role); setEditAllowedPages(m.allowed_pages || []) }}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'var(--bg)', color: 'var(--text-sec)', border: '1px solid var(--border)' }}>
                {editId === m.id ? 'Close' : 'Edit'}
              </button>
            )}
            {section === 'active' && (
              <button onClick={() => toggleStatus(m.id, m.status)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'var(--warn-dim)', color: 'var(--warn)' }}>
                Deactivate
              </button>
            )}
            {section === 'inactive' && (
              <button onClick={() => toggleStatus(m.id, m.status)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                Activate
              </button>
            )}
            <button onClick={() => handleRemove(m.id)}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
              style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Edit Panel */}
        {editId === m.id && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--divider)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-ter)' }}>ROLE</p>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  style={{ ...inp, fontSize: 13, padding: '6px 10px', cursor: 'pointer' }}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-ter)' }}>ALLOWED PAGES</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {ALL_PAGES.map(page => (
                <label key={page} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox"
                    checked={editAllowedPages.includes(page)}
                    onChange={e => setEditAllowedPages(e.target.checked ? [...editAllowedPages, page] : editAllowedPages.filter(p => p !== page))}
                    style={{ width: 14, height: 14, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                  <span className="text-xs capitalize" style={{ color: 'var(--text-sec)' }}>{page}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleSave(m.id)} disabled={saving === m.id}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
                style={{ background: 'var(--primary)' }}>
                {saving === m.id ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditId(null)}
                className="text-xs font-semibold px-4 py-1.5 rounded-lg"
                style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--bg)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Team</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>{active.length} active members</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
            <FileText size={14} /> Template
          </button>
          <label className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
            <Upload size={14} /> Import
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: 'var(--primary)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Plus size={15} /> Add Member
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>{message}</div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--ink)' }}>Add Member by Email</p>
          <div className="flex gap-3">
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="Email address" type="email"
              style={{ ...inp, flex: 1 }} />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
              style={{ ...inp, cursor: 'pointer' }}>
              {ROLES.filter(r => r !== 'admin').map(r => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <button onClick={handleAdd} disabled={adding}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}>
              {adding ? '...' : 'Add'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--bg)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-ter)' }}>Loading...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-20">
          <Users2 size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-ter)' }}>No team members yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <UserCheck size={13} style={{ color: 'var(--green)' }} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-ter)', letterSpacing: '0.5px' }}>
                  ACTIVE ({active.length})
                </p>
              </div>
              <div className="space-y-2">
                {active.map(m => <MemberCard key={m.id} m={m} section="active" />)}
              </div>
            </div>
          )}

          {pending.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--warn)' }} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-ter)', letterSpacing: '0.5px' }}>
                  PENDING — Not signed up yet ({pending.length})
                </p>
              </div>
              <div className="space-y-2">
                {pending.map(m => <MemberCard key={m.id} m={m} section="pending" />)}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-1">
                <UserX size={13} style={{ color: 'var(--text-ter)' }} />
                <p className="text-xs font-bold" style={{ color: 'var(--text-ter)', letterSpacing: '0.5px' }}>
                  INACTIVE ({inactive.length})
                </p>
              </div>
              <div className="space-y-2">
                {inactive.map(m => <MemberCard key={m.id} m={m} section="inactive" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
