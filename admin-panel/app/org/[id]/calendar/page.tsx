'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Plus, Users, Clock, Trash2,
  Copy, Check, X, User, BookOpen, Calendar, RefreshCw, Link2,
  Filter, ChevronDown
} from 'lucide-react'

// ── CSS variable aliases (matches globals.css) ──────────────────────
// --ink        primary text
// --text-sec   secondary text
// --text-ter   tertiary / muted text
// --surface    card background
// --bg         page background
// --primary    brand blue
// --primary-dim light brand blue
// --border     border color
// --green / --green-dim  success
// --danger / --danger-dim  error
// --warn / --warn-dim  warning

const QATAR_OFFSET = 3 * 60
const QATAR_HOURS  = QATAR_OFFSET / 60   // 3
const HOUR_HEIGHT  = 68    // px per hour in time-grid
const GRID_START   = 6     // 6 AM
const GRID_END     = 23    // 11 PM
const DAY_KEYS     = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

function toQatarTime(dateStr: string) {
  return new Date(new Date(dateStr).getTime() + QATAR_OFFSET * 60 * 1000)
}
function toUTC(localDateStr: string) {
  const d = new Date(localDateStr)
  return new Date(d.getTime() - QATAR_OFFSET * 60 * 1000).toISOString()
}
// Display uses toQatarTime() + local toLocaleTimeString — matches how the rest
// of the app (dashboard, enrollments) formats session times.
function formatTime(dateStr: string) {
  return toQatarTime(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(dateStr: string) {
  return toQatarTime(dateStr).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
}
// Build a UTC ISO string from a calendar-day Date + "HH:MM:SS" time (Qatar local).
// Mirrors toUTC(): treat the time as browser-local, then subtract QATAR_OFFSET —
// exactly how the session-creation form stores times.
function buildDatetime(calDay: Date, qatarTimeStr: string): string {
  const parts = (qatarTimeStr || '00:00:00').split(':').map(Number)
  const h = parts[0] || 0, m = parts[1] || 0, s = parts[2] || 0
  const localMs = new Date(calDay.getFullYear(), calDay.getMonth(), calDay.getDate(), h, m, s).getTime()
  return new Date(localMs - QATAR_OFFSET * 60 * 1000).toISOString()
}
function sessionGridStyle(session: any) {
  const start = toQatarTime(session.start_time)
  const end   = toQatarTime(session.end_time)
  const startMins    = (start.getHours() - GRID_START) * 60 + start.getMinutes()
  const durationMins = Math.max((end.getTime() - start.getTime()) / 60000, 30)
  return {
    top:    `${(startMins / 60) * HOUR_HEIGHT}px`,
    height: `${(durationMins / 60) * HOUR_HEIGHT - 2}px`,
  }
}
type Palette = { dot: string; bg: string; text: string; border: string }
function sessionPalette(session: any): Palette {
  const ratio = session.capacity > 0 ? session.booked_count / session.capacity : 0
  if (ratio >= 1)    return { dot:'#dc2626', bg:'#fef2f2', text:'#dc2626', border:'#fecaca' }
  if (ratio >= 0.75) return { dot:'#d97706', bg:'#fffbeb', text:'#d97706', border:'#fde68a' }
  return               { dot:'var(--primary)', bg:'var(--primary-dim)', text:'var(--primary)', border:'#bdd8eb' }
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS       = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i)

export default function OrgCalendarPage() {
  const params = useParams()
  const id     = params.id as string

  const [sessions,         setSessions]          = useState<any[]>([])
  const [templates,        setTemplates]         = useState<any[]>([])
  const [members,          setMembers]           = useState<any[]>([])
  const [customers,        setCustomers]         = useState<any[]>([])
  const [loading,          setLoading]           = useState(true)
  const [view,             setView]              = useState<'month' | 'week' | 'day'>('week')
  const [currentDate,      setCurrentDate]       = useState(new Date())
  const [selectedSession,  setSelectedSession]   = useState<any | null>(null)
  const [selectedTrainer,  setSelectedTrainer]   = useState<string>('')
  const [savingTrainer,    setSavingTrainer]      = useState(false)
  const [showForm,         setShowForm]          = useState(false)
  const [showBookForm,     setShowBookForm]      = useState(false)
  const [showBulkForm,     setShowBulkForm]      = useState(false)
  const [message,          setMessage]           = useState('')
  const [saving,           setSaving]            = useState(false)
  const [copied,           setCopied]            = useState(false)
  const [selectedCustomers,setSelectedCustomers] = useState<string[]>([])
  const [form,             setForm]              = useState({ title: '', description: '', start_time: '', end_time: '', capacity: '1' })
  const [bookForm,         setBookForm]          = useState({ customer_id: '' })
  const [recurring,        setRecurring]         = useState({ is_recurring: false, recurrence_type: 'weekly', recurrence_days: [] as string[], recurrence_end_date: '' })
  const [filterTrainer,    setFilterTrainer]     = useState<string>('')
  const [filterCustomer,   setFilterCustomer]    = useState<string>('')
  const [filterSession,    setFilterSession]     = useState<string>('')
  const [currentUser,      setCurrentUser]       = useState<any>(null)
  const [currentMember,    setCurrentMember]     = useState<any>(null)
  const [merging,          setMerging]           = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (id) loadAll() }, [id])
  useEffect(() => { setSelectedTrainer(selectedSession?.trainer_id || '') }, [selectedSession])
  useEffect(() => {
    if (view === 'week' && gridRef.current) {
      const qHour = toQatarTime(new Date().toISOString()).getHours()
      const scrollHour = Math.max(GRID_START, qHour - 2)
      setTimeout(() => { if (gridRef.current) gridRef.current.scrollTop = (scrollHour - GRID_START) * HOUR_HEIGHT }, 60)
    }
  }, [view])

  async function loadAll() {
    setLoading(true)
    const [sessRes, membRes, custRes, meRes, templRes] = await Promise.all([
      fetch(`/api/calendar-sessions?org_id=${id}`),
      fetch(`/api/organizations/${id}/members`),
      fetch(`/api/organizations/${id}/customers`),
      fetch('/api/auth/me'),
      fetch(`/api/session-templates?org_id=${id}`),
    ])
    const [sessData, membData, custData, meData, templData] = await Promise.all([
      sessRes.json(), membRes.json(), custRes.json(), meRes.ok ? meRes.json() : null, templRes.json()
    ])
    const sess = Array.isArray(sessData) ? sessData : []
    const memb = Array.isArray(membData) ? membData : []
    const tmpl = Array.isArray(templData) ? templData.filter((t: any) => t.is_active !== false) : []
    setSessions(sess)
    setTemplates(tmpl)
    setMembers(memb)
    setCustomers(custData || [])

    if (meData) {
      setCurrentUser(meData)
      // Find this user's member record in the org
      const myMember = memb.find((m: any) => (m.user_id || m.id) === meData.id)
      setCurrentMember(myMember || null)
      // Non-admins default to "My Sessions" if they have sessions assigned
      const isAdmin = meData.role === 'super_admin' || meData.role === 'org_admin'
      if (!isAdmin && myMember) {
        const myUserId = myMember.user_id || myMember.id
        const hasSessions = sess.some((s: any) => s.trainer_id === myUserId)
        if (hasSessions) setFilterTrainer(myUserId)
      }
    }
    setLoading(false)
  }

  async function mergeDuplicates() {
    setMerging(true)
    const res = await fetch('/api/calendar-sessions/merge-duplicates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: id })
    })
    const data = await res.json()
    setMessage(data.message || 'Done')
    setTimeout(() => setMessage(''), 5000)
    loadAll()
    setMerging(false)
  }

  async function handleCreateSession() {
    if (!form.title || !form.start_time || !form.end_time) { setMessage('Please fill all required fields'); return }
    setSaving(true)
    const res = await fetch('/api/calendar-sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id, capacity: parseInt(form.capacity), start_time: toUTC(form.start_time), end_time: toUTC(form.end_time), ...recurring })
    })
    const data = await res.json()
    if (res.ok) { setMessage('Session created!'); setShowForm(false); setForm({ title: '', description: '', start_time: '', end_time: '', capacity: '1' }); loadAll() }
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
    if (res.ok) {
      setMessage('Booking confirmed!'); setShowBookForm(false); setBookForm({ customer_id: '' }); loadAll()
      const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`)
      const s = await r.json(); setSelectedSession(s); setSelectedTrainer(s.trainer_id || '')
    } else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  async function handleBulkBook() {
    if (!selectedSession || selectedCustomers.length === 0) return
    setSaving(true)
    let success = 0
    for (const cId of selectedCustomers) {
      const res = await fetch('/api/calendar-bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: selectedSession.id, customer_id: cId, organization_id: id }) })
      if (res.ok) success++
    }
    setMessage(`${success} customers booked!`); setShowBulkForm(false); setSelectedCustomers([]); loadAll()
    const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`); setSelectedSession(await r.json())
    setSaving(false)
  }

  async function handleCancelBooking(bookingId: string) {
    await fetch(`/api/calendar-bookings/${bookingId}`, { method: 'DELETE' })
    if (selectedSession) { const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`); const s = await r.json(); setSelectedSession(s); setSelectedTrainer(s.trainer_id || '') }
    loadAll()
  }

  async function handleDelete(sessId: string) {
    await fetch(`/api/calendar-sessions/${sessId}`, { method: 'DELETE' })
    setSelectedSession(null); loadAll()
  }

  function copyLink(sessionId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/register/${sessionId}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // ── Filtered session list (trainer + customer + session name filters) ──
  const filteredSessions = sessions.filter(s => {
    if (filterTrainer  && s.trainer_id !== filterTrainer) return false
    if (filterCustomer && !s.calendar_bookings?.some((b: any) => b.customer_id === filterCustomer)) return false
    if (filterSession  && s.title !== filterSession) return false
    return true
  })

  // Unique session names for the name dropdown (real + template)
  const sessionNames = [...new Set([
    ...sessions.map(s => s.title),
    ...templates.map((t: any) => t.title),
  ].filter(Boolean))].sort()

  // Members who have at least one session assigned (real or template)
  const trainersWithSessions = members.filter((m: any) =>
    sessions.some(s => s.trainer_id === (m.user_id || m.id)) ||
    templates.some((t: any) => t.trainer_id === (m.user_id || m.id))
  )
  // Customers who have at least one booking (for customer dropdown)
  const customersWithBookings = customers.filter(c =>
    sessions.some(s => s.calendar_bookings?.some((b: any) => b.customer_id === c.id))
  )
  const activeFilters = (filterTrainer ? 1 : 0) + (filterCustomer ? 1 : 0) + (filterSession ? 1 : 0)

  function getSessionsForDay(date: Date) {
    const dayKey = DAY_KEYS[date.getDay()]

    // Real calendar_sessions for this day
    const real = filteredSessions
      .filter(s => toQatarTime(s.start_time).toDateString() === date.toDateString())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    // Virtual sessions from session_templates — fill in days not covered by a real session
    const realTitles = new Set(real.map((s: any) => s.title))
    const virtual = templates
      .filter((t: any) => {
        if (t.is_active === false) return false
        if (filterTrainer && t.trainer_id !== filterTrainer) return false
        if (filterSession && t.title !== filterSession) return false
        // Respect recurrence end date
        if (t.recurrence_end_date && date > new Date(t.recurrence_end_date)) return false
        const type = (t.recurrence_type || '').toLowerCase()
        const days: string[] = Array.isArray(t.recurrence_days)
          ? t.recurrence_days.map((d: any) => String(d).toLowerCase())
          : []
        if (type === 'daily') return true
        if (type === 'weekly' || days.length > 0) return days.includes(dayKey)
        return false
      })
      .filter((t: any) => !realTitles.has(t.title))
      .map((t: any) => ({
        id: `virtual-${t.id}-${date.toISOString().split('T')[0]}`,
        title: t.title,
        start_time: buildDatetime(date, t.start_time),
        end_time:   buildDatetime(date, t.end_time),
        capacity: t.capacity || 0,
        booked_count: 0,
        calendar_bookings: [],
        trainer_id: t.trainer_id || null,
        status: 'scheduled',
        isVirtual: true,
        template_id: t.id,
      }))

    return [...real, ...virtual]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }

  function navigate(dir: number) {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else d.setMonth(d.getMonth() + dir)
    setCurrentDate(d)
  }

  function getWeekDays(date: Date) {
    const start = new Date(date); start.setDate(date.getDate() - date.getDay())
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

  async function assignTrainer(sessionId: string, trainerId: string) {
    const res = await fetch(`/api/calendar-sessions/${sessionId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainer_id: trainerId || null })
    })
    const updated = await res.json()
    if (!res.ok || updated?.error) {
      setMessage('Failed to save organizer: ' + (updated?.error || res.status)); return
    }
    setSelectedSession(updated); setSelectedTrainer(updated.trainer_id || ''); loadAll()
  }

  const weekDays  = getWeekDays(currentDate)
  const monthDays = getMonthDays(currentDate)
  const today     = new Date()
  const _nowQ   = toQatarTime(new Date().toISOString())
  const nowMins = (_nowQ.getHours() - GRID_START) * 60 + _nowQ.getMinutes()

  function titleForNav() {
    if (view === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    if (view === 'week')  return `${weekDays[0].toLocaleDateString('en',{month:'short',day:'numeric'})} – ${weekDays[6].toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}`
    return currentDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px',
    fontSize:13, background:'var(--bg)', color:'var(--ink)', outline:'none', boxSizing:'border-box'
  }
  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:600, color:'var(--text-ter)',
    marginBottom:4, letterSpacing:'0.06em'
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
          <Link href={`/org/${id}`} style={{ color:'var(--text-ter)', textDecoration:'none' }}>Dashboard</Link>
          <span style={{ color:'var(--border)' }}>/</span>
          <span style={{ color:'var(--ink)', fontWeight:600 }}>Calendar</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={mergeDuplicates} disabled={merging}
            style={{ background:'var(--bg)', color:'var(--text-sec)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 14px', fontSize:13, fontWeight:600, cursor: merging ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', gap:6, opacity: merging ? 0.7 : 1 }}
            title="Merge sessions with same title and time into one">
            <RefreshCw size={14} style={{ animation: merging ? 'spin 1s linear infinite' : 'none' }} />
            {merging ? 'Merging…' : 'Merge Duplicates'}
          </button>
          <button onClick={() => { setShowForm(!showForm); setSelectedSession(null) }}
            style={{ background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            <Plus size={15} /> New Session
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px' }}>
        {/* ── Toast ─────────────────────────────────────────────────── */}
        {message && (
          <div style={{ marginBottom:16, padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'space-between',
            background: message.includes('!') ? 'var(--green-dim)'  : 'var(--danger-dim)',
            color:      message.includes('!') ? 'var(--green)'      : 'var(--danger)' }}>
            {message}
            <button onClick={() => setMessage('')} style={{ background:'none', border:'none', cursor:'pointer', opacity:0.5, fontSize:14, color:'inherit' }}>✕</button>
          </div>
        )}

        {/* ── New Session Form ───────────────────────────────────────── */}
        {showForm && (
          <div style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', padding:24, marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink)', display:'flex', alignItems:'center', gap:8, margin:0 }}>
                <Calendar size={18} style={{ color:'var(--primary)' }} /> New Session
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ter)' }}><X size={18} /></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={labelStyle}>TITLE *</label>
                <input value={form.title} onChange={e => setForm({...form,title:e.target.value})} style={inputStyle} placeholder="Session title" />
              </div>
              <div>
                <label style={labelStyle}>START TIME * (Qatar)</label>
                <input value={form.start_time} onChange={e => setForm({...form,start_time:e.target.value})} type="datetime-local" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>END TIME * (Qatar)</label>
                <input value={form.end_time} onChange={e => setForm({...form,end_time:e.target.value})} type="datetime-local" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CAPACITY</label>
                <input value={form.capacity} onChange={e => setForm({...form,capacity:e.target.value})} type="number" min="1" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>DESCRIPTION</label>
                <input value={form.description} onChange={e => setForm({...form,description:e.target.value})} style={inputStyle} placeholder="Optional" />
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:500, color:'var(--ink)', marginBottom: recurring.is_recurring ? 10 : 0 }}>
                  <input type="checkbox" checked={recurring.is_recurring} onChange={e => setRecurring({...recurring,is_recurring:e.target.checked})} style={{ width:15, height:15, accentColor:'var(--primary)' }} />
                  Recurring Session
                </label>
                {recurring.is_recurring && (
                  <div style={{ background:'var(--primary-dim)', borderRadius:12, padding:16 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                      <select value={recurring.recurrence_type} onChange={e => setRecurring({...recurring,recurrence_type:e.target.value})}
                        style={{ border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', fontSize:13, background:'var(--surface)', color:'var(--ink)', outline:'none' }}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <div>
                        <label style={{...labelStyle, marginBottom:4}}>END DATE</label>
                        <input value={recurring.recurrence_end_date} onChange={e => setRecurring({...recurring,recurrence_end_date:e.target.value})} type="date"
                          style={{ width:'100%', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', fontSize:13, background:'var(--surface)', color:'var(--ink)', outline:'none', boxSizing:'border-box' }} />
                      </div>
                    </div>
                    {recurring.recurrence_type === 'weekly' && (
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map(day => (
                          <label key={day} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:12, color:'var(--ink)', textTransform:'capitalize' }}>
                            <input type="checkbox" checked={recurring.recurrence_days.includes(day)}
                              onChange={e => setRecurring({...recurring,recurrence_days: e.target.checked ? [...recurring.recurrence_days,day] : recurring.recurrence_days.filter(d=>d!==day)})}
                              style={{ width:13, height:13, accentColor:'var(--primary)' }} />
                            {day.slice(0,3)}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={handleCreateSession} disabled={saving}
                style={{ background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving ? 0.6 : 1 }}>
                {saving ? 'Creating…' : 'Create Session'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ background:'none', color:'var(--text-sec)', border:'1px solid var(--border)', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
          {/* ── Calendar ──────────────────────────────────────────────── */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* Controls */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => navigate(-1)}
                  style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', color:'var(--text-sec)' }}>
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize:16, fontWeight:700, color:'var(--ink)', minWidth:220, textAlign:'center' }}>{titleForNav()}</span>
                <button onClick={() => navigate(1)}
                  style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', color:'var(--text-sec)' }}>
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => setCurrentDate(new Date())}
                  style={{ fontSize:12, padding:'5px 12px', borderRadius:8, background:'var(--surface)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-sec)', fontWeight:500 }}>
                  Today
                </button>
                {loading && <RefreshCw size={14} style={{ color:'var(--text-ter)', animation:'spin 1s linear infinite' }} />}
              </div>
              <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', background:'var(--surface)' }}>
                {(['day','week','month'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    style={{ padding:'6px 14px', fontSize:12, fontWeight:600, border:'none', cursor:'pointer', textTransform:'capitalize',
                      background: view===v ? 'var(--primary)' : 'transparent',
                      color:      view===v ? '#fff'           : 'var(--text-sec)' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* ── My / All toggle + Filter Bar ───────────────────────── */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>

              {/* My Sessions / All toggle — shown when the logged-in user is a member */}
              {currentMember && (() => {
                const myId    = currentMember.user_id || currentMember.id
                const myName  = currentMember.users?.full_name || currentMember.users?.email || 'Me'
                const isMine  = filterTrainer === myId
                return (
                  <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', background:'var(--surface)', flexShrink:0 }}>
                    <button
                      onClick={() => setFilterTrainer(myId)}
                      style={{ padding:'5px 14px', fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
                        background: isMine ? 'var(--primary)' : 'transparent',
                        color:      isMine ? '#fff'           : 'var(--text-sec)' }}>
                      My Sessions
                    </button>
                    <button
                      onClick={() => setFilterTrainer('')}
                      style={{ padding:'5px 14px', fontSize:12, fontWeight:700, border:'none', cursor:'pointer',
                        background: !isMine ? 'var(--primary)' : 'transparent',
                        color:      !isMine ? '#fff'           : 'var(--text-sec)' }}>
                      All
                    </button>
                  </div>
                )
              })()}

              {/* Divider */}
              {currentMember && <div style={{ width:1, height:20, background:'var(--border)', flexShrink:0 }} />}

              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
                color: activeFilters > 0 ? 'var(--primary)' : 'var(--text-ter)' }}>
                <Filter size={13} />
                {activeFilters > 0
                  ? <span>{activeFilters} filter{activeFilters > 1 ? 's' : ''} active</span>
                  : <span>Filter by</span>}
              </div>

              {/* Trainer filter */}
              <div style={{ position:'relative' }}>
                <select
                  value={filterTrainer}
                  onChange={e => setFilterTrainer(e.target.value)}
                  style={{
                    appearance:'none', WebkitAppearance:'none',
                    border: filterTrainer ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius:8, padding:'5px 28px 5px 10px', fontSize:12, fontWeight:600,
                    background: filterTrainer ? 'var(--primary-dim)' : 'var(--surface)',
                    color: filterTrainer ? 'var(--primary)' : 'var(--text-sec)',
                    cursor:'pointer', outline:'none', minWidth:140
                  }}>
                  <option value="">All Organizers</option>
                  {trainersWithSessions.map((m: any) => (
                    <option key={m.id} value={m.user_id || m.id}>
                      {m.users?.full_name || m.users?.email || m.email}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none',
                  color: filterTrainer ? 'var(--primary)' : 'var(--text-ter)' }} />
              </div>

              {/* Customer / SPOC filter */}
              <div style={{ position:'relative' }}>
                <select
                  value={filterCustomer}
                  onChange={e => setFilterCustomer(e.target.value)}
                  style={{
                    appearance:'none', WebkitAppearance:'none',
                    border: filterCustomer ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius:8, padding:'5px 28px 5px 10px', fontSize:12, fontWeight:600,
                    background: filterCustomer ? 'var(--primary-dim)' : 'var(--surface)',
                    color: filterCustomer ? 'var(--primary)' : 'var(--text-sec)',
                    cursor:'pointer', outline:'none', minWidth:160
                  }}>
                  <option value="">All Customers</option>
                  {customersWithBookings.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
                <ChevronDown size={12} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none',
                  color: filterCustomer ? 'var(--primary)' : 'var(--text-ter)' }} />
              </div>

              {/* Session name filter */}
              <div style={{ position:'relative' }}>
                <select
                  value={filterSession}
                  onChange={e => setFilterSession(e.target.value)}
                  style={{
                    appearance:'none', WebkitAppearance:'none',
                    border: filterSession ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius:8, padding:'5px 28px 5px 10px', fontSize:12, fontWeight:600,
                    background: filterSession ? 'var(--primary-dim)' : 'var(--surface)',
                    color: filterSession ? 'var(--primary)' : 'var(--text-sec)',
                    cursor:'pointer', outline:'none', minWidth:160
                  }}>
                  <option value="">All Sessions</option>
                  {sessionNames.map((name: string) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <ChevronDown size={12} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none',
                  color: filterSession ? 'var(--primary)' : 'var(--text-ter)' }} />
              </div>

              {/* Clear all filters */}
              {activeFilters > 0 && (
                <button onClick={() => { setFilterTrainer(''); setFilterCustomer(''); setFilterSession('') }}
                  style={{ fontSize:12, fontWeight:600, padding:'5px 10px', borderRadius:8, cursor:'pointer', border:'none',
                    background:'var(--danger-dim)', color:'var(--danger)', display:'flex', alignItems:'center', gap:4 }}>
                  <X size={11} /> Clear
                </button>
              )}
            </div>

            {/* ─── MONTH ───────────────────────────────────────────── */}
            {view === 'month' && (
              <div style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:'1px solid var(--border)' }}>
                  {DAY_NAMES.map(d => (
                    <div key={d} style={{ padding:'10px 0', textAlign:'center', fontSize:11, fontWeight:700, color:'var(--text-ter)', letterSpacing:'0.05em' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
                  {monthDays.map((day, i) => {
                    const ds      = day ? getSessionsForDay(day) : []
                    const isToday = day?.toDateString() === today.toDateString()
                    return (
                      <div key={i} style={{ minHeight:110, padding:6,
                        borderBottom:'1px solid var(--divider)', borderRight:(i+1)%7===0 ? 'none' : '1px solid var(--divider)',
                        background: isToday ? 'var(--primary-dim)' : 'transparent' }}>
                        {day && (
                          <>
                            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                              width:22, height:22, borderRadius:'50%', fontSize:12, fontWeight:600, marginBottom:4,
                              background: isToday ? 'var(--primary)' : 'transparent',
                              color:      isToday ? '#fff'           : 'var(--text-ter)' }}>
                              {day.getDate()}
                            </span>
                            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                              {ds.slice(0,3).map(s => {
                                const p = sessionPalette(s)
                                return (
                                  <div key={s.id} onClick={() => setSelectedSession(s)}
                                    style={{ borderRadius:6, padding:'3px 7px', cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                                      background:p.bg, border:`1px solid ${p.border}` }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background:p.dot }} />
                                    <span style={{ fontSize:11, fontWeight:600, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', color:p.text, flex:1 }}>
                                      {formatTime(s.start_time)} {s.title}
                                    </span>
                                    {s.booked_count > 0 && (
                                      <span style={{ fontSize:10, fontWeight:700, color:p.dot, flexShrink:0, background:'rgba(255,255,255,0.6)', borderRadius:4, padding:'0 4px' }}>
                                        {s.booked_count}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                              {ds.length > 3 && <span style={{ fontSize:10, color:'var(--text-ter)', paddingLeft:4 }}>+{ds.length-3} more</span>}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ─── WEEK (time-grid) ─────────────────────────────────── */}
            {view === 'week' && (
              <div style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                {/* Day headers */}
                <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
                  <div />
                  {weekDays.map((day, i) => {
                    const isToday = day.toDateString() === today.toDateString()
                    const ds      = getSessionsForDay(day)
                    return (
                      <div key={i} style={{ padding:'10px 4px', textAlign:'center', borderLeft:'1px solid var(--border)',
                        background: isToday ? 'var(--primary-dim)' : 'transparent' }}>
                        <p style={{ fontSize:11, fontWeight:700, color:'var(--text-ter)', letterSpacing:'0.04em', margin:0 }}>{DAY_NAMES[i]}</p>
                        <p style={{ fontSize:22, fontWeight:800, lineHeight:1.2, margin:'2px 0',
                          color: isToday ? 'var(--primary)' : 'var(--ink)' }}>{day.getDate()}</p>
                        {ds.length > 0 && (
                          <span style={{ fontSize:10, background:'var(--primary)', color:'#fff', borderRadius:8, padding:'1px 7px', fontWeight:700 }}>{ds.length}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* Scrollable grid */}
                <div ref={gridRef} style={{ overflowY:'auto', maxHeight:580 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', position:'relative' }}>
                    {/* Hour labels */}
                    <div>
                      {HOURS.map(h => (
                        <div key={h} style={{ height:HOUR_HEIGHT, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:8, paddingTop:4 }}>
                          <span style={{ fontSize:10, color:'var(--text-ter)', fontWeight:500 }}>
                            {h > 12 ? `${h-12}pm` : h===12 ? '12pm' : `${h}am`}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Day columns */}
                    {weekDays.map((day, i) => {
                      const ds      = getSessionsForDay(day)
                      const isToday = day.toDateString() === today.toDateString()
                      return (
                        <div key={i} style={{ borderLeft:'1px solid var(--border)', position:'relative' }}>
                          {HOURS.map(h => (
                            <div key={h} style={{ height:HOUR_HEIGHT, borderBottom:`1px solid ${h % 2 === 0 ? 'var(--divider)' : 'transparent'}`, boxSizing:'border-box' }} />
                          ))}
                          {/* Now-line */}
                          {isToday && nowMins >= 0 && nowMins < (GRID_END-GRID_START)*60 && (
                            <div style={{ position:'absolute', left:0, right:0, top:`${(nowMins/60)*HOUR_HEIGHT}px`, zIndex:10, display:'flex', alignItems:'center', pointerEvents:'none' }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', marginLeft:-4, flexShrink:0 }} />
                              <div style={{ flex:1, height:1.5, background:'#ef4444' }} />
                            </div>
                          )}
                          {/* Session blocks */}
                          {ds.map(s => {
                            const p        = sessionPalette(s)
                            const gs       = sessionGridStyle(s)
                            const h        = parseFloat(gs.height)
                            const trainer  = members.find((m:any) => (m.user_id||m.id) === s.trainer_id)
                            const tName    = trainer?.users?.full_name || trainer?.users?.email || null
                            const isSel    = selectedSession?.id === s.id
                            return (
                              <div key={s.id} onClick={() => setSelectedSession(s)}
                                style={{ position:'absolute', left:2, right:2, ...gs, zIndex:5, borderRadius:8, padding:'5px 7px', cursor:'pointer', overflow:'hidden',
                                  background: p.bg, border:`1.5px solid ${isSel ? 'var(--primary)' : p.border}`,
                                  boxShadow: isSel ? '0 0 0 2px var(--primary-dim)' : '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <p style={{ fontSize:11, fontWeight:700, margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', color:p.text }}>{s.title}</p>
                                {h > 36 && <p style={{ fontSize:10, margin:'2px 0 0', color:p.text, opacity:0.75 }}>{formatTime(s.start_time)}–{formatTime(s.end_time)}</p>}
                                {h > 52 && (
                                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                                    <Users size={9} style={{ color:p.text, opacity:0.7 }} />
                                    <span style={{ fontSize:10, color:p.text, opacity:0.75 }}>{s.booked_count}/{s.capacity}</span>
                                  </div>
                                )}
                                {h > 70 && tName && <p style={{ fontSize:9, margin:'2px 0 0', color:p.text, opacity:0.65, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>👤 {tName}</p>}
                                {h > 85 && (s.calendar_bookings||[]).length > 0 && (
                                  <div style={{ marginTop:3, borderTop:`1px solid ${p.border}`, paddingTop:3, display:'flex', flexDirection:'column', gap:1 }}>
                                    {s.calendar_bookings.slice(0, Math.max(1, Math.floor((h - 88) / 13))).map((b:any) => {
                                      const name = b.customers?.full_name || customers.find((c:any) => c.id===b.customer_id)?.full_name || '?'
                                      return <p key={b.id} style={{ fontSize:9, margin:0, color:p.text, opacity:0.8, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>· {name}</p>
                                    })}
                                    {s.calendar_bookings.length > Math.max(1, Math.floor((h - 88) / 13)) && (
                                      <p style={{ fontSize:9, margin:0, color:p.text, opacity:0.55 }}>+{s.calendar_bookings.length - Math.max(1, Math.floor((h - 88) / 13))} more</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ─── DAY ─────────────────────────────────────────────── */}
            {view === 'day' && (
              <div style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:52, height:52, borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    background: currentDate.toDateString()===today.toDateString() ? 'var(--primary)' : 'var(--bg)' }}>
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.06em', color: currentDate.toDateString()===today.toDateString() ? 'rgba(255,255,255,0.7)' : 'var(--text-ter)' }}>
                      {DAY_NAMES[currentDate.getDay()]}
                    </span>
                    <span style={{ fontSize:22, fontWeight:800, lineHeight:1, color: currentDate.toDateString()===today.toDateString() ? '#fff' : 'var(--ink)' }}>
                      {currentDate.getDate()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize:16, fontWeight:700, color:'var(--ink)', margin:0 }}>{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
                    <p style={{ fontSize:12, color:'var(--text-ter)', margin:'2px 0 0' }}>{getSessionsForDay(currentDate).length} session{getSessionsForDay(currentDate).length!==1?'s':''}</p>
                  </div>
                </div>

                {getSessionsForDay(currentDate).length === 0 ? (
                  <div style={{ padding:'56px 20px', textAlign:'center' }}>
                    <Calendar size={32} style={{ color:'var(--text-ter)', margin:'0 auto 12px', display:'block' }} />
                    <p style={{ color:'var(--text-ter)', fontSize:14, margin:'0 0 12px' }}>No sessions scheduled for this day</p>
                    <button onClick={() => setShowForm(true)} style={{ fontSize:13, padding:'7px 16px', borderRadius:10, background:'var(--primary)', color:'#fff', border:'none', cursor:'pointer', fontWeight:600 }}>+ Add Session</button>
                  </div>
                ) : (
                  <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                    {getSessionsForDay(currentDate).map(s => {
                      const p       = sessionPalette(s)
                      const trainer = members.find((m:any) => (m.user_id||m.id) === s.trainer_id)
                      const tName   = trainer?.users?.full_name || trainer?.users?.email || null
                      const isSel   = selectedSession?.id === s.id
                      const ratio   = s.capacity > 0 ? s.booked_count / s.capacity : 0
                      return (
                        <div key={s.id} onClick={() => setSelectedSession(s)}
                          style={{ display:'flex', gap:14, padding:'14px 16px', borderRadius:12, cursor:'pointer', transition:'border-color 0.15s',
                            border: isSel ? `2px solid var(--primary)` : '1px solid var(--border)',
                            background: isSel ? 'var(--primary-dim)' : 'var(--bg)' }}>
                          {/* Time column */}
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:50 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{formatTime(s.start_time)}</span>
                            <div style={{ width:2, flex:1, minHeight:16, background:'var(--divider)', margin:'4px 0', borderRadius:2 }} />
                            <span style={{ fontSize:11, color:'var(--text-ter)' }}>{formatTime(s.end_time)}</span>
                          </div>
                          {/* Color bar */}
                          <div style={{ width:4, borderRadius:4, flexShrink:0, background:p.dot }} />
                          {/* Content */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:5 }}>
                              <p style={{ fontSize:14, fontWeight:700, color:'var(--ink)', margin:0 }}>{s.title}</p>
                              <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:600, flexShrink:0, background:p.bg, color:p.text, border:`1px solid ${p.border}` }}>{s.status}</span>
                            </div>
                            {s.description && <p style={{ fontSize:12, color:'var(--text-sec)', margin:'0 0 6px' }}>{s.description}</p>}
                            <div style={{ display:'flex', flexWrap:'wrap', gap:14, marginBottom:8 }}>
                              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-ter)' }}>
                                <Users size={13} /> {s.booked_count}/{s.capacity} booked
                              </span>
                              {tName && (
                                <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-ter)' }}>
                                  <User size={13} /> {tName}
                                </span>
                              )}
                              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'var(--text-ter)' }}>
                                <Clock size={13} />
                                {Math.round((new Date(s.end_time).getTime()-new Date(s.start_time).getTime())/60000)} min
                              </span>
                            </div>
                            {/* Capacity bar */}
                            <div style={{ height:4, borderRadius:4, background:'var(--divider)', overflow:'hidden' }}>
                              <div style={{ height:'100%', borderRadius:4, transition:'width 0.3s', width:`${Math.min(ratio*100,100)}%`,
                                background: ratio>=1 ? '#ef4444' : ratio>=0.75 ? '#f59e0b' : 'var(--primary)' }} />
                            </div>
                            {/* Attendee list */}
                            {(s.calendar_bookings||[]).length > 0 && (
                              <div style={{ marginTop:10, borderTop:'1px solid var(--divider)', paddingTop:8 }}>
                                <p style={{ fontSize:11, fontWeight:700, color:'var(--text-ter)', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                                  Attendees ({s.calendar_bookings.length})
                                </p>
                                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                  {s.calendar_bookings.map((b:any, bi:number) => {
                                    const cust = customers.find((c:any) => c.id===b.customer_id)
                                    const name = b.customers?.full_name || cust?.full_name || '?'
                                    return (
                                      <div key={b.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                                        <div style={{ width:22, height:22, borderRadius:'50%', background:'var(--primary-dim)',
                                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                                          {cust?.avatar_url
                                            ? <img src={cust.avatar_url} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                            : <span style={{ fontSize:9, fontWeight:800, color:'var(--primary)' }}>{name.charAt(0).toUpperCase()}</span>}
                                        </div>
                                        <span style={{ fontSize:12, color:'var(--ink)', fontWeight:500 }}>{name}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Detail Panel ──────────────────────────────────────────── */}
          {selectedSession && (
            <div style={{ width:296, background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', padding:20,
              position:'sticky', top:24, flexShrink:0, maxHeight:'calc(100vh - 120px)', overflowY:'auto' }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:15, fontWeight:700, color:'var(--ink)', margin:'0 0 4px' }}>{selectedSession.title}</p>
                  <div style={{ fontSize:12, color:'var(--text-ter)', display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <Calendar size={12} /> {formatDate(selectedSession.start_time)}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-ter)', display:'flex', alignItems:'center', gap:6 }}>
                    <Clock size={12} /> {formatTime(selectedSession.start_time)} – {formatTime(selectedSession.end_time)}
                    <span style={{ opacity:0.6 }}>· {Math.round((new Date(selectedSession.end_time).getTime()-new Date(selectedSession.start_time).getTime())/60000)} min</span>
                  </div>
                </div>
                <button onClick={() => setSelectedSession(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ter)', padding:2, flexShrink:0 }}><X size={16}/></button>
              </div>

              {/* Capacity */}
              {(() => {
                const p     = sessionPalette(selectedSession)
                const ratio = selectedSession.capacity>0 ? selectedSession.booked_count/selectedSession.capacity : 0
                return (
                  <div style={{ background:'var(--bg)', borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:12, color:'var(--text-ter)', display:'flex', alignItems:'center', gap:5 }}><Users size={13}/> Capacity</span>
                      <span style={{ fontSize:14, fontWeight:800, color:p.dot }}>{selectedSession.booked_count}/{selectedSession.capacity}</span>
                    </div>
                    <div style={{ height:6, borderRadius:4, background:'var(--divider)', overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:4, width:`${Math.min(ratio*100,100)}%`,
                        background: ratio>=1 ? '#ef4444' : ratio>=0.75 ? '#f59e0b' : 'var(--primary)' }} />
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                      <span style={{ fontSize:10, color:'var(--text-ter)' }}>{selectedSession.capacity - selectedSession.booked_count} spots left</span>
                      <span style={{ fontSize:10, padding:'1px 8px', borderRadius:10, fontWeight:600, background:p.bg, color:p.text, border:`1px solid ${p.border}` }}>{selectedSession.status}</span>
                    </div>
                  </div>
                )
              })()}

              {selectedSession.description && (
                <p style={{ fontSize:12, color:'var(--text-sec)', background:'var(--bg)', borderRadius:8, padding:'8px 10px', marginBottom:14 }}>
                  {selectedSession.description}
                </p>
              )}

              {/* Trainer */}
              <div style={{ marginBottom:14 }}>
                <label style={{ ...labelStyle, marginBottom:6 }}>ORGANIZER</label>
                <select value={selectedTrainer} onChange={e => setSelectedTrainer(e.target.value)}
                  style={{ width:'100%', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', fontSize:12, background:'var(--bg)', color:'var(--ink)', outline:'none', boxSizing:'border-box' }}>
                  <option value="">No organizer</option>
                  {members.map((m:any) => <option key={m.id} value={m.user_id||m.id}>{m.users?.full_name||m.users?.email||m.email}</option>)}
                </select>
              </div>

              {/* Actions — hidden for virtual (template-derived) sessions */}
              {!selectedSession.isVirtual && (
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                <button onClick={async () => { setSavingTrainer(true); await assignTrainer(selectedSession.id, selectedTrainer); setSavingTrainer(false) }}
                  disabled={savingTrainer}
                  style={{ flex:1, fontSize:12, padding:'7px 0', borderRadius:8, background:'var(--primary)', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, opacity:savingTrainer?0.6:1 }}>
                  {savingTrainer ? 'Saving…' : 'Save Organizer'}
                </button>
                <button onClick={() => copyLink(selectedSession.id)}
                  style={{ padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
                    background: copied ? 'var(--green-dim)' : 'var(--bg)', color: copied ? 'var(--green)' : 'var(--text-sec)' }}>
                  {copied ? <Check size={13}/> : <Link2 size={13}/>} {copied ? 'Copied' : 'Link'}
                </button>
                <button onClick={() => handleDelete(selectedSession.id)}
                  style={{ padding:'7px 10px', borderRadius:8, background:'var(--danger-dim)', border:'1px solid #fca5a5', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--danger)' }}>
                  <Trash2 size={13}/> Delete
                </button>
              </div>
              )}
              {selectedSession.isVirtual && (
                <div style={{ marginBottom:16, padding:'8px 12px', borderRadius:8, background:'var(--primary-dim)', border:'1px solid var(--border)', fontSize:12, color:'var(--primary)' }}>
                  🔁 Recurring template — manage from Sessions page
                </div>
              )}

              {/* Bookings — hidden for virtual sessions */}
              {!selectedSession.isVirtual && <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--ink)', margin:0, display:'flex', alignItems:'center', gap:5 }}>
                    <Users size={13}/> Bookings <span style={{ color:'var(--text-ter)', fontWeight:400, marginLeft:2 }}>({selectedSession.calendar_bookings?.length||0})</span>
                  </p>
                  {selectedSession.booked_count < selectedSession.capacity && (
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => { setShowBookForm(!showBookForm); setShowBulkForm(false) }}
                        style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:'var(--primary-dim)', color:'var(--primary)', border:'none', cursor:'pointer', fontWeight:600 }}>+ Add</button>
                      <button onClick={() => { setShowBulkForm(!showBulkForm); setShowBookForm(false) }}
                        style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:'var(--green-dim)', color:'var(--green)', border:'none', cursor:'pointer', fontWeight:600 }}>+ Bulk</button>
                    </div>
                  )}
                </div>

                {showBookForm && (
                  <div style={{ background:'var(--bg)', borderRadius:10, padding:10, marginBottom:10 }}>
                    <select value={bookForm.customer_id} onChange={e => setBookForm({customer_id:e.target.value})}
                      style={{ width:'100%', border:'1px solid var(--border)', borderRadius:8, padding:'6px 9px', fontSize:12, background:'var(--surface)', color:'var(--ink)', outline:'none', marginBottom:8, boxSizing:'border-box' }}>
                      <option value="">Select customer…</option>
                      {customers.filter(c => !selectedSession.calendar_bookings?.some((b:any) => b.customer_id===c.id)).map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                    </select>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={handleBook} disabled={saving||!bookForm.customer_id}
                        style={{ flex:1, background:'var(--primary)', color:'#fff', border:'none', borderRadius:8, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', opacity:(saving||!bookForm.customer_id)?0.5:1 }}>
                        {saving ? '…' : 'Book'}
                      </button>
                      <button onClick={() => setShowBookForm(false)} style={{ fontSize:12, padding:'6px 10px', borderRadius:8, background:'none', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-sec)' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {showBulkForm && (
                  <div style={{ background:'var(--bg)', borderRadius:10, padding:10, marginBottom:10 }}>
                    <div style={{ maxHeight:130, overflowY:'auto', marginBottom:8, display:'flex', flexDirection:'column', gap:4 }}>
                      {customers.filter(c => !selectedSession.calendar_bookings?.some((b:any) => b.customer_id===c.id)).map(c => (
                        <label key={c.id} style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:12, color:'var(--ink)' }}>
                          <input type="checkbox" checked={selectedCustomers.includes(c.id)}
                            onChange={e => setSelectedCustomers(e.target.checked ? [...selectedCustomers,c.id] : selectedCustomers.filter(i=>i!==c.id))}
                            style={{ width:13, height:13, accentColor:'var(--primary)' }} />
                          {c.full_name}
                        </label>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={handleBulkBook} disabled={saving||selectedCustomers.length===0}
                        style={{ flex:1, background:'var(--green)', color:'#fff', border:'none', borderRadius:8, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', opacity:(saving||selectedCustomers.length===0)?0.5:1 }}>
                        {saving ? '…' : `Book ${selectedCustomers.length}`}
                      </button>
                      <button onClick={() => { setShowBulkForm(false); setSelectedCustomers([]) }}
                        style={{ fontSize:12, padding:'6px 10px', borderRadius:8, background:'none', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-sec)' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {(selectedSession.calendar_bookings||[]).length === 0 ? (
                  <p style={{ fontSize:12, color:'var(--text-ter)', textAlign:'center', padding:'12px 0', margin:0 }}>No bookings yet</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {selectedSession.calendar_bookings.map((b:any) => {
                      const cust = customers.find((c:any) => c.id===b.customer_id)
                      const name = b.customers?.full_name || cust?.full_name || '?'
                      return (
                        <div key={b.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 10px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--divider)' }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--primary-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
                            {cust?.avatar_url
                              ? <img src={cust.avatar_url} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                              : <span style={{ fontSize:11, fontWeight:800, color:'var(--primary)' }}>{name.charAt(0).toUpperCase()}</span>}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:12, fontWeight:600, color:'var(--ink)', margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{name}</p>
                            <p style={{ fontSize:10, margin:'1px 0 0', color: b.status==='confirmed' ? 'var(--green)' : 'var(--danger)' }}>{b.status}</p>
                          </div>
                          <button onClick={() => handleCancelBooking(b.id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ter)', padding:2, flexShrink:0, lineHeight:1 }}
                            onMouseEnter={e => (e.currentTarget.style.color='var(--danger)')}
                            onMouseLeave={e => (e.currentTarget.style.color='var(--text-ter)')}>
                            <X size={13}/>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
