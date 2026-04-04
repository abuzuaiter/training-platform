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

interface TimeSlot { start: string; end: string }
interface DaySchedule { enabled: boolean; slots: TimeSlot[] }
type Schedule = Record<string, DaySchedule>

function initSchedule(): Schedule {
  const s: Schedule = {}
  DAY_NAMES.forEach(d => { s[d.key] = { enabled: false, slots: [{ start: '07:00', end: '08:00' }] } })
  return s
}

export default function OrgEnrollmentsPage() {
  const params = useParams()
  const id = params.id as string
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ customer_id: '', package_id: '', start_date: '' })
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [bookingMode, setBookingMode] = useState(false)
  const [booking, setBooking] = useState(false)
  const [schedule, setSchedule] = useState<Schedule>(initSchedule())
  const [startDate, setStartDate] = useState('')
  const [singleDate, setSingleDate] = useState('')
  const [singleStart, setSingleStart] = useState('07:00')
  const [singleEnd, setSingleEnd] = useState('08:00')

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [enrRes, custRes, pkgRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/packages?org_id=${id}`)
    ])
    setEnrollments(enrRes.ok ? await enrRes.json() : [])
    setCustomers(custRes.ok ? await custRes.json() : [])
    setPackages(pkgRes.ok ? await pkgRes.json() : [])
    setLoading(false)
  }

  function toggleDay(dayKey: string) {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], enabled: !prev[dayKey].enabled }
    }))
  }

  function addSlot(dayKey: string) {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], slots: [...prev[dayKey].slots, { start: '07:00', end: '08:00' }] }
    }))
  }

  function removeSlot(dayKey: string, idx: number) {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], slots: prev[dayKey].slots.filter((_, i) => i !== idx) }
    }))
  }

  function updateSlot(dayKey: string, idx: number, field: 'start' | 'end', value: string) {
    setSchedule(prev => {
      const slots = [...prev[dayKey].slots]
      slots[idx] = { ...slots[idx], [field]: value }
      return { ...prev, [dayKey]: { ...prev[dayKey], slots } }
    })
  }

  function generateSessions() {
    const pkg = packages.find(p => p.id === selectedEnrollment?.package_id)
    if (!pkg) return []

    const sessions: { title: string; start_time: string; end_time: string; }[] = []
    const baseStr = startDate || selectedEnrollment?.start_date
    if (!baseStr) return []
    const base = new Date(baseStr)
    if (isNaN(base.getTime())) return []
    const totalSessions = pkg.type === 'sessions' ? pkg.sessions_count : 30
    const enabledDays = DAY_NAMES.filter(d => schedule[d.key].enabled)
    if (enabledDays.length === 0) return []

    let current = new Date(base)
    let count = 0
    let attempts = 0

    while (count < totalSessions && attempts < 365) {
      const dayName = DAY_NAMES[current.getDay()].key
      const daySchedule = schedule[dayName]

      if (daySchedule.enabled) {
        daySchedule.slots.forEach(slot => {
          if (count < totalSessions) {
            const [sh, sm] = slot.start.split(':').map(Number)
            const [eh, em] = slot.end.split(':').map(Number)
            const startDt = new Date(current)
            startDt.setHours(sh, sm, 0, 0)
            const endDt = new Date(current)
            endDt.setHours(eh, em, 0, 0)
            // Convert from Qatar time to UTC
            const utcStart = new Date(startDt.getTime() - 3 * 60 * 60 * 1000)
            const utcEnd = new Date(endDt.getTime() - 3 * 60 * 60 * 1000)
            sessions.push({
              title: selectedEnrollment?.customers?.full_name || 'Session',
              start_time: utcStart.toISOString(),
              end_time: utcEnd.toISOString(),
            })
            count++
          }
        })
      }
      current.setDate(current.getDate() + 1)
      attempts++
    }
    return sessions
  }

  async function confirmBooking() {
    if (!selectedEnrollment) return
    const pkg = packages.find(p => p.id === selectedEnrollment.package_id)
    setBooking(true)

    if (pkg?.type === 'single') {
      // Single session
      const [sh, sm] = singleStart.split(':').map(Number)
      const [eh, em] = singleEnd.split(':').map(Number)
      const startDt = new Date(singleDate)
      startDt.setHours(sh, sm, 0, 0)
      const endDt = new Date(singleDate)
      endDt.setHours(eh, em, 0, 0)
      const utcStart = new Date(startDt.getTime() - 3 * 60 * 60 * 1000)
      const utcEnd = new Date(endDt.getTime() - 3 * 60 * 60 * 1000)

      // Create session then book
      const sessRes = await fetch('/api/calendar-sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: id, title: selectedEnrollment.customers?.full_name, start_time: utcStart.toISOString(), end_time: utcEnd.toISOString(), capacity: 1 })
      })
      if (sessRes.ok) {
        const sess = await sessRes.json()
        await fetch('/api/calendar-bookings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sess.id, customer_id: selectedEnrollment.customer_id, organization_id: id, enrollment_id: selectedEnrollment.id })
        })
      }
      setMessage('Session booked!')
    } else {
      // Multi sessions
      const sessions = generateSessions()
      let success = 0
      for (const sess of sessions) {
        const sessRes = await fetch('/api/calendar-sessions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organization_id: id, title: sess.title, start_time: sess.start_time, end_time: sess.end_time, capacity: 1 })
        })
        if (sessRes.ok) {
          const newSess = await sessRes.json()
          await fetch('/api/calendar-bookings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: newSess.id, customer_id: selectedEnrollment.customer_id, organization_id: id, enrollment_id: selectedEnrollment.id })
          })
          success++
        }
      }
      setMessage(`${success} sessions created and booked!`)
    }

    setBooking(false)
    setBookingMode(false)
    setSelectedEnrollment(null)
    setSchedule(initSchedule())
    setStartDate('')
    setTimeout(() => setMessage(''), 4000)
    loadAll()
  }

  async function handleCreate() {
    if (!form.customer_id || !form.package_id) { setMessage('Customer and package are required'); return }
    setSaving(true)
    const res = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Enrollment created!')
      setShowForm(false)
      setForm({ customer_id: '', package_id: '', start_date: '' })
      loadAll()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleCancel(enrollId: string) {
    await fetch(`/api/enrollments/${enrollId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
    loadAll()
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    completed: 'bg-blue-50 text-blue-600',
    cancelled: 'bg-red-50 text-red-500',
  }

  const selectedPkg = packages.find(p => p.id === selectedEnrollment?.package_id)
  const previewSessions = selectedPkg?.type !== 'single' ? generateSessions() : []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Enrollments</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + New Enrollment
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Enrollment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CUSTOMER *</label>
                <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PACKAGE *</label>
                <select value={form.package_id} onChange={e => setForm({...form, package_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">Select package...</option>
                  {packages.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.price} QAR</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE</label>
                <input value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Enrollment'}
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
        ) : enrollments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-gray-500 font-medium">No enrollments yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {enrollments.map(enr => (
              <div key={enr.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                      {enr.customers?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{enr.customers?.full_name}</p>
                      <p className="text-xs text-gray-400">{enr.packages?.name} — {enr.packages?.price} QAR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enr.status]}`}>{enr.status}</span>
                      {enr.sessions_remaining !== null && (
                        <p className={`text-xs mt-1 font-medium ${enr.sessions_remaining <= 2 ? 'text-amber-500' : 'text-gray-500'}`}>
                          {enr.sessions_remaining} sessions left
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">Started: {new Date(enr.start_date).toLocaleDateString()}</p>
                    </div>
                    {enr.status === 'active' && (
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedEnrollment({...enr, customer_id: enr.customer_id || enr.customers?.id}); setBookingMode(true); setSchedule(initSchedule()) }}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                          📅 Schedule
                        </button>
                        <button onClick={() => handleCancel(enr.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition">
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Schedule Modal */}
        {bookingMode && selectedEnrollment && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Schedule Sessions</h2>
                  <p className="text-sm text-gray-400">{selectedEnrollment.customers?.full_name} — {selectedPkg?.name}</p>
                  {selectedPkg?.type === 'sessions' && (
                    <p className="text-xs text-blue-600 mt-0.5">{selectedPkg.sessions_count} sessions total</p>
                  )}
                </div>
                <button onClick={() => setBookingMode(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {selectedPkg?.type === 'single' ? (
                  // Single session form
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">DATE *</label>
                      <input value={singleDate} onChange={e => setSingleDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME</label>
                        <input value={singleStart} onChange={e => setSingleStart(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="time" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME</label>
                        <input value={singleEnd} onChange={e => setSingleEnd(e.target.value)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="time" />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Multi session schedule
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE (optional)</label>
                      <input value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                        type="date" placeholder="Defaults to enrollment date" />
                    </div>

                    <div className="space-y-3">
                      {DAY_NAMES.map(day => (
                        <div key={day.key} className={`border rounded-xl overflow-hidden transition ${schedule[day.key].enabled ? 'border-blue-200' : 'border-gray-100'}`}>
                          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleDay(day.key)}>
                            <input type="checkbox" checked={schedule[day.key].enabled} onChange={() => toggleDay(day.key)}
                              className="w-4 h-4 accent-blue-600" onClick={e => e.stopPropagation()} />
                            <span className={`text-sm font-medium ${schedule[day.key].enabled ? 'text-blue-700' : 'text-gray-500'}`}>{day.label}</span>
                          </div>

                          {schedule[day.key].enabled && (
                            <div className="px-4 pb-3 space-y-2 bg-blue-50">
                              {schedule[day.key].slots.map((slot, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <input value={slot.start} onChange={e => updateSlot(day.key, idx, 'start', e.target.value)}
                                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400 w-28" type="time" />
                                  <span className="text-xs text-gray-400">→</span>
                                  <input value={slot.end} onChange={e => updateSlot(day.key, idx, 'end', e.target.value)}
                                    className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400 w-28" type="time" />
                                  {schedule[day.key].slots.length > 1 && (
                                    <button onClick={() => removeSlot(day.key, idx)} className="text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
                                  )}
                                  {idx === schedule[day.key].slots.length - 1 && (
                                    <button onClick={() => addSlot(day.key)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">+ Add</button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {previewSessions.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">PREVIEW — {previewSessions.length} sessions will be created</p>
                        <div className="max-h-24 overflow-y-auto space-y-0.5">
                          {previewSessions.slice(0, 5).map((s, i) => (
                            <p key={i} className="text-xs text-gray-400">
                              {new Date(new Date(s.start_time).getTime() + 3*60*60*1000).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })} — {new Date(new Date(s.start_time).getTime() + 3*60*60*1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          ))}
                          {previewSessions.length > 5 && <p className="text-xs text-gray-300">+{previewSessions.length - 5} more...</p>}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button onClick={confirmBooking} disabled={booking || (selectedPkg?.type !== 'single' && previewSessions.length === 0) || (selectedPkg?.type === 'single' && !singleDate)}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {booking ? 'Creating...' : selectedPkg?.type === 'single' ? 'Book Session' : `Create ${previewSessions.length} Sessions`}
                </button>
                <button onClick={() => setBookingMode(false)}
                  className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
