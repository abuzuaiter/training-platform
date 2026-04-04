'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrgDashboardPage() {
  const params = useParams()
  const id = params.id as string
  const [stats, setStats] = useState({ active: 0, expiring: 0, expired: 0 })
  const [todaySessions, setTodaySessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const todayStr = new Date().toISOString().split('T')[0]

    const [enrollRes, sessRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/calendar-sessions?org_id=${id}&from=${todayStr}T00:00:00&to=${todayStr}T23:59:59`)
    ])

    const enrollData = enrollRes.ok ? await enrollRes.json() : []
    const sessData = sessRes.ok ? await sessRes.json() : []

    const active = enrollData.filter((e: any) => e.status === 'active').length
    const expired = enrollData.filter((e: any) => e.status === 'completed' || e.status === 'cancelled').length
    const expiring = enrollData.filter((e: any) => e.status === 'active' && e.sessions_remaining !== null && e.sessions_remaining <= 2).length
    setStats({ active, expiring, expired })

    const sessionsWithAtt = []
    for (const sess of sessData) {
      const attRes = await fetch(`/api/attendance?session_id=${sess.id}`)
      const attData = attRes.ok ? await attRes.json() : []
      sessionsWithAtt.push({ ...sess, attendanceList: attData })
    }
    setTodaySessions(sessionsWithAtt)
    setLoading(false)
  }

  async function markAttendance(sessionId: string, customerId: string, enrollmentId: string, status: string) {
    setSaving(true)
    const session = todaySessions.find(s => s.id === sessionId)
    const existing = session?.attendanceList?.find((a: any) => a.customer_id === customerId)

    if (existing) {
      await fetch('/api/attendance', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance_records: [{ id: existing.id, status, enrollment_id: enrollmentId }] })
      })
    } else {
      const createRes = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, customer_id: customerId, organization_id: id, enrollment_id: enrollmentId || null })
      })
      if (createRes.ok) {
        const newAtt = await createRes.json()
        await fetch('/api/attendance', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendance_records: [{ id: newAtt.id, status, enrollment_id: enrollmentId }] })
        })
      }
    }

    setMessage('Attendance marked!')
    setTimeout(() => setMessage(''), 3000)
    loadAll()
    setSaving(false)
  }

  const QATAR_OFFSET = 3 * 60
  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return new Date(d.getTime() + QATAR_OFFSET * 60 * 1000).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  const statusColors: Record<string, string> = {
    attended: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-600',
    rescheduled: 'bg-amber-100 text-amber-700',
    pending: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">{message}</div>}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500 mt-1">Active Enrollments</p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-200 p-5 text-center">
            <p className="text-3xl font-bold text-amber-500">{stats.expiring}</p>
            <p className="text-xs text-gray-500 mt-1">Expiring Soon</p>
            <p className="text-xs text-amber-400 mt-0.5">2 sessions left</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-red-500">{stats.expired}</p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
        </div>

        <h2 className="text-base font-bold text-gray-900 mb-4">📅 Today's Sessions</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : todaySessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">No sessions today</div>
        ) : todaySessions.map(session => (
          <div key={session.id} className="bg-white rounded-2xl border border-gray-200 mb-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{session.title}</h3>
                <p className="text-xs text-gray-400">{formatTime(session.start_time)} — {formatTime(session.end_time)}</p>
              </div>
              <span className="text-sm text-gray-500 font-medium">{session.booked_count}/{session.capacity}</span>
            </div>

            {!session.calendar_bookings?.length ? (
              <div className="px-5 py-4 text-sm text-gray-400">No bookings yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {session.calendar_bookings.map((booking: any) => {
                  const attRecord = session.attendanceList?.find((a: any) => a.customer_id === booking.customer_id)
                  const currentStatus = attRecord?.status || 'pending'
                  return (
                    <div key={booking.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                          {booking.customers?.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{booking.customers?.full_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[currentStatus]}`}>{currentStatus}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => markAttendance(session.id, booking.customer_id, attRecord?.enrollment_id || '', 'attended')} disabled={saving}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${currentStatus === 'attended' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          ✓ حضر
                        </button>
                        <button onClick={() => markAttendance(session.id, booking.customer_id, attRecord?.enrollment_id || '', 'absent')} disabled={saving}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${currentStatus === 'absent' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                          ✗ غاب
                        </button>
                        <button onClick={() => markAttendance(session.id, booking.customer_id, attRecord?.enrollment_id || '', 'rescheduled')} disabled={saving}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${currentStatus === 'rescheduled' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                          ↻ تأجيل
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
