'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

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
  const [availableSessions, setAvailableSessions] = useState<any[]>([])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [bookingMode, setBookingMode] = useState(false)
  const [booking, setBooking] = useState(false)

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

  async function loadSessions() {
    const res = await fetch(`/api/calendar-sessions?org_id=${id}`)
    setAvailableSessions(res.ok ? await res.json() : [])
  }

  async function handleBookSessions(enr: any) {
    setSelectedEnrollment(enr)
    setSelectedSessions([])
    setBookingMode(true)
    await loadSessions()
  }

  async function confirmBooking() {
    if (!selectedEnrollment || selectedSessions.length === 0) return
    setBooking(true)
    let success = 0
    for (const sessionId of selectedSessions) {
      const res = await fetch('/api/calendar-bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          customer_id: selectedEnrollment.customer_id,
          organization_id: id,
          enrollment_id: selectedEnrollment.id
        })
      })
      if (res.ok) success++
    }
    setMessage(`${success} sessions booked!`)
    setBookingMode(false)
    setSelectedEnrollment(null)
    setSelectedSessions([])
    setBooking(false)
    setTimeout(() => setMessage(''), 3000)
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

  const QATAR_OFFSET = 3 * 60
  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return new Date(d.getTime() + QATAR_OFFSET * 60 * 1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }
  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return new Date(d.getTime() + QATAR_OFFSET * 60 * 1000).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    completed: 'bg-blue-50 text-blue-600',
    cancelled: 'bg-red-50 text-red-500',
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enr.status]}`}>
                        {enr.status}
                      </span>
                      {enr.sessions_remaining !== null && (
                        <p className={`text-xs mt-1 font-medium ${enr.sessions_remaining <= 2 ? 'text-amber-500' : 'text-gray-500'}`}>
                          {enr.sessions_remaining} sessions left
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">Started: {new Date(enr.start_date).toLocaleDateString()}</p>
                    </div>
                    {enr.status === 'active' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleBookSessions(enr)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                          📅 Book Sessions
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

        {bookingMode && selectedEnrollment && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Book Sessions</h2>
                  <p className="text-sm text-gray-400">{selectedEnrollment.customers?.full_name} — {selectedEnrollment.packages?.name}</p>
                </div>
                <button onClick={() => setBookingMode(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {availableSessions.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No sessions available</p>
                ) : availableSessions.map(sess => {
                  const isSelected = selectedSessions.includes(sess.id)
                  const isFull = sess.booked_count >= sess.capacity
                  return (
                    <label key={sess.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-100 hover:border-gray-200'} ${isFull ? 'opacity-40 cursor-not-allowed' : ''}`}>
                      <input type="checkbox" checked={isSelected} disabled={isFull}
                        onChange={e => setSelectedSessions(e.target.checked ? [...selectedSessions, sess.id] : selectedSessions.filter(s => s !== sess.id))}
                        className="w-4 h-4 accent-blue-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{sess.title}</p>
                        <p className="text-xs text-gray-400">{formatDate(sess.start_time)} — {formatTime(sess.start_time)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{sess.booked_count}/{sess.capacity}</p>
                        {isFull && <p className="text-xs text-red-400">Full</p>}
                      </div>
                    </label>
                  )
                })}
              </div>
              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button onClick={confirmBooking} disabled={booking || selectedSessions.length === 0}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {booking ? 'Booking...' : `Book ${selectedSessions.length} Session${selectedSessions.length !== 1 ? 's' : ''}`}
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
