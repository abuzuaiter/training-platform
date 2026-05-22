'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { BookOpen, Plus, Download, Upload, FileText, X, Edit2, Trash2, ToggleLeft, ToggleRight, Filter, ChevronDown } from 'lucide-react'

const DAY_NAMES = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
  { key: 'saturday', label: 'السبت' },
]

const inp = {
  width: '100%', border: '1px solid var(--border)', borderRadius: '10px',
  padding: '8px 12px', fontSize: '13px', color: 'var(--ink)',
  background: 'var(--surface)', outline: 'none',
} as React.CSSProperties

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-ter)', marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
    {children}
  </label>
)

export default function OrgSessionsPage() {
  const params = useParams()
  const id = params.id as string
  const [sessions, setSessions] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [editSession, setEditSession] = useState<any>(null)
  const [form, setForm] = useState({
    title: '', capacity: '10', recurrence_type: 'weekly',
    recurrence_days: [] as string[], start_time: '07:00', end_time: '08:00',
    trainer_id: '', package_id: '',
  })
  const [editForm, setEditForm] = useState({
    title: '', capacity: '', recurrence_days: [] as string[],
    start_time: '', end_time: '', is_active: true, trainer_id: '', package_id: '',
    recurrence_end_date: '',
  })
  const [filterTrainer, setFilterTrainer] = useState<string>('')

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const [sessRes, membRes, pkgRes] = await Promise.all([
      fetch(`/api/session-templates?org_id=${id}`),
      fetch(`/api/organizations/${id}/members`),
      fetch(`/api/packages?org_id=${id}`),
    ])
    setSessions(sessRes.ok ? await sessRes.json() : [])
    setMembers(membRes.ok ? await membRes.json() : [])
    setPackages(pkgRes.ok ? await pkgRes.json() : [])
    setLoading(false)
  }

  function notify(msg: string, ok = true) { setMessage(msg); setMsgOk(ok); setTimeout(() => setMessage(''), 3000) }

  async function handleCreate() {
    if (!form.title || !form.start_time || !form.end_time) { notify('Please fill required fields', false); return }
    if (form.recurrence_type === 'weekly' && form.recurrence_days.length === 0) { notify('Please select at least one day', false); return }
    setSaving(true)
    const res = await fetch('/api/session-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id, capacity: parseInt(form.capacity), trainer_id: form.trainer_id || null })
    })
    if (res.ok) {
      notify('Session created!'); setShowForm(false)
      setForm({ title: '', capacity: '10', recurrence_type: 'weekly', recurrence_days: [], start_time: '07:00', end_time: '08:00', trainer_id: '', package_id: '' })
      load()
    } else { notify((await res.json()).error || 'Error', false) }
    setSaving(false)
  }

  async function saveEdit() {
    if (!editSession) return
    setSaving(true)
    const res = await fetch(`/api/session-templates/${editSession.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        capacity: parseInt(editForm.capacity) || 1,
        trainer_id: editForm.trainer_id || null,
        recurrence_end_date: (editForm as any).recurrence_end_date || null,
      })
    })
    const data = await res.json()
    if (res.ok && !data.error) { notify('Updated!'); setEditSession(null); load() }
    else { notify(data.error || 'Failed to save — check console', false) }
    setSaving(false)
  }

  async function handleDelete(sessionId: string) {
    await fetch(`/api/session-templates/${sessionId}`, { method: 'DELETE' })
    load()
  }

  async function toggleActive(s: any) {
    await fetch(`/api/session-templates/${s.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !s.is_active })
    })
    load()
  }

  function toggleDay(day: string, isEdit = false) {
    if (isEdit) {
      setEditForm(p => ({ ...p, recurrence_days: p.recurrence_days.includes(day) ? p.recurrence_days.filter(d => d !== day) : [...p.recurrence_days, day] }))
    } else {
      setForm(p => ({ ...p, recurrence_days: p.recurrence_days.includes(day) ? p.recurrence_days.filter(d => d !== day) : [...p.recurrence_days, day] }))
    }
  }

  function getDayLabels(days: string[]) {
    return days?.map(d => DAY_NAMES.find(n => n.key === d)?.label).filter(Boolean).join('، ')
  }

  function exportCSV() {
    const headers = ['title','start_time','end_time','capacity','recurrence_type','recurrence_days']
    const rows = sessions.map(s => [s.title, s.start_time, s.end_time, s.capacity, s.recurrence_type || 'weekly', (s.recurrence_days || []).join('|')])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'sessions.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `title,start_time,end_time,capacity,recurrence_type,recurrence_days
Swimming Level 1,08:00,09:00,10,weekly,sunday|tuesday|thursday
Yoga Class,18:00,19:00,8,weekly,monday|wednesday`
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'sessions-template.csv'; a.click()
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    let success = 0, failed = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}; headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      if (!row.title || !row.start_time || !row.end_time) { failed++; continue }
      const res = await fetch('/api/session-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: id, title: row.title, start_time: row.start_time, end_time: row.end_time, capacity: parseInt(row.capacity) || 10, recurrence_type: row.recurrence_type || 'weekly', recurrence_days: row.recurrence_days ? row.recurrence_days.split('|') : [], is_active: true })
      })
      if (res.ok) success++; else failed++
    }
    alert(`Imported: ${success} success, ${failed} failed`); e.target.value = ''; load()
  }

  const FormSection = ({ isEdit = false }: { isEdit?: boolean }) => {
    const f = isEdit ? editForm : form
    const setF = isEdit ? (v: any) => setEditForm(v) : (v: any) => setForm(v)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><Label>Session Name *</Label>
          <input style={inp} value={f.title} onChange={e => setF({...f, title: e.target.value})} placeholder="e.g. Swimming Level 1 — Group A" />
        </div>
        <div><Label>Capacity</Label><input style={inp} type="number" min="1" value={f.capacity} onChange={e => setF({...f, capacity: e.target.value})} /></div>
        {!isEdit && (
          <div><Label>Type</Label>
            <select style={inp} value={(f as any).recurrence_type} onChange={e => setF({...f, recurrence_type: e.target.value, recurrence_days: []})}>
              <option value="single">حصة واحدة</option>
              <option value="weekly">أسبوعي</option>
              <option value="daily">يومي</option>
            </select>
          </div>
        )}
        <div><Label>Start Time *</Label><input style={inp} type="time" value={f.start_time} onChange={e => setF({...f, start_time: e.target.value})} /></div>
        <div><Label>End Time *</Label><input style={inp} type="time" value={f.end_time} onChange={e => setF({...f, end_time: e.target.value})} /></div>
        <div className="md:col-span-2"><Label>Package (Optional)</Label>
          <select style={inp} value={f.package_id || ''} onChange={e => setF({...f, package_id: e.target.value})}>
            <option value="">No package linked</option>
            {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><Label>Trainer / Responsible (Optional)</Label>
          <select style={inp} value={f.trainer_id || ''} onChange={e => setF({...f, trainer_id: e.target.value})}>
            <option value="">No trainer assigned</option>
            {members.filter((m: any) => m.user_id).map((m: any) => (
              <option key={m.id} value={m.user_id}>{m.users?.full_name || m.email}</option>
            ))}
          </select>
        </div>
        {((isEdit && editSession?.recurrence_type === 'weekly') || (!isEdit && form.recurrence_type === 'weekly')) && (
          <div className="md:col-span-2"><Label>Days *</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {DAY_NAMES.map(day => (
                <button key={day.key} type="button" onClick={() => toggleDay(day.key, isEdit)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  style={{ background: f.recurrence_days.includes(day.key) ? 'var(--primary)' : 'var(--bg)', color: f.recurrence_days.includes(day.key) ? '#fff' : 'var(--text-sec)', border: '1px solid var(--border)' }}>
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {isEdit && (
          <div><Label>End Date (Optional)</Label>
            <input style={inp} type="date"
              value={(f as any).recurrence_end_date || ''}
              onChange={e => setF({...f, recurrence_end_date: e.target.value})}
              placeholder="Leave empty = unlimited" />
            <p style={{ fontSize: 11, color: 'var(--text-ter)', marginTop: 3 }}>
              فارغ = بدون نهاية · Set a date to stop repeating
            </p>
          </div>
        )}
      </div>
    )
  }

  // ── Trainer filter ────────────────────────────────────────────────
  const filteredSessions = sessions.filter(s =>
    !filterTrainer || s.trainer_id === filterTrainer
  )
  const trainersInSessions = members.filter((m: any) =>
    sessions.some(s => s.trainer_id === (m.user_id || m.id))
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Sessions</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>Define your weekly schedule</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <FileText size={14} />Template
          </button>
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <Upload size={14} />Import<input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <Download size={14} />Export
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--primary)' }}>
            <Plus size={15} />New Session
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: msgOk ? 'var(--green-dim)' : 'var(--danger-dim)', color: msgOk ? 'var(--green)' : 'var(--danger)' }}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>New Session</h2>
            <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-ter)' }}><X size={18} /></button>
          </div>
          <FormSection />
          <div className="flex gap-3 mt-5">
            <button onClick={handleCreate} disabled={saving} className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}>{saving ? 'Saving...' : 'Create Session'}</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl text-sm font-semibold"
              style={{ border: '1px solid var(--border)', color: 'var(--text-sec)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {!loading && sessions.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: filterTrainer ? 'var(--primary)' : 'var(--text-ter)' }}>
            <Filter size={13} />
            <span>{filterTrainer ? '1 filter active' : 'Filter by'}</span>
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={filterTrainer}
              onChange={e => setFilterTrainer(e.target.value)}
              style={{
                appearance: 'none', WebkitAppearance: 'none',
                border: filterTrainer ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: 12, fontWeight: 600,
                background: filterTrainer ? 'var(--primary-dim)' : 'var(--surface)',
                color: filterTrainer ? 'var(--primary)' : 'var(--text-sec)',
                cursor: 'pointer', outline: 'none', minWidth: 160,
              }}>
              <option value="">All Trainers</option>
              {trainersInSessions.map((m: any) => (
                <option key={m.id} value={m.user_id || m.id}>
                  {m.users?.full_name || m.users?.email || m.email}
                </option>
              ))}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
              color: filterTrainer ? 'var(--primary)' : 'var(--text-ter)' }} />
          </div>
          {filterTrainer && (
            <button onClick={() => setFilterTrainer('')}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
              style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
              <X size={11} /> Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-ter)' }}>Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="font-semibold" style={{ color: 'var(--text-sec)' }}>No sessions yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>Create your weekly schedule</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <Filter size={32} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-ter)' }}>No sessions match the current filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(s => (
            <div key={s.id} className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', opacity: s.is_active ? 1 : 0.55 }}>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--primary-dim)' }}>
                    <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{s.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-ter)' }}>
                      {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                      {s.recurrence_type === 'weekly' && s.recurrence_days?.length > 0 && <span> · {getDayLabels(s.recurrence_days)}</span>}
                      {s.recurrence_type === 'daily' && <span> · يومي</span>}
                      {s.recurrence_type === 'single' && <span> · حصة واحدة</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--text-ter)' }}>👥 {s.capacity}</span>
                      {s.package_id && packages.find(p => p.id === s.package_id) && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                          {packages.find(p => p.id === s.package_id)?.name}
                        </span>
                      )}
                      {!s.is_active && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--warn-dim)', color: 'var(--warn)' }}>Inactive</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditSession(s); setEditForm({ title: s.title, capacity: String(s.capacity), recurrence_days: s.recurrence_days||[], start_time: s.start_time?.slice(0,5), end_time: s.end_time?.slice(0,5), is_active: s.is_active, trainer_id: s.trainer_id||'', package_id: s.package_id||'', recurrence_end_date: s.recurrence_end_date ? s.recurrence_end_date.slice(0,10) : '' }) }}
                    className="p-1.5 rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text-sec)' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => toggleActive(s)} className="p-1.5 rounded-lg"
                    style={{ background: s.is_active ? 'var(--warn-dim)' : 'var(--green-dim)', color: s.is_active ? 'var(--warn)' : 'var(--green)' }}>
                    {s.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg"
                    style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {editSession?.id === s.id && (
                <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--divider)', background: 'var(--bg)' }}>
                  <FormSection isEdit />
                  <div className="flex gap-2 mt-4">
                    <button onClick={saveEdit} disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                      style={{ background: 'var(--primary)' }}>{saving ? 'Saving...' : 'Save Changes'}</button>
                    <button onClick={() => setEditSession(null)} className="px-5 py-2 rounded-xl text-sm font-semibold"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-sec)' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
