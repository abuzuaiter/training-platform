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

export default function OrgEnrollmentsPage() {
  const params = useParams()
  const id = params.id as string
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ customer_id: '', package_id: '', start_date: '' })
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [bookingMode, setBookingMode] = useState(false)
  const [booking, setBooking] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [scheduleStartDate, setScheduleStartDate] = useState('')

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [enrRes, custRes, pkgRes, tmpRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/packages?org_id=${id}`),
      fetch(`/api/session-templates?org_id=${id}`)
    ])
    setEnrollments(enrRes.ok ? await enrRes.json() : [])
    setCustomers(custRes.ok ? await custRes.json() : [])
    setPackages(pkgRes.ok ? await pkgRes.json() : [])
    setTemplates(tmpRes.ok ? await tmpRes.json() : [])
    setLoading(false)
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
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleCancel(enrollId: string) {
    await fetch(`/api/enrollments/${enrollId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
    loadAll()
  }

  async function confirmSchedule() {
    if (!selectedEnrollment || selectedTemplates.length === 0) return
    setBooking(true)

    const pkg = packages.find(p => p.id === selectedEnrollment.package_id)
    const totalSessions = pkg?.type === 'sessions' 
      ? (pkg.sessions_count || 0) 
      : pkg?.type === 'single' ? 1 : 90
    const QATAR_OFFSET = 3 * 60 * 60 * 1000
    const baseDate = scheduleStartDate
      ? new Date(scheduleStartDate)
      : new Date(selectedEnrollment.start_date || new Date())

    let createdCount = 0
    const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

    for (const templateId of selectedTemplates) {
      const template = templates.find(t => t.id === templateId)
      if (!template) continue

      if (template.recurrence_type === 'single') {
        // Single session — just create one
        const [sh, sm] = template.start_time.slice(0,5).split(':').map(Number)
        const [eh, em] = template.end_time.slice(0,5).split(':').map(Number)
        const startDt = new Date(baseDate)
        startDt.setHours(sh, sm, 0, 0)
        const endDt = new Date(baseDate)
        endDt.setHours(eh, em, 0, 0)

        const sessRes = await fetch('/api/calendar-sessions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: id,
            title: template.title,
            start_time: new Date(startDt.getTime() - QATAR_OFFSET).toISOString(),
            end_time: new Date(endDt.getTime() - QATAR_OFFSET).toISOString(),
            capacity: template.capacity,
          })
        })
        if (sessRes.ok) {
          const sess = await sessRes.json()
          await fetch('/api/calendar-bookings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sess.id, customer_id: selectedEnrollment.customer_id, organization_id: id, enrollment_id: selectedEnrollment.id })
          })
          createdCount++
        }
      } else if (template.recurrence_type === 'weekly' && template.recurrence_days?.length > 0) {
        // Weekly recurring — generate sessions per day
        const [sh, sm] = template.start_time.slice(0,5).split(':').map(Number)
        const [eh, em] = template.end_time.slice(0,5).split(':').map(Number)
        const selectedDayNums = template.recurrence_days.map((d: string) => dayOrder.indexOf(d)).sort((a: number, b: number) => a - b)
        const endDate = new Date(baseDate)
        endDate.setMonth(endDate.getMonth() + 3)

        let current = new Date(baseDate)
        let count = 0

        while (current <= endDate && count < totalSessions) {
          const currentDayNum = current.getDay()
          if (selectedDayNums.includes(currentDayNum)) {
            const startDt = new Date(current)
            startDt.setHours(sh, sm, 0, 0)
            const endDt = new Date(current)
            endDt.setHours(eh, em, 0, 0)

            const sessRes = await fetch('/api/calendar-sessions', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organization_id: id,
                title: template.title,
                start_time: new Date(startDt.getTime() - QATAR_OFFSET).toISOString(),
                end_time: new Date(endDt.getTime() - QATAR_OFFSET).toISOString(),
                capacity: template.capacity,
                is_recurring: true,
                recurrence_type: 'weekly',
              })
            })
            if (sessRes.ok) {
              const sess = await sessRes.json()
              await fetch('/api/calendar-bookings', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sess.id, customer_id: selectedEnrollment.customer_id, organization_id: id, enrollment_id: selectedEnrollment.id })
              })
              createdCount++
              count++
            }
          }
          current.setDate(current.getDate() + 1)
        }
      } else if (template.recurrence_type === 'daily') {
        const [sh, sm] = template.start_time.slice(0,5).split(':').map(Number)
        const [eh, em] = template.end_time.slice(0,5).split(':').map(Number)
        let current = new Date(baseDate)
        let count = 0

        while (count < totalSessions) {
          const startDt = new Date(current)
          startDt.setHours(sh, sm, 0, 0)
          const endDt = new Date(current)
          endDt.setHours(eh, em, 0, 0)

          const sessRes = await fetch('/api/calendar-sessions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organization_id: id,
              title: template.title,
              start_time: new Date(startDt.getTime() - QATAR_OFFSET).toISOString(),
              end_time: new Date(endDt.getTime() - QATAR_OFFSET).toISOString(),
              capacity: template.capacity,
            })
          })
          if (sessRes.ok) {
            const sess = await sessRes.json()
            await fetch('/api/calendar-bookings', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: sess.id, customer_id: selectedEnrollment.customer_id, organization_id: id, enrollment_id: selectedEnrollment.id })
            })
            createdCount++
            count++
          }
          current.setDate(current.getDate() + 1)
        }
      }
    }

    setMessage(`${createdCount} sessions created and booked!`)
    setBooking(false)
    setBookingMode(false)
    setSelectedEnrollment(null)
    setSelectedTemplates([])
    setScheduleStartDate('')
    setTimeout(() => setMessage(''), 4000)
    loadAll()
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    completed: 'bg-blue-50 text-blue-600',
    cancelled: 'bg-red-50 text-red-500',
  }

  function getDayLabels(days: string[]) {
    return days?.map(d => DAY_NAMES.find(n => n.key === d)?.label).filter(Boolean).join('، ')
  }

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
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE (optional)</label>
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
                        <button onClick={() => { setSelectedEnrollment(enr); setBookingMode(true); setSelectedTemplates([]); setScheduleStartDate('') }}
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
            <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Schedule Sessions</h2>
                  <p className="text-sm text-gray-400">{selectedEnrollment.customers?.full_name} — {selectedEnrollment.packages?.name}</p>
                </div>
                <button onClick={() => setBookingMode(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE (optional)</label>
                <input value={scheduleStartDate} onChange={e => setScheduleStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="date" placeholder="Defaults to enrollment start date" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">SELECT SESSION TEMPLATES</p>
                {templates.filter(t => t.is_active).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No active session templates</p>
                    <p className="text-gray-300 text-xs mt-1">Create templates from the Sessions page first</p>
                  </div>
                ) : templates.filter(t => t.is_active).map(t => {
                  const isSelected = selectedTemplates.includes(t.id)
                  return (
                    <label key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="checkbox" checked={isSelected}
                        onChange={e => setSelectedTemplates(e.target.checked ? [...selectedTemplates, t.id] : selectedTemplates.filter(s => s !== t.id))}
                        className="w-4 h-4 accent-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-400">
                          {t.start_time?.slice(0,5)} — {t.end_time?.slice(0,5)}
                          {t.recurrence_type === 'weekly' && t.recurrence_days && (
                            <span className="ml-1">• {getDayLabels(t.recurrence_days)}</span>
                          )}
                          {t.recurrence_type === 'daily' && <span className="ml-1">• يومي</span>}
                          {t.recurrence_type === 'single' && <span className="ml-1">• حصة واحدة</span>}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">👥 {t.capacity}</span>
                    </label>
                  )
                })}
              </div>

              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button onClick={confirmSchedule} disabled={booking || selectedTemplates.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {booking ? 'Creating sessions...' : `Schedule ${selectedTemplates.length} template${selectedTemplates.length !== 1 ? 's' : ''}`}
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
