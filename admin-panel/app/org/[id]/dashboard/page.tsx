'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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
    const todayQatar = new Date(now.getTime() + QATAR_OFFSET)
    const todayStr = todayQatar.toISOString().split('T')[0]

    const [enrollRes, sessRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/calendar-sessions?org_id=${id}`)
    ])

    const enrollData = enrollRes.ok ? await enrollRes.json() : []
    const sessData = Array.isArray(sessRes.ok ? await sessRes.json() : []) ? await (await fetch(`/api/calendar-sessions?org_id=${id}`)).json() : []

    const active = enrollData.filter((e: any) => e.status === 'active').length
    const completed = enrollData.filter((e: any) => e.status === 'completed').length
    const expiring = enrollData.filter((e: any) => e.status === 'active' && e.sessions_remaining !== null && e.sessions_remaining <= 2).length
    setStats({ active, expiring, completed })

    // Filter today's sessions
    const todayCalSessions = (Array.isArray(sessData) ? sessData : []).filter((s: any) => {
      const sessDate = new Date(new Date(s.start_time).getTime() + QATAR_OFFSET)
      return sessDate.toISOString().split('T')[0] === todayStr
    })

    // Get attendance for today's sessions
    const sessionsWithAtt = []
    for (const sess of todayCalSessions) {
      const attRes = await fetch(`/api/attendance?org_id=${id}`)
      const attData = attRes.ok ? await attRes.json() : []
      sessionsWithAtt.push({ ...sess, attendanceList: attData })
    }
    setTodaySessions(sessionsWithAtt)
    setLoading(false)
  }

  async function markAttendance(sessionId: string, customerId: string, enrollmentId: string, attended: boolean) {
    setSaving(true)
    const QATAR_OFFSET = 3 * 60 * 60 * 1000
    const todayStr = new Date(new Date().getTime() + QATAR_OFFSET).toISOString().split('T')[0]

    await fetch('/api/attendance', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enrollment_id: enrollmentId, session_date: todayStr, attended })
    })

    setMessage(attended ? 'Marked as attended!' : 'Marked as absent!')
    setTimeout(() => setMessage(''), 2000)
    loadAll()
    setSaving(false)
  }

  const QATAR_OFFSET = 3 * 60 * 60 * 1000

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">{message}</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.active}</p>
            <p className="text-xs text-gray-400 mt-1">Active Enrollments</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-amber-500">{stats.expiring}</p>
            <p className="text-xs text-gray-400 mt-1">Expiring Soon</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-400 mt-1">Completed</p>
          </div>
        </div>

        {/* Today's Sessions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-base font-bold text-gray-900 mb-4">Today's Sessions</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : todaySessions.length === 0 ? (
            <p className="text-sm text-gray-400">No sessions today</p>
          ) : (
            <div className="space-y-4">
              {todaySessions.map(session => {
                const startTime = new Date(new Date(session.start_time).getTime() + QATAR_OFFSET)
                return (
                  <div key={session.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{session.title}</p>
                        <p className="text-xs text-gray-400">
                          {startTime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{session.booked_count}/{session.capacity}</span>
                    </div>
                    <div className="space-y-2">
                      {(session.calendar_bookings || []).map((booking: any) => {
                        const attRecord = session.attendanceList?.find((a: any) => a.enrollment_id === booking.enrollment_id)
                        const isAttended = attRecord?.attended === true
                        const isAbsent = attRecord?.attended === false && attRecord
                        return (
                          <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                {booking.customers?.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <p className="text-sm text-gray-700">{booking.customers?.full_name}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => markAttendance(session.id, booking.customer_id, booking.enrollment_id, true)}
                                disabled={saving}
                                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${isAttended ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                                حضر
                              </button>
                              <button
                                onClick={() => markAttendance(session.id, booking.customer_id, booking.enrollment_id, false)}
                                disabled={saving}
                                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${isAbsent ? 'bg-red-600 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
                                غاب
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
