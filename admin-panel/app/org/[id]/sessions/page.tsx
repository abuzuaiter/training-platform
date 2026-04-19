'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const DAY_NAMES = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
  { key: 'saturday', label: 'السبت' },
]

export default function OrgSessionsPage() {
  const params = useParams()
  const id = params.id as string
  const [sessions, setSessions] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editSession, setEditSession] = useState<any>(null)
  const [form, setForm] = useState({
    title: '', capacity: '10',
    recurrence_type: 'weekly',
    recurrence_days: [] as string[],
    start_time: '07:00', end_time: '08:00', trainer_id: '',
  })
  const [editForm, setEditForm] = useState({
    title: '', capacity: '',
    recurrence_days: [] as string[],
    start_time: '', end_time: '', is_active: true
  })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const [sessRes, membRes] = await Promise.all([
      fetch(`/api/session-templates?org_id=${id}`),
      fetch(`/api/organizations/${id}/members`)
    ])
    setSessions(sessRes.ok ? await sessRes.json() : [])
    setMembers(membRes.ok ? await membRes.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.title || !form.start_time || !form.end_time) { setMessage('Please fill required fields'); return }
    if (form.recurrence_type === 'weekly' && form.recurrence_days.length === 0) { setMessage('Please select at least one day'); return }
    setSaving(true)
    const res = await fetch('/api/session-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id, capacity: parseInt(form.capacity), trainer_id: form.trainer_id || null })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Session created!')
      setShowForm(false)
      setForm({ title: '', capacity: '10', recurrence_type: 'weekly', recurrence_days: [], start_time: '07:00', end_time: '08:00' })
      load()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function saveEdit() {
    if (!editSession) return
    setSaving(true)
    const res = await fetch(`/api/session-templates/${editSession.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, capacity: parseInt(editForm.capacity) })
    })
    if (res.ok) { setMessage('Updated!'); setEditSession(null); load() }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
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
      setEditForm(prev => ({
        ...prev,
        recurrence_days: prev.recurrence_days.includes(day)
          ? prev.recurrence_days.filter(d => d !== day)
          : [...prev.recurrence_days, day]
      }))
    } else {
      setForm(prev => ({
        ...prev,
        recurrence_days: prev.recurrence_days.includes(day)
          ? prev.recurrence_days.filter(d => d !== day)
          : [...prev.recurrence_days, day]
      }))
    }
  }

  function getDayLabels(days: string[]) {
    return days?.map(d => DAY_NAMES.find(n => n.key === d)?.label).filter(Boolean).join('، ')
  }

  function exportCSV() {
    const headers = ['title','start_time','end_time','capacity','recurrence_type','recurrence_days','assigned_to']
    const rows = sessions.map(s => [
      s.title, s.start_time, s.end_time, s.capacity,
      s.recurrence_type || 'weekly',
      (s.recurrence_days || []).join('|'),
      s.trainer_id || ''
    ])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'sessions.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `title,start_time,end_time,capacity,recurrence_type,recurrence_days
# INSTRUCTIONS:
# title: Required. Session name e.g. "Swimming Level 1"
# start_time: Required. Format HH:MM e.g. 08:00
# end_time: Required. Format HH:MM e.g. 09:00
# capacity: Required. Max students e.g. 10
# recurrence_type: weekly / single / daily
# recurrence_days: Days separated by | e.g. sunday|tuesday|thursday
# assigned_to: Optional. Leave empty
# Delete comment lines before importing
Swimming Level 1,08:00,09:00,10,weekly,sunday|tuesday|thursday
Yoga Class,18:00,19:00,8,weekly,monday|wednesday`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'sessions-template.csv'; a.click()
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    let success = 0, failed = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      if (!row.title || !row.start_time || !row.end_time) { failed++; continue }
      const res = await fetch('/api/session-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: id,
          title: row.title,
          start_time: row.start_time,
          end_time: row.end_time,
          capacity: parseInt(row.capacity) || 10,
          recurrence_type: row.recurrence_type || 'weekly',
          recurrence_days: row.recurrence_days ? row.recurrence_days.split('|') : [],
          is_active: true
        })
      })
      if (res.ok) success++; else failed++
    }
    alert(`Imported: ${success} success, ${failed} failed`)
    e.target.value = ''
    load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sessions</h1>
          <p className="text-xs text-gray-400">Define your weekly schedule</p>
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
            + New Session
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">SESSION NAME *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. سباحة مستوى 1 — مجموعة أ" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" min="1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TYPE</label>
                <select value={form.recurrence_type} onChange={e => setForm({...form, recurrence_type: e.target.value, recurrence_days: []})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="single">حصة واحدة</option>
                  <option value="weekly">أسبوعي</option>
                  <option value="daily">يومي</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME *</label>
                <input value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="time" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME *</label>
                <input value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="time" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">ASSIGNED TO (Optional)</label>
                <select value={form.trainer_id} onChange={e => setForm({...form, trainer_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">No trainer assigned</option>
                  {members.map(m => (
                    <option key={m.id} value={m.users?.id}>{m.users?.full_name || m.users?.email}</option>
                  ))}
                </select>
              </div>
              {form.recurrence_type === 'weekly' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">DAYS *</label>
                  <div className="flex gap-2 flex-wrap">
                    {DAY_NAMES.map(day => (
                      <button key={day.key} type="button" onClick={() => toggleDay(day.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${form.recurrence_days.includes(day.key) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Session'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-500 font-medium">No sessions yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your weekly schedule</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map(s => (
              <div key={s.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${!s.is_active ? 'opacity-60' : ''}`}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
                      {s.recurrence_type === 'single' ? '📅' : '🔄'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-400">
                        {s.start_time?.slice(0,5)} — {s.end_time?.slice(0,5)}
                        {s.recurrence_type === 'weekly' && s.recurrence_days?.length > 0 && (
                          <span className="ml-2">• {getDayLabels(s.recurrence_days)}</span>
                        )}
                        {s.recurrence_type === 'daily' && <span className="ml-2">• يومي</span>}
                        {s.recurrence_type === 'single' && <span className="ml-2">• حصة واحدة</span>}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">👥 Capacity: {s.capacity}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditSession(s); setEditForm({ title: s.title, capacity: String(s.capacity), recurrence_days: s.recurrence_days || [], start_time: s.start_time?.slice(0,5), end_time: s.end_time?.slice(0,5), is_active: s.is_active }) }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                      ✏️ Edit
                    </button>
                    <button onClick={() => toggleActive(s)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${s.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {s.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition">
                      🗑️
                    </button>
                  </div>
                </div>

                {editSession?.id === s.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">NAME</label>
                        <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                        <input value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="number" min="1" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME</label>
                        <input value={editForm.start_time} onChange={e => setEditForm({...editForm, start_time: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="time" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME</label>
                        <input value={editForm.end_time} onChange={e => setEditForm({...editForm, end_time: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="time" />
                      </div>
                    </div>
                    {s.recurrence_type === 'weekly' && (
                      <div className="mb-3">
                        <label className="block text-xs font-semibold text-gray-500 mb-2">DAYS</label>
                        <div className="flex gap-2 flex-wrap">
                          {DAY_NAMES.map(day => (
                            <button key={day.key} type="button" onClick={() => toggleDay(day.key, true)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${editForm.recurrence_days.includes(day.key) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditSession(null)}
                        className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
