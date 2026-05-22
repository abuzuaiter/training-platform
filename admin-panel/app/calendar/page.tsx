'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, ChevronRight, Plus, Users, Clock, Trash2,
  Check, X, Calendar, RefreshCw, Link2, Filter, ChevronDown, Building2
} from 'lucide-react'

const QATAR_OFFSET = 3 * 60
const HOUR_HEIGHT  = 68
const GRID_START   = 6
const GRID_END     = 23

function toQatarTime(dateStr: string) {
  return new Date(new Date(dateStr).getTime() + QATAR_OFFSET * 60 * 1000)
}
function toUTC(localDateStr: string) {
  const d = new Date(localDateStr)
  return new Date(d.getTime() - QATAR_OFFSET * 60 * 1000).toISOString()
}
function formatTime(dateStr: string) {
  return toQatarTime(dateStr).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
}
function formatDate(dateStr: string) {
  return toQatarTime(dateStr).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
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

const ORG_ACCENT = ['#6FA3C5','#0E9A8E','#22A06B','#C7891A','#9B6FD0','#E05C8A','#4A90D9','#E07B3A']

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOURS       = Array.from({ length: GRID_END - GRID_START }, (_, i) => GRID_START + i)

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
  trainer_id?: string | null
  is_recurring: boolean
  organizations: { name: string }
  calendar_bookings: any[]
}

export default function SuperAdminCalendarPage() {
  const [sessions,        setSessions]       = useState<Session[]>([])
  const [orgs,            setOrgs]           = useState<any[]>([])
  const [customers,       setCustomers]      = useState<any[]>([])
  const [loading,         setLoading]        = useState(true)
  const [view,            setView]           = useState<'month'|'week'|'day'>('week')
  const [currentDate,     setCurrentDate]    = useState(new Date())
  const [filterOrg,       setFilterOrg]      = useState('')
  const [filterCustomer,  setFilterCustomer] = useState('')
  const [selectedSession, setSelectedSession]= useState<Session|null>(null)
  const [showForm,        setShowForm]       = useState(false)
  const [showBookForm,    setShowBookForm]   = useState(false)
  const [showBulkForm,    setShowBulkForm]   = useState(false)
  const [message,         setMessage]        = useState('')
  const [saving,          setSaving]         = useState(false)
  const [copied,          setCopied]         = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [form, setForm] = useState({ organization_id:'', title:'', description:'', start_time:'', end_time:'', capacity:'1' })
  const [bookForm, setBookForm] = useState({ customer_id:'' })
  const [recurring, setRecurring] = useState({ is_recurring:false, recurrence_type:'weekly', recurrence_days:[] as string[], recurrence_end_date:'' })

  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadAll() }, [])
  useEffect(() => {
    if (view === 'week' && gridRef.current) {
      const qHour = toQatarTime(new Date().toISOString()).getHours()
      const scrollHour = Math.max(GRID_START, qHour - 2)
      setTimeout(() => { if (gridRef.current) gridRef.current.scrollTop = (scrollHour - GRID_START) * HOUR_HEIGHT }, 60)
    }
  }, [view])

  async function loadAll() {
    setLoading(true)
    const [sessRes, orgsRes] = await Promise.all([
      fetch('/api/calendar-sessions'),
      fetch('/api/organizations'),
    ])
    const [sessData, orgsData] = await Promise.all([sessRes.json(), orgsRes.json()])
    setSessions(Array.isArray(sessData) ? sessData : [])
    setOrgs(Array.isArray(orgsData) ? orgsData : [])
    setLoading(false)
  }

  async function loadOrgCustomers(orgId: string) {
    if (!orgId) { setCustomers([]); return }
    const res = await fetch(`/api/organizations/${orgId}/customers`)
    setCustomers(res.ok ? await res.json() : [])
  }

  async function handleCreateSession() {
    if (!form.organization_id || !form.title || !form.start_time || !form.end_time) { setMessage('Please fill all required fields'); return }
    setSaving(true)
    const res = await fetch('/api/calendar-sessions', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, capacity: parseInt(form.capacity), start_time: toUTC(form.start_time), end_time: toUTC(form.end_time), ...recurring })
    })
    const data = await res.json()
    if (res.ok) { setMessage('Session created!'); setShowForm(false); setForm({ organization_id:'', title:'', description:'', start_time:'', end_time:'', capacity:'1' }); loadAll() }
    else setMessage(data.error || 'Error')
    setSaving(false)
  }

  async function handleBook() {
    if (!bookForm.customer_id || !selectedSession) return
    setSaving(true)
    const res = await fetch('/api/calendar-bookings', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ session_id: selectedSession.id, customer_id: bookForm.customer_id, organization_id: selectedSession.organization_id })
    })
    if (res.ok) {
      setMessage('Booking confirmed!'); setShowBookForm(false); setBookForm({ customer_id:'' }); loadAll()
      const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`)
      setSelectedSession(await r.json())
    } else { const d = await res.json(); setMessage(d.error||'Error') }
    setSaving(false)
  }

  async function handleBulkBook() {
    if (!selectedSession || selectedCustomers.length === 0) return
    setSaving(true)
    let success = 0
    for (const cId of selectedCustomers) {
      const res = await fetch('/api/calendar-bookings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session_id: selectedSession.id, customer_id: cId, organization_id: selectedSession.organization_id }) })
      if (res.ok) success++
    }
    setMessage(`${success} customers booked!`); setShowBulkForm(false); setSelectedCustomers([]); loadAll()
    const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`); setSelectedSession(await r.json())
    setSaving(false)
  }

  async function handleCancelBooking(bookingId: string) {
    await fetch(`/api/calendar-bookings/${bookingId}`, { method:'DELETE' })
    if (selectedSession) { const r = await fetch(`/api/calendar-sessions/${selectedSession.id}`); setSelectedSession(await r.json()) }
    loadAll()
  }

  async function handleDelete(sessId: string) {
    await fetch(`/api/calendar-sessions/${sessId}`, { method:'DELETE' })
    setSelectedSession(null); loadAll()
  }

  function copyLink(sessionId: string) {
    navigator.clipboard.writeText(`${window.location.origin}/register/${sessionId}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function orgColor(orgId: string) {
    const idx = orgs.findIndex(o => o.id === orgId)
    return ORG_ACCENT[idx % ORG_ACCENT.length] || 'var(--primary)'
  }

  // ── Filtered sessions ──────────────────────────────────────────────
  const filteredSessions = sessions.filter(s => {
    if (filterOrg      && s.organization_id !== filterOrg) return false
    if (filterCustomer && !s.calendar_bookings?.some((b: any) => b.customer_id === filterCustomer)) return false
    return true
  })

  // Customers who have at least one booking across all sessions
  const customersWithBookings = (() => {
    const seen = new Set<string>()
    const result: any[] = []
    sessions.forEach(s => (s.calendar_bookings || []).forEach((b: any) => {
      if (!seen.has(b.customer_id) && b.customers?.full_name) {
        seen.add(b.customer_id)
        result.push({ id: b.customer_id, full_name: b.customers.full_name })
      }
    }))
    return result.sort((a, b) => a.full_name.localeCompare(b.full_name))
  })()

  const activeFilters = (filterOrg ? 1 : 0) + (filterCustomer ? 1 : 0)

  function getSessionsForDay(date: Date) {
    return filteredSessions
      .filter(s => toQatarTime(s.start_time).toDateString() === date.toDateString())
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

  const weekDays  = getWeekDays(currentDate)
  const monthDays = getMonthDays(currentDate)
  const today     = new Date()
  const _nowQ   = toQatarTime(new Date().toISOString())
  const nowMins = (_nowQ.getHours() - GRID_START) * 60 + _nowQ.getMinutes()

  function titleForNav() {
    if (view === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
    if (view === 'week')  return `${weekDays[0].toLocaleDateString('en',{month:'short',day:'numeric'})} – ${weekDays[6].toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'})}`
    return currentDate.toLocaleDateString('en', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  }

  const inputStyle: React.CSSProperties = {
    width:'100%', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px',
    fontSize:13, background:'var(--bg)', color:'var(--ink)', outline:'none', boxSizing:'border-box'
  }
  const labelStyle: React.CSSProperties = {
    display:'block', fontSize:11, fontWeight:600, color:'var(--text-ter)',
    marginBottom:4, letterSpacing:'0.06em'
  }
  const selectStyle = (active: boolean): React.CSSProperties => ({
    appearance:'none', WebkitAppearance:'none',
    border: active ? '1.5px solid var(--primary)' : '1px solid var(--border)',
    borderRadius:8, padding:'5px 28px 5px 10px', fontSize:12, fontWeight:600,
    background: active ? 'var(--primary-dim)' : 'var(--surface)',
    color: active ? 'var(--primary)' : 'var(--text-sec)',
    cursor:'pointer', outline:'none',
  })

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>
      {/* Nav */}
      <nav style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
          <Link href="/" style={{ color:'var(--text-ter)', textDecoration:'none' }}>Dashboard</Link>
          <span style={{ color:'var(--border)' }}>/</span>
          <span style={{ color:'var(--ink)', fontWeight:600 }}>Calendar</span>
        </div>
        <button onClick={() => { setShowForm(!showForm); setSelectedSession(null) }}
          style={{ background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={15} /> New Session
        </button>
      </nav>

      <div style={{ maxWidth:1400, margin:'0 auto', padding:'24px' }}>
        {/* Toast */}
        {message && (
          <div style={{ marginBottom:16, padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'space-between',
            background: message.includes('!') ? 'var(--green-dim)' : 'var(--danger-dim)',
            color:      message.includes('!') ? 'var(--green)'     : 'var(--danger)' }}>
            {message}
            <button onClick={() => setMessage('')} style={{ background:'none', border:'none', cursor:'pointer', opacity:0.5, color:'inherit' }}>✕</button>
          </div>
        )}

        {/* New Session Form */}
        {showForm && (
          <div style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', padding:24, marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'var(--ink)', margin:0, display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={18} style={{ color:'var(--primary)' }} /> New Session
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ter)' }}><X size={18}/></button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={labelStyle}>ORGANIZATION *</label>
                <select value={form.organization_id} onChange={e => { setForm({...form, organization_id: e.target.value}); loadOrgCustomers(e.target.value) }}
                  style={inputStyle}>
                  <option value="">Select organization...</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
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
                        <label style={{...labelStyle,marginBottom:4}}>END DATE</label>
                        <input value={recurring.recurrence_end_date} onChange={e => setRecurring({...recurring,recurrence_end_date:e.target.value})} type="date"
                          style={{ width:'100%', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', fontSize:13, background:'var(--surface)', color:'var(--ink)', outline:'none', boxSizing:'border-box' as const }} />
                      </div>
                    </div>
                    {recurring.recurrence_type === 'weekly' && (
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' as const }}>
                        {['sunday','monday','tuesday','wednesday','thursday','friday','saturday'].map(day => (
                          <label key={day} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:12, color:'var(--ink)', textTransform:'capitalize' as const }}>
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
                style={{ background:'var(--primary)', color:'#fff', border:'none', borderRadius:10, padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.6:1 }}>
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
          {/* Calendar */}
          <div style={{ flex:1, minWidth:0 }}>
            {/* Controls */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button onClick={() => navigate(-1)}
                  style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', color:'var(--text-sec)' }}>
                  <ChevronLeft size={16}/>
                </button>
                <span style={{ fontSize:16, fontWeight:700, color:'var(--ink)', minWidth:220, textAlign:'center' }}>{titleForNav()}</span>
                <button onClick={() => navigate(1)}
                  style={{ width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, cursor:'pointer', color:'var(--text-sec)' }}>
                  <ChevronRight size={16}/>
                </button>
                <button onClick={() => setCurrentDate(new Date())}
                  style={{ fontSize:12, padding:'5px 12px', borderRadius:8, background:'var(--surface)', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text-sec)', fontWeight:500 }}>
                  Today
                </button>
                {loading && <RefreshCw size={14} style={{ color:'var(--text-ter)', animation:'spin 1s linear infinite' }}/>}
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

            {/* Filter Bar */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color: activeFilters > 0 ? 'var(--primary)' : 'var(--text-ter)' }}>
                <Filter size={13}/>
                <span>{activeFilters > 0 ? `${activeFilters} filter${activeFilters > 1 ? 's' : ''} active` : 'Filter by'}</span>
              </div>

              {/* Org filter */}
              <div style={{ position:'relative' }}>
                <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)} style={{ ...selectStyle(!!filterOrg), minWidth:160 }}>
                  <option value="">All Organizations</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <ChevronDown size={12} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color: filterOrg ? 'var(--primary)' : 'var(--text-ter)' }}/>
              </div>

              {/* Customer / SPOC filter */}
              <div style={{ position:'relative' }}>
                <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} style={{ ...selectStyle(!!filterCustomer), minWidth:160 }}>
                  <option value="">All Customers</option>
                  {customersWithBookings.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
                <ChevronDown size={12} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color: filterCustomer ? 'var(--primary)' : 'var(--text-ter)' }}/>
              </div>

              {activeFilters > 0 && (
                <button onClick={() => { setFilterOrg(''); setFilterCustomer('') }}
                  style={{ fontSize:12, fontWeight:600, padding:'5px 10px', borderRadius:8, cursor:'pointer', border:'none',
                    background:'var(--danger-dim)', color:'var(--danger)', display:'flex', alignItems:'center', gap:4 }}>
                  <X size={11}/> Clear
                </button>
              )}
            </div>

            {/* ─── MONTH ─────────────────────────────────────────── */}
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
                      <div key={i} style={{ minHeight:100, padding:6,
                        borderBottom:'1px solid var(--divider)', borderRight:(i+1)%7===0?'none':'1px solid var(--divider)',
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
                                const ac = orgColor(s.organization_id)
                                return (
                                  <div key={s.id} onClick={() => setSelectedSession(s)}
                                    style={{ borderRadius:6, padding:'3px 7px', cursor:'pointer', display:'flex', alignItems:'center', gap:5,
                                      background:p.bg, border:`1px solid ${p.border}` }}>
                                    <span style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background:ac }} />
                                    <span style={{ fontSize:11, fontWeight:600, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', color:p.text }}>
                                      {formatTime(s.start_time)} {s.title}
                                    </span>
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

            {/* ─── WEEK (time-grid) ──────────────────────────────── */}
            {view === 'week' && (
              <div style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
                  <div/>
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
                <div ref={gridRef} style={{ overflowY:'auto', maxHeight:580 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'52px repeat(7,1fr)', position:'relative' }}>
                    <div>
                      {HOURS.map(h => (
                        <div key={h} style={{ height:HOUR_HEIGHT, display:'flex', alignItems:'flex-start', justifyContent:'flex-end', paddingRight:8, paddingTop:4 }}>
                          <span style={{ fontSize:10, color:'var(--text-ter)', fontWeight:500 }}>
                            {h>12?`${h-12}pm`:h===12?'12pm':`${h}am`}
                          </span>
                        </div>
                      ))}
                    </div>
                    {weekDays.map((day, i) => {
                      const ds      = getSessionsForDay(day)
                      const isToday = day.toDateString() === today.toDateString()
                      return (
                        <div key={i} style={{ borderLeft:'1px solid var(--border)', position:'relative' }}>
                          {HOURS.map(h => (
                            <div key={h} style={{ height:HOUR_HEIGHT, borderBottom:`1px solid ${h%2===0?'var(--divider)':'transparent'}`, boxSizing:'border-box' }}/>
                          ))}
                          {isToday && nowMins >= 0 && nowMins < (GRID_END-GRID_START)*60 && (
                            <div style={{ position:'absolute', left:0, right:0, top:`${(nowMins/60)*HOUR_HEIGHT}px`, zIndex:10, display:'flex', alignItems:'center', pointerEvents:'none' }}>
                              <div style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', marginLeft:-4, flexShrink:0 }}/>
                              <div style={{ flex:1, height:1.5, background:'#ef4444' }}/>
                            </div>
                          )}
                          {ds.map(s => {
                            const p      = sessionPalette(s)
                            const gs     = sessionGridStyle(s)
                            const h      = parseFloat(gs.height)
                            const ac     = orgColor(s.organization_id)
                            const isSel  = selectedSession?.id === s.id
                            return (
                              <div key={s.id} onClick={() => setSelectedSession(s)}
                                style={{ position:'absolute', left:2, right:2, ...gs, zIndex:5, borderRadius:8, padding:'5px 7px', cursor:'pointer', overflow:'hidden',
                                  background:p.bg, border:`1.5px solid ${isSel?'var(--primary)':p.border}`,
                                  boxShadow: isSel ? '0 0 0 2px var(--primary-dim)' : '0 1px 3px rgba(0,0,0,0.06)' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                                  <span style={{ width:6, height:6, borderRadius:'50%', background:ac, flexShrink:0 }}/>
                                  <p style={{ fontSize:11, fontWeight:700, margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', color:p.text }}>{s.title}</p>
                                </div>
                                {h > 36 && <p style={{ fontSize:10, margin:'2px 0 0', color:p.text, opacity:0.75 }}>{formatTime(s.start_time)}–{formatTime(s.end_time)}</p>}
                                {h > 52 && (
                                  <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
                                    <Users size={9} style={{ color:p.text, opacity:0.7 }}/>
                                    <span style={{ fontSize:10, color:p.text, opacity:0.75 }}>{s.booked_count}/{s.capacity}</span>
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

            {/* ─── DAY ───────────────────────────────────────────── */}
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
                    <Calendar size={32} style={{ color:'var(--text-ter)', margin:'0 auto 12px', display:'block' }}/>
                    <p style={{ color:'var(--text-ter)', fontSize:14, margin:0 }}>No sessions for this day</p>
                  </div>
                ) : (
                  <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                    {getSessionsForDay(currentDate).map(s => {
                      const p      = sessionPalette(s)
                      const ac     = orgColor(s.organization_id)
                      const isSel  = selectedSession?.id === s.id
                      const ratio  = s.capacity > 0 ? s.booked_count / s.capacity : 0
                      return (
                        <div key={s.id} onClick={() => setSelectedSession(s)}
                          style={{ display:'flex', gap:14, padding:'14px 16px', borderRadius:12, cursor:'pointer',
                            border: isSel ? '2px solid var(--primary)' : '1px solid var(--border)',
                            background: isSel ? 'var(--primary-dim)' : 'var(--bg)' }}>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:50 }}>
                            <span style={{ fontSize:13, fontWeight:700, color:'var(--ink)' }}>{formatTime(s.start_time)}</span>
                            <div style={{ width:2, flex:1, minHeight:16, background:'var(--divider)', margin:'4px 0', borderRadius:2 }}/>
                            <span style={{ fontSize:11, color:'var(--text-ter)' }}>{formatTime(s.end_time)}</span>
                          </div>
                          <div style={{ width:4, borderRadius:4, flexShrink:0, background:ac }}/>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:4 }}>
                              <p style={{ fontSize:14, fontWeight:700, color:'var(--ink)', margin:0 }}>{s.title}</p>
                              <span style={{ fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:600, flexShrink:0, background:p.bg, color:p.text, border:`1px solid ${p.border}` }}>{s.status}</span>
                            </div>
                            <p style={{ fontSize:12, color:'var(--text-ter)', margin:'0 0 4px' }}>{s.organizations?.name}</p>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <span style={{ fontSize:12, color:'var(--text-ter)', display:'flex', alignItems:'center', gap:4 }}>
                                <Users size={12}/> {s.booked_count}/{s.capacity}
                              </span>
                              <span style={{ fontSize:12, color:'var(--text-ter)', display:'flex', alignItems:'center', gap:4 }}>
                                <Clock size={12}/> {Math.round((new Date(s.end_time).getTime()-new Date(s.start_time).getTime())/60000)} min
                              </span>
                            </div>
                            <div style={{ height:4, borderRadius:4, background:'var(--divider)', overflow:'hidden', marginTop:6 }}>
                              <div style={{ height:'100%', borderRadius:4, width:`${Math.min(ratio*100,100)}%`,
                                background: ratio>=1 ? '#ef4444' : ratio>=0.75 ? '#f59e0b' : ac }}/>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Org legend */}
            {orgs.length > 0 && (
              <div style={{ marginTop:12, display:'flex', flexWrap:'wrap', gap:10 }}>
                {orgs.map((org, i) => (
                  <div key={org.id} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ width:8, height:8, borderRadius:'50%', background:ORG_ACCENT[i%ORG_ACCENT.length] }}/>
                    <span style={{ fontSize:11, color:'var(--text-ter)' }}>{org.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedSession && (
            <div style={{ width:296, background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)', padding:20,
              position:'sticky', top:24, flexShrink:0, maxHeight:'calc(100vh - 120px)', overflowY:'auto' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:15, fontWeight:700, color:'var(--ink)', margin:'0 0 2px' }}>{selectedSession.title}</p>
                  <p style={{ fontSize:12, color:'var(--text-ter)', margin:'0 0 2px', display:'flex', alignItems:'center', gap:5 }}>
                    <Building2 size={12}/> {selectedSession.organizations?.name}
                  </p>
                  <div style={{ fontSize:12, color:'var(--text-ter)', display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                    <Calendar size={12}/> {formatDate(selectedSession.start_time)}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-ter)', display:'flex', alignItems:'center', gap:6 }}>
                    <Clock size={12}/> {formatTime(selectedSession.start_time)} – {formatTime(selectedSession.end_time)}
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
                        background: ratio>=1?'#ef4444':ratio>=0.75?'#f59e0b':'var(--primary)' }}/>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                      <span style={{ fontSize:10, color:'var(--text-ter)' }}>{selectedSession.capacity-selectedSession.booked_count} spots left</span>
                      <span style={{ fontSize:10, padding:'1px 8px', borderRadius:10, fontWeight:600, background:p.bg, color:p.text, border:`1px solid ${p.border}` }}>{selectedSession.status}</span>
                    </div>
                  </div>
                )
              })()}

              {/* Actions */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:16 }}>
                <button onClick={() => copyLink(selectedSession.id)}
                  style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, fontSize:12, fontWeight:600,
                    background: copied ? 'var(--green-dim)' : 'var(--bg)', color: copied ? 'var(--green)' : 'var(--text-sec)' }}>
                  {copied ? <Check size={13}/> : <Link2 size={13}/>} {copied ? 'Copied' : 'Copy Link'}
                </button>
                <button onClick={() => handleDelete(selectedSession.id)}
                  style={{ padding:'7px 10px', borderRadius:8, background:'var(--danger-dim)', border:'1px solid #fca5a5', cursor:'pointer', display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'var(--danger)' }}>
                  <Trash2 size={13}/> Delete
                </button>
              </div>

              {/* Bookings */}
              <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--ink)', margin:0, display:'flex', alignItems:'center', gap:5 }}>
                    <Users size={13}/> Bookings <span style={{ color:'var(--text-ter)', fontWeight:400, marginLeft:2 }}>({selectedSession.calendar_bookings?.length||0})</span>
                  </p>
                  {selectedSession.booked_count < selectedSession.capacity && (
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => { setShowBookForm(!showBookForm); setShowBulkForm(false); loadOrgCustomers(selectedSession.organization_id) }}
                        style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:'var(--primary-dim)', color:'var(--primary)', border:'none', cursor:'pointer', fontWeight:600 }}>+ Add</button>
                      <button onClick={() => { setShowBulkForm(!showBulkForm); setShowBookForm(false); loadOrgCustomers(selectedSession.organization_id) }}
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
                        {saving?'…':'Book'}
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
                            style={{ width:13, height:13, accentColor:'var(--primary)' }}/>
                          {c.full_name}
                        </label>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={handleBulkBook} disabled={saving||selectedCustomers.length===0}
                        style={{ flex:1, background:'var(--green)', color:'#fff', border:'none', borderRadius:8, padding:'6px 0', fontSize:12, fontWeight:600, cursor:'pointer', opacity:(saving||selectedCustomers.length===0)?0.5:1 }}>
                        {saving?'…':`Book ${selectedCustomers.length}`}
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
                      const name = b.customers?.full_name || '?'
                      return (
                        <div key={b.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 10px', borderRadius:10, background:'var(--bg)', border:'1px solid var(--divider)' }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--primary-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ fontSize:11, fontWeight:800, color:'var(--primary)' }}>{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:12, fontWeight:600, color:'var(--ink)', margin:0, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{name}</p>
                            <p style={{ fontSize:10, margin:'1px 0 0', color: b.status==='confirmed' ? 'var(--green)' : 'var(--danger)' }}>{b.status}</p>
                          </div>
                          <button onClick={() => handleCancelBooking(b.id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-ter)', padding:2, flexShrink:0 }}
                            onMouseEnter={e => (e.currentTarget.style.color='var(--danger)')}
                            onMouseLeave={e => (e.currentTarget.style.color='var(--text-ter)')}>
                            <X size={13}/>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
