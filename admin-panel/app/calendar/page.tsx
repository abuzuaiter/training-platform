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
  is_recurring: boolean
  organizations: { name: string }
  calendar_bookings: any[]
}

const ORG_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500',
  'bg-red-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500'
]

const QATAR_OFFSET = 3 * 60 // Qatar is UTC+3

function toQatarTime(dateStr: string) {
  const d = new Date(dateStr)
  return new Date(d.getTime() + QATAR_OFFSET * 60 * 1000)
}

function toUTC(localDateStr: string) {
  const d = new Date(localDateStr)
  return new Date(d.getTime() - QATAR_OFFSET * 60 * 1000).toISOString()
}

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
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [form, setForm] = useState({
    organization_id: '', activity_id: '', title: '',
    description: '', start_time: '', end_time: '', capacity: '1'
  })
  const [editForm, setEditForm] = useState({
    title: '', description: '', start_time: '', end_time: '', capacity: '', status: ''
  })
  const [bookForm, setBookForm] = useState({ customer_id: '', notes: '' })
  const [recurring, setRecurring] = useState({
    is_recurring: false,
    recurrence_type: 'weekly',
    recurrence_days: [] as string[],
    recurrence_end_date: ''
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [sessRes, orgsRes] = await Promise.all([
      fetch('/api/calendar-sessions'), fetch('/api/organizations')
    ])
    const [sessData, orgsData] = await Promise.all([sessRes.json(), orgsRes.json()])
    setSessions(sessData || [])
    setOrgs(orgsData || [])
    setLoading(false)
  }

  async function loadActivities(orgId: string) {
    const res = await fetch(`/api/activities?org_id=${orgId}`)
    setActivities(await res.json() || [])
  }

  async function loadCustomers(orgId: string) {
    const res = await fetch(`/api/organizations/${orgId}/customers`)
    setCustomers(await res.json() || [])
  }

  async function handleCreateSession() {
    if (!form.organization_id || !form.title || !form.start_time || !form.end_time) {
      setMessage('Please fill all required fields'); return
    }
    setSaving(true)
    const res = await fetch('/api/calendar-sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        capacity: parseInt(form.capacity),
        start_time: toUTC(form.start_time),
        end_time: toUTC(form.end_time),
        ...recurring
      })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Session created!')
      setShowForm(false)
      setForm({ organization_id: '', activity_id: '', title: '', description: '', start_time: '', end_time: '', capacity: '1' })
      setRecurring({ is_recurring: false, recurrence_type: 'weekly', recurrence_days: [], recurrence_end_date: '' })
      loadAll()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleEditSession() {
    if (!selectedSession) return
    setSaving(true)
    const body: any = { ...editForm, capacity: parseInt(editForm.capacity) }
    if (editForm.start_time) body.start_time = toUTC(editForm.start_time)
    if (editForm.end_time) body.end_time = toUTC(editForm.end_time)
    const res = await fetch(`/api/calendar-sessions/${selectedSession.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      setMessage('Session updated!')
      setShowEditForm(false)
      loadAll()
      const updatedRes = await fetch(`/api/calendar-sessions/${selectedSession.id}`)
      setSelectedSession(await updatedRes.json())
    }
    setSaving(false)
  }

  async function handleBook() {
    if (!bookForm.customer_id || !selectedSession) return
    setSaving(true)
    const res = await fetch('/api/calendar-bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selectedSession.id, customer_id: bookForm.customer_id, organization_id: selectedSession.organization_id })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Booking confirmed!')
      setShowBookForm(false)
      setBookForm({ customer_id: '', notes: '' })
      loadAll()
      const updatedRes = await fetch(`/api/calendar-sessions/${selectedSession.id}`)
      setSelectedSession(await updatedRes.json())
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleBulkBook() {
    if (!selectedSession || selectedCustomers.length === 0) return
    setSaving(true)
    let success = 0
    for (const customerId of selectedCustomers) {
      const res = await fetch('/api/calendar-bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSession.id, customer_id: customerId, organization_id: selectedSession.organization_id })
      })
      if (res.ok) success++
    }
    setMessage(`${success} customers booked!`)
    setShowBulkForm(false)
    setSelectedCustomers([])
    loadAll()
    const updatedRes = await fetch(`/api/calendar-sessions/${selectedSession.id}`)
    setSelectedSession(await updatedRes.json())
    setSaving(false)
  }

  async function handleDeleteSession(id: string) {
    await fetch(`/api/calendar-sessions/${id}`, { method: 'DELETE' })
    setSelectedSession(null)
    loadAll()
  }

  async function handleCancelBooking(bookingId: string) {
    await fetch(`/api/calendar-bookings/${bookingId}`, { method: 'DELETE' })
    if (selectedSession) {
      const res = await fetch(`/api/calendar-sessions/${selectedSession.id}`)
      setSelectedSession(await res.json())
    }
    loadAll()
  }

  function copyRegistrationLink(sessionId: string) {
    const link = `${window.location.origin}/register/${sessionId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      const sDate = toQatarTime(s.start_time)
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

  function formatTime(dateStr: string) {
    return toQatarTime(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDateTime(dateStr: string) {
    return toQatarTime(dateStr).toLocaleString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME * (Qatar Time)</label>
                <input value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="datetime-local" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME * (Qatar Time)</label>
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
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input type="checkbox" checked={recurring.is_recurring} onChange={e => setRecurring({...recurring, is_recurring: e.target.checked})} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Recurring Session</span>
                </label>
                {recurring.is_recurring && (
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">REPEAT</label>
                        <select value={recurring.recurrence_type} onChange={e => setRecurring({...recurring, recurrence_type: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                          <option value="daily">Daily — يومي</option>
                          <option value="weekly">Weekly — أسبوعي</option>
                          <option value="monthly">Monthly — شهري</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE</label>
                        <input value={recurring.recurrence_end_date} onChange={e => setRecurring({...recurring, recurrence_end_date: e.target.value})}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" type="date" />
                      </div>
                    </div>
                    {recurring.recurrence_type === 'weekly' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-2">DAYS</label>
                        <div className="flex gap-3 flex-wrap">
                          {['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map(day => (
                            <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox"
                                checked={recurring.recurrence_days.includes(day)}
                                onChange={e => setRecurring({...recurring, recurrence_days: e.target.checked ? [...recurring.recurrence_days, day] : recurring.recurrence_days.filter(d => d !== day)})}
                                className="w-3.5 h-3.5 accent-blue-600" />
                              <span className="text-xs text-gray-600 capitalize">{day.slice(0,3)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
                                {formatTime(s.start_time)} {s.title}
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
                          <p className="opacity-80">{formatTime(s.start_time)}</p>
                          <p className="opacity-80">{s.booked_count}/{s.capacity}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                        <p className="text-xs text-gray-400">{formatTime(s.start_time)} — {formatTime(s.end_time)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{s.booked_count}/{s.capacity}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.status === 'scheduled' ? 'bg-green-50 text-green-600' : s.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

          {selectedSession && (
            <div className="w-80 bg-white rounded-2xl border border-gray-200 p-5 h-fit sticky top-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{selectedSession.title}</h3>
                  <p className="text-xs text-purple-600 font-medium">{selectedSession.organizations?.name}</p>
                </div>
                <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="space-y-1.5 mb-4 text-xs text-gray-500">
                <p>🕐 {formatDateTime(selectedSession.start_time)} — {formatTime(selectedSession.end_time)}</p>
                <p>👥 {selectedSession.booked_count} / {selectedSession.capacity} booked</p>
                {selectedSession.is_recurring && <p>🔄 Recurring</p>}
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${selectedSession.status === 'scheduled' ? 'bg-green-50 text-green-600' : selectedSession.status === 'cancelled' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                  {selectedSession.status}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <button onClick={() => {
                  setEditForm({
                    title: selectedSession.title,
                    description: selectedSession.description || '',
                    start_time: '',
                    end_time: '',
                    capacity: String(selectedSession.capacity),
                    status: selectedSession.status
                  })
                  setShowEditForm(true)
                }}
                  className="text-xs px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100">
                  ✏️ Edit
                </button>
                <button onClick={() => copyRegistrationLink(selectedSession.id)}
                  className="text-xs px-2 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-semibold hover:bg-purple-100">
                  {copied ? '✅ Copied!' : '🔗 Copy Link'}
                </button>
                <button onClick={() => handleDeleteSession(selectedSession.id)}
                  className="text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                  🗑️ Delete
                </button>
              </div>

              {/* Edit Form */}
              {showEditForm && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-2">
                  <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" placeholder="Title" />
                  <input value={editForm.capacity} onChange={e => setEditForm({...editForm, capacity: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none" placeholder="Capacity" type="number" />
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none">
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={handleEditSession} disabled={saving}
                      className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg font-semibold disabled:opacity-50">
                      {saving ? '...' : 'Save'}
                    </button>
                    <button onClick={() => setShowEditForm(false)}
                      className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Bookings */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">BOOKINGS ({selectedSession.calendar_bookings?.length || 0})</p>
                  <div className="flex gap-1">
                    {selectedSession.booked_count < selectedSession.capacity && selectedSession.status === 'scheduled' && (
                      <>
                        <button onClick={() => { setShowBookForm(!showBookForm); setShowBulkForm(false); loadCustomers(selectedSession.organization_id) }}
                          className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100">
                          + Add
                        </button>
                        <button onClick={() => { setShowBulkForm(!showBulkForm); setShowBookForm(false); loadCustomers(selectedSession.organization_id) }}
                          className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100">
                          + Bulk
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {showBookForm && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <select value={bookForm.customer_id} onChange={e => setBookForm({...bookForm, customer_id: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white mb-2 focus:outline-none">
                      <option value="">Select customer...</option>
                      {customers.filter(c => !selectedSession.calendar_bookings?.some((b: any) => b.customer_id === c.id)).map(c => (
                        <option key={c.id} value={c.id}>{c.full_name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleBook} disabled={saving || !bookForm.customer_id}
                        className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg font-semibold disabled:opacity-50">
                        {saving ? '...' : 'Book'}
                      </button>
                      <button onClick={() => setShowBookForm(false)}
                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600">Cancel</button>
                    </div>
                  </div>
                )}

                {showBulkForm && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">SELECT CUSTOMERS</p>
                    <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                      {customers.filter(c => !selectedSession.calendar_bookings?.some((b: any) => b.customer_id === c.id)).map(c => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox"
                            checked={selectedCustomers.includes(c.id)}
                            onChange={e => setSelectedCustomers(e.target.checked ? [...selectedCustomers, c.id] : selectedCustomers.filter(id => id !== c.id))}
                            className="w-3.5 h-3.5 accent-blue-600" />
                          <span className="text-xs text-gray-700">{c.full_name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleBulkBook} disabled={saving || selectedCustomers.length === 0}
                        className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg font-semibold disabled:opacity-50">
                        {saving ? '...' : `Book ${selectedCustomers.length} customers`}
                      </button>
                      <button onClick={() => { setShowBulkForm(false); setSelectedCustomers([]) }}
                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600">Cancel</button>
                    </div>
                  </div>
                )}

                {(selectedSession.calendar_bookings || []).length === 0 ? (
                  <p className="text-xs text-gray-400">No bookings yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSession.calendar_bookings?.map((b: any) => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
