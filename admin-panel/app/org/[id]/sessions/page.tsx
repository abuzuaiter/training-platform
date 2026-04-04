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
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '', capacity: '10', is_recurring: false,
    recurrence_type: 'weekly', recurrence_days: [] as string[],
    recurrence_end_date: '', start_time: '', end_time: '',
    single_date: '', single_start: '07:00', single_end: '08:00'
  })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/calendar-sessions?org_id=${id}`)
    setSessions(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.title) { setMessage('Title is required'); return }
    setSaving(true)

    const QATAR_OFFSET = 3 * 60 * 60 * 1000

    let start_time, end_time

    if (!form.is_recurring) {
      if (!form.single_date) { setMessage('Date is required'); setSaving(false); return }
      const [sh, sm] = form.single_start.split(':').map(Number)
      const [eh, em] = form.single_end.split(':').map(Number)
      const startDt = new Date(form.single_date)
      startDt.setHours(sh, sm, 0, 0)
      const endDt = new Date(form.single_date)
      endDt.setHours(eh, em, 0, 0)
      start_time = new Date(startDt.getTime() - QATAR_OFFSET).toISOString()
      end_time = new Date(endDt.getTime() - QATAR_OFFSET).toISOString()
    } else {
      if (!form.start_time || !form.end_time) { setMessage('Time is required'); setSaving(false); return }
      // Use today as base for recurring
      const today = new Date()
      const [sh, sm] = form.start_time.split(':').map(Number)
      const [eh, em] = form.end_time.split(':').map(Number)
      today.setHours(sh, sm, 0, 0)
      const endToday = new Date(today)
      endToday.setHours(eh, em, 0, 0)
      start_time = new Date(today.getTime() - QATAR_OFFSET).toISOString()
      end_time = new Date(endToday.getTime() - QATAR_OFFSET).toISOString()
    }

    const res = await fetch('/api/calendar-sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: id,
        title: form.title,
        capacity: parseInt(form.capacity),
        start_time, end_time,
        is_recurring: form.is_recurring,
        recurrence_type: form.is_recurring ? form.recurrence_type : null,
        recurrence_days: form.is_recurring && form.recurrence_type === 'weekly' ? form.recurrence_days : null,
        recurrence_end_date: form.is_recurring ? form.recurrence_end_date : null,
      })
    })

    if (res.ok) {
      setMessage('Session created!')
      setShowForm(false)
      setForm({ title: '', capacity: '10', is_recurring: false, recurrence_type: 'weekly', recurrence_days: [], recurrence_end_date: '', start_time: '', end_time: '', single_date: '', single_start: '07:00', single_end: '08:00' })
      load()
    } else {
      const d = await res.json()
      setMessage(d.error || 'Error')
    }
    setSaving(false)
  }

  async function handleDelete(sessionId: string) {
    await fetch(`/api/calendar-sessions/${sessionId}`, { method: 'DELETE' })
    load()
  }

  const QATAR_OFFSET = 3 * 60 * 60 * 1000
  function formatDateTime(dateStr: string) {
    const d = new Date(new Date(dateStr).getTime() + QATAR_OFFSET)
    return d.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) + ' — ' + d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sessions</h1>
          <p className="text-xs text-gray-400">Manage your fixed and recurring sessions</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + New Session
        </button>
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">TITLE *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. سباحة مستوى 1 — مجموعة أ" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" min="1" placeholder="10" />
              </div>
              <div className="flex items-center gap-3 mt-4">
                <input type="checkbox" id="recurring" checked={form.is_recurring}
                  onChange={e => setForm({...form, is_recurring: e.target.checked})}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700 cursor-pointer">Recurring Session</label>
              </div>

              {!form.is_recurring ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">DATE *</label>
                    <input value={form.single_date} onChange={e => setForm({...form, single_date: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME</label>
                    <input value={form.single_start} onChange={e => setForm({...form, single_start: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="time" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME</label>
                    <input value={form.single_end} onChange={e => setForm({...form, single_end: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="time" />
                  </div>
                </>
              ) : (
                <>
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
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">REPEAT</label>
                    <select value={form.recurrence_type} onChange={e => setForm({...form, recurrence_type: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                      <option value="daily">يومي — Daily</option>
                      <option value="weekly">أسبوعي — Weekly</option>
                      <option value="monthly">شهري — Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE</label>
                    <input value={form.recurrence_end_date} onChange={e => setForm({...form, recurrence_end_date: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
                  </div>
                  {form.recurrence_type === 'weekly' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-2">DAYS</label>
                      <div className="flex gap-2 flex-wrap">
                        {DAY_NAMES.map(day => (
                          <button key={day.key} type="button"
                            onClick={() => toggleDay(day.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${form.recurrence_days.includes(day.key) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Session'}
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
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-gray-500 font-medium">No sessions yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first session to get started</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sessions.map(sess => (
              <div key={sess.id} className={`bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between ${sess.status === 'cancelled' ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 text-lg">
                    {sess.is_recurring ? '🔄' : '📅'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{sess.title}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(sess.start_time)}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">👥 {sess.booked_count}/{sess.capacity}</span>
                      {sess.is_recurring && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">🔄 Recurring</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${sess.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{sess.status}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(sess.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
