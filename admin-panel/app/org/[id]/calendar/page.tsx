'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const QATAR_OFFSET = 3 * 60

function toQatarTime(dateStr: string) {
  const d = new Date(dateStr)
  return new Date(d.getTime() + QATAR_OFFSET * 60 * 1000)
}

function toUTC(localDateStr: string) {
  const d = new Date(localDateStr)
  return new Date(d.getTime() - QATAR_OFFSET * 60 * 1000).toISOString()
}

export default function OrgCalendarPage() {
  const params = useParams()
  const id = params.id as string
  const [sessions, setSessions] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSession, setSelectedSession] = useState<any | null>(null)
  const [selectedTrainer, setSelectedTrainer] = useState<string>('')
  const [savingTrainer, setSavingTrainer] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showBookForm, setShowBookForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '', capacity: '1' })
  const [bookForm, setBookForm] = useState({ customer_id: '' })
  const [recurring, setRecurring] = useState({ is_recurring: false, recurrence_type: 'weekly', recurrence_days: [] as string[], recurrence_end_date: '' })

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [sessRes, membRes, custRes, actRes] = await Promise.all([
      fetch(`/api/calendar-sessions?org_id=${id}`),
      fetch(`/api/organizations/${id}/members`),
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/activities?org_id=${id}`)
    ])
    const [sessData, membData, custData, actData] = await Promise.all([sessRes.json(), membRes.json(), custRes.json(), actRes.json()])
    setSessions(Array.isArray(sessData) ? sessData : [])
    setMembers(Array.isArray(membData) ? membData : [])
    setCustomers(custData || [])
      setLoading(false)
  }

  async function handleCreateSession() {
    if (!form.title || !form.start_time || !form.end_time) { setMessage('Please fill all required fields'); return }
    setSaving(true)
    const res = await fetch('/api/calendar-sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id, capacity: parseInt(form.capacity), start_time: toUTC(form.start_time), end_time: toUTC(form.end_time), ...recurring })
    })
    const data = await res.json()
    if (res.ok) { setMessage('Session created!'); setShowForm(false); setForm({ activity_id: '', title: '', description: '', start_time: '', end_time: '', capacity: '1' }); loadAll() }
    else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleBook() {
    if (!bookForm.customer_id || !selectedSession) return
    setSaving(true)
    const res = await fetch('/api/calendar-bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: selectedSession.id, customer_id: bookForm.customer_id, organization_id: id })
    })
    if (res.ok) { setMessage('Booking confirmed!'); setShowBookForm(false); setBookForm({ customer_id: '' }); loadAll(); const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`); const s = await r.json(); setSelectedSession(s); setSelectedTrainer(s.trainer_id || '') }
    else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  async function handleBulkBook() {
    if (!selectedSession || selectedCustomers.length === 0) return
    setSaving(true)
    let success = 0
    for (const customerId of selectedCustomers) {
      const res = await fetch('/api/calendar-bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: selectedSession.id, customer_id: customerId, organization_id: id }) })
      if (res.ok) success++
    }
    setMessage(`${success} customers booked!`)
    setShowBulkForm(false)
    setSelectedCustomers([])
    loadAll()
    const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`)
    setSelectedSession(await r.json())
    setSaving(false)
  }

  async function handleCancelBooking(bookingId: string) {
    await fetch(`/api/calendar-bookings/${bookingId}`, { method: 'DELETE' })
    if (selectedSession) { const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`); const s = await r.json(); setSelectedSession(s); setSelectedTrainer(s.trainer_id || '') }
    loadAll()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/calendar-sessions/${id}`, { method: 'DELETE' })
    setSelectedSession(null)
    loadAll()
  }

  function copyLink(sessionId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/register/${sessionId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function getSessionsForDay(date: Date) {
    return sessions.filter(s => toQatarTime(s.start_time).toDateString() === date.toDateString())
  }

  function formatTime(dateStr: string) {
    return toQatarTime(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  function navigate(dir: number) {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  function getWeekDays(date: Date) {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }

  function getMonthDays(date: Date) {
    const year = date.getFullYear(), month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i))
    return days
  }

  const weekDays = getWeekDays(currentDate)
  const monthDays = getMonthDays(currentDate)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

  async function assignTrainer(sessionId: string, trainerId: string) {
    console.log('Assigning trainer:', trainerId, 'to session:', sessionId)
    const res = await fetch(`/api/calendar-sessions/${sessionId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainer_id: trainerId || null })
    })
    const resData = await res.json()
    console.log('PATCH response:', res.status, resData)
    if (resData && !resData.error) {
      const updated = resData
      setSelectedSession(updated)
      setSelectedTrainer(updated.trainer_id || '')
      loadAll()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/org/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold text-sm">Calendar</span>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">+ New Session</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {message && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Session</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" min="1" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">TITLE *</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Session title" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START TIME * (Qatar)</label>
                <input value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="datetime-local" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">END TIME * (Qatar)</label>
                <input value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="datetime-local" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input type="checkbox" checked={recurring.is_recurring} onChange={e => setRecurring({...recurring, is_recurring: e.target.checked})} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Recurring Session</span>
                </label>
                {recurring.is_recurring && (
                  <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select value={recurring.recurrence_type} onChange={e => setRecurring({...recurring, recurrence_type: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <input value={recurring.recurrence_end_date} onChange={e => setRecurring({...recurring, recurrence_end_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none" type="date" />
                    </div>
                    {recurring.recurrence_type === 'weekly' && (
                      <div className="flex gap-3 flex-wrap">
                        {['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map(day => (
                          <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={recurring.recurrence_days.includes(day)} onChange={e => setRecurring({...recurring, recurrence_days: e.target.checked ? [...recurring.recurrence_days, day] : recurring.recurrence_days.filter(d => d !== day)})} className="w-3.5 h-3.5 accent-blue-600" />
                            <span className="text-xs text-gray-600 capitalize">{day.slice(0,3)}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreateSession} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">{saving ? 'Saving...' : 'Create Session'}</button>
              <button onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">←</button>
                <h2 className="text-lg font-bold text-gray-900">
                  {view === 'month' ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : view === 'week' ? `Week of ${weekDays[0].toLocaleDateString()}` : currentDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <button onClick={() => navigate(1)} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">→</button>
                <button onClick={() => setCurrentDate(new Date())} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">Today</button>
              </div>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                {(['day', 'week', 'month'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 text-xs font-medium capitalize ${view === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{v}</button>
                ))}
              </div>
            </div>

            {view === 'month' && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7">{dayNames.map(d => <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 border-b border-gray-100">{d}</div>)}</div>
                <div className="grid grid-cols-7">
                  {monthDays.map((day, i) => (
                    <div key={i} className={`min-h-24 p-1.5 border-b border-r border-gray-50 ${day && day.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''}`}>
                      {day && (<>
                        <p className={`text-xs font-medium mb-1 ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-500'}`}>{day.getDate()}</p>
                        {getSessionsForDay(day).slice(0, 3).map(s => (
                          <div key={s.id} onClick={() => setSelectedSession(s)} className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-md cursor-pointer truncate hover:opacity-90 mb-0.5">
                            {formatTime(s.start_time)} {s.title}
                          </div>
                        ))}
                        {getSessionsForDay(day).length > 3 && <p className="text-xs text-gray-400">+{getSessionsForDay(day).length - 3} more</p>}
                      </>)}
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
                      <p className={`text-lg font-bold ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-900'}`}>{day.getDate()}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 min-h-96">
                  {weekDays.map((day, i) => (
                    <div key={i} className="border-r border-gray-50 last:border-r-0 p-1.5 space-y-1">
                      {getSessionsForDay(day).map(s => (
                        <div key={s.id} onClick={() => setSelectedSession(s)} className="bg-blue-500 text-white text-xs p-2 rounded-lg cursor-pointer hover:opacity-90">
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
              <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                {getSessionsForDay(currentDate).length === 0 ? <p className="text-center text-gray-400 py-12">No sessions today</p> :
                  getSessionsForDay(currentDate).map(s => (
                    <div key={s.id} onClick={() => setSelectedSession(s)} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 cursor-pointer">
                      <div className="w-2 h-16 rounded-full bg-blue-500"></div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{s.title}</p>
                        <p className="text-xs text-gray-400">{formatTime(s.start_time)} — {formatTime(s.end_time)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{s.booked_count}/{s.capacity}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{s.status}</span>
                      </div>
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
                  <p className="text-xs text-gray-400">{formatTime(selectedSession.start_time)} — {formatTime(selectedSession.end_time)}</p>
                </div>
                <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500">👥 {selectedSession.booked_count}/{selectedSession.capacity}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selectedSession.status === 'scheduled' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{selectedSession.status}</span>
              </div>
              <div className="mt-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">ASSIGNED TO</label>
                <select
                  value={selectedTrainer}
                  onChange={e => setSelectedTrainer(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:border-blue-400">
                  <option value="">No trainer</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.user_id || m.id}>{m.users?.full_name || m.users?.email || m.email}</option>
                  ))}
                </select>

              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                <button onClick={() => copyLink(selectedSession.id)} className="text-xs px-2 py-1.5 rounded-lg bg-purple-50 text-purple-600 font-semibold hover:bg-purple-100">
                  {copied ? '✅ Copied!' : '🔗 Copy Link'}
                </button>
                <button onClick={() => handleDelete(selectedSession.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">🗑️ Delete</button>
                <button
                  onClick={async () => { setSavingTrainer(true); await assignTrainer(selectedSession.id, selectedTrainer); setSavingTrainer(false) }}
                  disabled={savingTrainer}
                  className="text-xs px-2 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 disabled:opacity-50">
                  {savingTrainer ? 'Saving...' : '💾 Save'}
                </button>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500">BOOKINGS ({selectedSession.calendar_bookings?.length || 0})</p>
                  <div className="flex gap-1">
                    {selectedSession.booked_count < selectedSession.capacity && (
                      <>
                        <button onClick={() => { setShowBookForm(!showBookForm); setShowBulkForm(false) }} className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100">+ Add</button>
                        <button onClick={() => { setShowBulkForm(!showBulkForm); setShowBookForm(false) }} className="text-xs px-2 py-1 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100">+ Bulk</button>
                      </>
                    )}
                  </div>
                </div>

                {showBookForm && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <select value={bookForm.customer_id} onChange={e => setBookForm({customer_id: e.target.value})} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white mb-2 focus:outline-none">
                      <option value="">Select customer...</option>
                      {customers.filter(c => !selectedSession.calendar_bookings?.some((b: any) => b.customer_id === c.id)).map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={handleBook} disabled={saving || !bookForm.customer_id} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-lg font-semibold disabled:opacity-50">{saving ? '...' : 'Book'}</button>
                      <button onClick={() => setShowBookForm(false)} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600">Cancel</button>
                    </div>
                  </div>
                )}

                {showBulkForm && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                      {customers.filter(c => !selectedSession.calendar_bookings?.some((b: any) => b.customer_id === c.id)).map(c => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={selectedCustomers.includes(c.id)} onChange={e => setSelectedCustomers(e.target.checked ? [...selectedCustomers, c.id] : selectedCustomers.filter(i => i !== c.id))} className="w-3.5 h-3.5 accent-blue-600" />
                          <span className="text-xs text-gray-700">{c.full_name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleBulkBook} disabled={saving || selectedCustomers.length === 0} className="flex-1 bg-green-600 text-white text-xs py-1.5 rounded-lg font-semibold disabled:opacity-50">{saving ? '...' : `Book ${selectedCustomers.length}`}</button>
                      <button onClick={() => { setShowBulkForm(false); setSelectedCustomers([]) }} className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600">Cancel</button>
                    </div>
                  </div>
                )}

                {(selectedSession.calendar_bookings || []).length === 0 ? <p className="text-xs text-gray-400">No bookings yet</p> : (
                  <div className="space-y-1.5">
                    {selectedSession.calendar_bookings?.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2 py-1.5">
                        <div>
                          <p className="text-xs font-medium text-gray-900">{b.customers?.full_name}</p>
                          <span className={`text-xs ${b.status === 'confirmed' ? 'text-green-600' : 'text-red-500'}`}>{b.status}</span>
                        </div>
                        <button onClick={() => handleCancelBooking(b.id)} className="text-gray-300 hover:text-red-500 text-xs font-bold">✕</button>
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
