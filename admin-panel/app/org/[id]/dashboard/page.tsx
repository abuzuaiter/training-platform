'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Users, TrendingDown, CheckCircle, Clock, Check, X } from 'lucide-react'

export default function OrgDashboardPage() {
  const params = useParams()
  const id = params.id as string
  const [stats, setStats] = useState({ active: 0, expiring: 0, completed: 0 })
  const [todaySessions, setTodaySessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const QATAR_OFFSET = 3 * 60 * 60 * 1000
    const now = new Date()
    const todayStr = new Date(now.getTime() + QATAR_OFFSET).toISOString().split('T')[0]

    const [enrollRes, sessRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/calendar-sessions?org_id=${id}`)
    ])

    const enrollData = enrollRes.ok ? await enrollRes.json() : []
    const sessData = sessRes.ok ? await sessRes.json() : []

    setStats({
      active:    enrollData.filter((e: any) => e.status === 'active').length,
      completed: enrollData.filter((e: any) => e.status === 'completed').length,
      expiring:  enrollData.filter((e: any) => e.status === 'active' && e.sessions_remaining !== null && e.sessions_remaining <= 2).length,
    })

    const todayCalSessions = (Array.isArray(sessData) ? sessData : []).filter((s: any) => {
      const sessDate = new Date(new Date(s.start_time).getTime() + QATAR_OFFSET)
      return sessDate.toISOString().split('T')[0] === todayStr
    })

    const attRes = await fetch(`/api/attendance?org_id=${id}`)
    const attData = attRes.ok ? await attRes.json() : []
    setTodaySessions(todayCalSessions.map((s: any) => ({ ...s, attendanceList: attData })))
    setLoading(false)
  }

  async function markAttendance(sessionId: string, customerId: string, enrollmentId: string, attended: boolean) {
    setSaving(true)
    const todayStr = new Date(new Date().getTime() + 3 * 60 * 60 * 1000).toISOString().split('T')[0]
    await fetch('/api/attendance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId, session_date: todayStr, attended })
    })
    setMessage(attended ? 'Marked as attended' : 'Marked as absent')
    setTimeout(() => setMessage(''), 2500)
    loadAll()
    setSaving(false)
  }

  const QATAR_OFFSET = 3 * 60 * 60 * 1000

  const statCards = [
    { label: 'Active Enrollments', value: stats.active,    icon: Users,        color: 'var(--primary)',  bg: 'var(--primary-dim)' },
    { label: 'Expiring Soon',      value: stats.expiring,  icon: TrendingDown, color: 'var(--warn)',     bg: 'var(--warn-dim)' },
    { label: 'Completed',          value: stats.completed, icon: CheckCircle,  color: 'var(--green)',    bg: 'var(--green-dim)' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
          {message}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-ter)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Sessions */}
      <div className="rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--divider)' }}>
          <div className="flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--primary)' }} />
            <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Today's Sessions</h2>
            {todaySessions.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                {todaySessions.length}
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="text-center py-8" style={{ color: 'var(--text-ter)' }}>Loading...</div>
          ) : todaySessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={32} className="mx-auto mb-2" style={{ color: 'var(--border)' }} />
              <p className="text-sm" style={{ color: 'var(--text-ter)' }}>No sessions today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todaySessions.map(session => {
                const startTime = new Date(new Date(session.start_time).getTime() + QATAR_OFFSET)
                return (
                  <div key={session.id} className="rounded-xl p-4"
                    style={{ border: '1px solid var(--divider)', background: 'var(--bg)' }}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{session.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-ter)' }}>
                          {startTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                        {session.booked_count}/{session.capacity}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(session.calendar_bookings || []).map((booking: any) => {
                        const attRecord = session.attendanceList?.find((a: any) => a.enrollment_id === booking.enrollment_id)
                        const isAttended = attRecord?.attended === true
                        const isAbsent   = attRecord?.attended === false && attRecord
                        const initial = booking.customers?.full_name?.charAt(0)?.toUpperCase() || '?'
                        return (
                          <div key={booking.id} className="flex items-center justify-between py-2"
                            style={{ borderBottom: '1px solid var(--divider)' }}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                                {initial}
                              </div>
                              <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                                {booking.customers?.full_name}
                              </p>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => markAttendance(session.id, booking.customer_id, booking.enrollment_id, true)}
                                disabled={saving}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                                style={{
                                  background: isAttended ? 'var(--green)' : 'var(--green-dim)',
                                  color: isAttended ? '#fff' : 'var(--green)',
                                }}>
                                <Check size={12} />حضر
                              </button>
                              <button onClick={() => markAttendance(session.id, booking.customer_id, booking.enrollment_id, false)}
                                disabled={saving}
                                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                                style={{
                                  background: isAbsent ? 'var(--danger)' : 'var(--danger-dim)',
                                  color: isAbsent ? '#fff' : 'var(--danger)',
                                }}>
                                <X size={12} />غاب
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
