'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Session {
  id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  capacity: number
  booked_count: number
  status: string
  organization_id: string
  organizations: { name: string }
  activities: { name: string } | null
  bookings: any[]
}

const ORG_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
  'bg-red-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500'
]

export default function CalendarPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterOrg, setFilterOrg] = useState('all')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showBookForm, setShowBookForm] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    organization_id: '', activity_id: '', title: '',
    description: '', start_time: '', end_time: '', capacity: '1'
  })
  const [bookForm, setBookForm] = useState({ customer_id: '', notes: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [sessRes, orgsRes] = await Promise.all([
      fetch('/api/sessions'), fetch('/api/organizations')
    ])
    const [sessData, orgsData] = await Promise.all([sessRes.json(), orgsRes.json()])
    setSessions(sessData || [])
    setOrgs(orgsData || [])
    setLoading(false)
  }

  async function loadActivities(orgId: string) {
    const res = await fetch(`/api/activities?org_id=${orgId}`)
    const data = await res.json()
    setActivities(data || [])
  }

  async function loadCustomers(orgId: string) {
    const res = await fetch(`/api/organizations/${orgId}/customers`)
    const data = await res.json()
    setCustomers(data || [])
  }

  async function handleCreateSession() {
    if (!form.organization_id || !form.title || !form.start_time || !form.end_time) {
      setMessage('Please fill all required fields')
      return
    }
    setSaving(true)
    const res = await fetch('/api/sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, capacity: parseInt(form.capacity) })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Session created!')
      setShowForm(false)
      setForm({ organization_id: '', activity_id: '', title: '', description: '', start_time: '', end_time: '', capacity: '1' })
      loadAll()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleBook() {
    if (!bookForm.customer_id || !selectedSession) return
    setSaving(true)
    const res = await fetch('/api/bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selectedSession.id, customer_id: bookForm.customer_id, organization_id: selectedSession.organization_id, notes: bookForm.notes })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Booking confirmed!')
      setShowBookForm(false)
      setBookForm({ customer_id: '', notes: '' })
      loadAll()
      const updatedRes = await fetch(`/api/sessions/${selectedSession.id}`)
      setSelectedSession(await updatedRes.json())
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleDeleteSession(id: string) {
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    setSelectedSession(null)
    loadAll()
  }

  async function handleCancelBooking(bookingId: string) {
    await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' })
    if (selectedSession) {
      const res = await fetch(`/api/sessions/${selectedSession.id}`)
      setSelectedSession(await res.json())
    }
    loadAll()
  }

  function getOrgColor(orgId: string) {
    const idx = orgs.findIndex(o => o.id === orgId) % ORG_COLORS.length
    return ORG_COLORS[idx] || 'bg-blue-500'
  }

  function getWeekDays(date: Date) {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  function getMonthDays(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
    return days
  }

  function getSessionsForDay(date: Date) {
    return sessions.filter(s => {
      const sDate = new Date(s.start_time)
      const matchOrg = filterOrg === 'all' || s.organization_id === filterOrg
      return sDate.toDateString() === date.toDateString() && matchOrg
    })
  }

  function navigate(dir: number) {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  const weekDays = getWeekDays(currentDate)
  const monthDays = getMonthDays(currentDate)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  function getHeaderTitle() {
    if (view === 'month') return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    if (view === 'week') return `Week of ${weekDays[0].toLocaleDateString()}`
    return currentDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold text-sm">Calendar</span>
          </div>
          <button onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + New Session
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ORGANIZATION *</label>
                <select value={form.organization_id} onChange={e => { setForm({...form, organization_id: e.target.value, activity_id: ''}); loadActivities(e.target.value); loadCustomers(e.target.value) }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Select organization...</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ACTIVITY</label>
                <select value={form.activity_id} onChange={e => setForm({...form, activity_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">No activity</option>
                  {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">TITLE *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Morning Swimming Class" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME *</label>
                <input value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="datetime-local" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME *</label>
                <input value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="datetime-local" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" min="1" placeholder="10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Optional..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreateSession} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Session'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">←</button>
                <h2 className="text-lg font-bold text-gray-900">{getHeaderTitle()}</h2>
                <button onClick={() => navigate(1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">→</button>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Today</button>
              </div>
              <div className="flex items-center gap-3">
                <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none">
                  <option value="all">All Organizations</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  {(['day', 'week', 'month'] as const).map(v => (
                    <button key={v} onClick={() => setView(v)}
                      className={`px-3 py-1.5 text-xs font-medium capitalize ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Month View */}
            {view === 'month' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7">
                  {dayNames.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 border-b border-gray-100">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {monthDays.map((day, i) => (
                    <div key={i} className={`min-h-24 p-1.5 border-b border-r border-gray-50 ${day && day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''}`}>
                      {day && (
                        <>
                          <p className={`text-xs font-medium mb-1 ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-500'}`}>
                            {day.getDate()}
                          </p>
                          <div className="space-y-0.5">
                            {getSessionsForDay(day).slice(0, 3).map(s => (
                              <div key={s.id} onClick={() => setSelectedSession(s)}
                                className={`${getOrgColor(s.organization_id)} text-white text-xs px-1.5 py-0.5 rounded-md cursor-pointer truncate hover:opacity-90`}>
                                {new Date(s.start_time).toLocaleTimeString('en', {hour:'2-digit', minute:'2-digit'})} {s.title}
                              </div>
                            ))}
                            {getSessionsForDay(day).length > 3 && (
                              <p className="text-xs text-gray-400">+{getSessionsForDay(day).length - 3} more</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Week View */}
            {view === 'week' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 border-b border-gray-100">
                  {weekDays.map((day, i) => (
                    <div key={i} className={`py-3 text-center border-r border-gray-100 last:border-r-0 ${day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''}`}>
                      <p className="text-xs text-gray-500">{dayNames[i]}</p>
                      <p className={`text-lg font-bold ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 min-h-96">
                  {weekDays.map((day, i) => (
                    <div key={i} className="border-r border-gray-50 last:border-r-0 p-1.5 space-y-1">
                      {getSessionsForDay(day).map(s => (
                        <div key={s.id} onClick={() => setSelectedSession(s)}
                          className={`${getOrgColor(s.organization_id)} text-white text-xs p-2 rounded-lg cursor-pointer hover:opacity-90`}>
                          <p className="font-semibold truncate">{s.title}</p>
                          <p className="opacity-80">{new Date(s.start_time).toLocaleTimeString('en', {hour:'2-digit', minute:'2-digit'})}</p>
                          <p className="opacity-80">{s.booked_count}/{s.capacity} booked</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day View */}
            {view === 'day' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">{currentDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                </div>
                <div className="p-4 space-y-3">
                  {getSessionsForDay(currentDate).length === 0 ? (
                    <p className="text-center text-gray-400 py-12">No sessions today</p>
                  ) : getSessionsForDay(currentDate).map(s => (
                    <div key={s.id} onClick={() => setSelectedSession(s)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 cursor-pointer">
                      <div className={`w-2 h-16 rounded-full ${getOrgColor(s.organization_id)}`}></div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-400">{s.organizations?.name}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(s.start_time).toLocaleTimeString('en', {hour:'2-digit', minute:'2-digit'})} — {new Date(s.end_time).toLocaleTimeString('en', {hour:'2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{s.booked_count}/{s.capacity}</p>
                        <p className="text-xs text-gray-400">booked</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'scheduled' ? 'bg-green-50 text-green-600' : s.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legend */}
            {orgs.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {orgs.map((org, i) => (
                  <div key={org.id} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${ORG_COLORS[i % ORG_COLORS.length]}`}></div>
                    <span className="text-xs text-gray-500">{org.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Session Detail */}
          {selectedSession && (
            <div className="w-80 bg-white rounded-2xl border border-gray-200 p-5 h-fit sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedSession.title}</h3>
                  <p className="text-xs text-purple-600 font-medium mt-0.5">{selectedSession.organizations?.name}</p>
                </div>
                <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>

              <div className="space-y-2 mb-4">
                {selectedSession.activities && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📋</span> {selectedSession.activities.name}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🕐</span> {new Date(selectedSession.start_time).toLocaleString()}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>👥</span> {selectedSession.booked_count} / {selectedSession.capacity} booked
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedSession.status === 'scheduled' ? 'bg-green-50 text-green-600' : selectedSession.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedSession.status}
                </span>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">BOOKINGS</p>
                  {selectedSession.booked_count < selectedSession.capacity && selectedSession.status === 'scheduled' && (
                    <button onClick={() => { setShowBookForm(true); loadCustomers(selectedSession.organization_id) }}
                      className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100">
                      + Add
                    </button>
                  )}
                </div>

                {showBookForm && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <select value={bookForm.customer_id} onChange={e => setBookForm({...bookForm, customer_id: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white mb-2 focus:outline-none">
                      <option value="">Select customer...</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleBook} disabled={saving || !bookForm.customer_id}
                        className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg font-semibold disabled:opacity-50">
                        {saving ? '...' : 'Book'}
                      </button>
                      <button onClick={() => setShowBookForm(false)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {(selectedSession.bookings || []).length === 0 ? (
                  <p className="text-xs text-gray-400">No bookings yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSession.bookings?.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{b.customers?.full_name}</p>
                          <span className={`text-xs ${b.status === 'confirmed' ? 'text-green-600' : b.status === 'attended' ? 'text-blue-600' : 'text-red-500'}`}>
                            {b.status}
                          </span>
                        </div>
                        <button onClick={() => handleCancelBooking(b.id)}
                          className="text-gray-300 hover:text-red-500 text-xs font-bold">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-4">
                <select value={selectedSession.status}
                  onChange={async e => {
                    await fetch(`/api/sessions/${selectedSession.id}`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status: e.target.value }) })
                    loadAll()
                    setSelectedSession({...selectedSession, status: e.target.value})
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={() => handleDeleteSession(selectedSession.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
