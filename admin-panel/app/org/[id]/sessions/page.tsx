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
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calSessions, setCalSessions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'templates' | 'sessions'>('templates')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editTemplate, setEditTemplate] = useState<any>(null)
  const [form, setForm] = useState({
    title: '', capacity: '10',
    recurrence_type: 'weekly',
    recurrence_days: [] as string[],
    start_time: '07:00', end_time: '08:00',
  })
  const [editForm, setEditForm] = useState({
    title: '', capacity: '', recurrence_type: '',
    recurrence_days: [] as string[],
    start_time: '', end_time: '', is_active: true
  })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/session-templates?org_id=${id}`)
    setTemplates(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.title || !form.start_time || !form.end_time) { setMessage('Please fill required fields'); return }
    if (form.recurrence_type === 'weekly' && form.recurrence_days.length === 0) { setMessage('Please select at least one day'); return }
    setSaving(true)
    const res = await fetch('/api/session-templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id, capacity: parseInt(form.capacity) })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Session template created!')
      setShowForm(false)
      setForm({ title: '', capacity: '10', recurrence_type: 'weekly', recurrence_days: [], start_time: '07:00', end_time: '08:00' })
      load()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function saveEdit() {
    if (!editTemplate) return
    setSaving(true)
    const res = await fetch(`/api/session-templates/${editTemplate.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, capacity: parseInt(editForm.capacity) })
    })
    if (res.ok) { setMessage('Updated!'); setEditTemplate(null); load() }
    setSaving(false)
  }

  async function handleDelete(templateId: string) {
    await fetch(`/api/session-templates/${templateId}`, { method: 'DELETE' })
    load()
  }

  async function toggleActive(t: any) {
    await fetch(`/api/session-templates/${t.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !t.is_active })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sessions</h1>
          <p className="text-xs text-gray-400">Define your recurring session templates</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + New Session
        </button>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'templates' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📋 Templates
          </button>
          <button onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'sessions' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            📅 Sessions ({calSessions.length})
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 pb-8">
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">TITLE *</label>
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
                  <option value="single">حصة واحدة — Single</option>
                  <option value="weekly">أسبوعي — Weekly</option>
                  <option value="daily">يومي — Daily</option>
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

        {activeTab === 'templates' && loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
) : activeTab === 'templates' && templates.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-gray-500 font-medium">No sessions yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first session template</p>
          </div>
) : activeTab === 'templates' ? (
          <div className="grid gap-3">
            {templates.map(t => (
              <div key={t.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${!t.is_active ? 'opacity-60' : ''}`}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg">
                      {t.recurrence_type === 'single' ? '📅' : '🔄'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.title}</p>
                      <p className="text-xs text-gray-400">
                        {t.start_time?.slice(0,5)} — {t.end_time?.slice(0,5)}
                        {t.recurrence_type === 'weekly' && t.recurrence_days && (
                          <span className="ml-2">• {getDayLabels(t.recurrence_days)}</span>
                        )}
                        {t.recurrence_type === 'daily' && <span className="ml-2">• يومي</span>}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">👥 capacity: {t.capacity}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${t.recurrence_type === 'single' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {t.recurrence_type === 'single' ? 'حصة واحدة' : t.recurrence_type === 'weekly' ? 'أسبوعي' : 'يومي'}
                        </span>
                        {!t.is_active && <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full">Inactive</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditTemplate(t); setEditForm({ title: t.title, capacity: String(t.capacity), recurrence_type: t.recurrence_type, recurrence_days: t.recurrence_days || [], start_time: t.start_time?.slice(0,5), end_time: t.end_time?.slice(0,5), is_active: t.is_active }) }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                      ✏️ Edit
                    </button>
                    <button onClick={() => toggleActive(t)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${t.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {t.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition">
                      🗑️
                    </button>
                  </div>
                </div>

                {editTemplate?.id === t.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">TITLE</label>
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
                    {editForm.recurrence_type === 'weekly' && (
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
                      <button onClick={() => setEditTemplate(null)}
                        className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="grid gap-3">
            {calSessions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-gray-500 font-medium">No sessions yet</p>
                <p className="text-gray-400 text-sm mt-1">Schedule sessions from the Enrollments page</p>
              </div>
            ) : calSessions.map(sess => {
              const QATAR_OFFSET = 3 * 60 * 60 * 1000
              const sessDate = new Date(new Date(sess.start_time).getTime() + QATAR_OFFSET)
              return (
                <div key={sess.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{sess.title}</p>
                      <p className="text-xs text-gray-400">
                        {sessDate.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} — {sessDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-400">👥 {sess.booked_count}/{sess.capacity}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${sess.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{sess.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={sess.trainer_id || ''}
                        onChange={e => assignTrainer(sess.id, e.target.value)}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400 min-w-32">
                        <option value="">No trainer</option>
                        {members.map(m => (
                          <option key={m.id} value={m.users?.id}>{m.users?.full_name || m.users?.email}</option>
                        ))}
                      </select>
                      {savingTrainer === sess.id && <span className="text-xs text-blue-400">Saving...</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
