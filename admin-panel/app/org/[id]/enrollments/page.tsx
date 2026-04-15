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
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    customer_id: '', package_id: '', session_id: '',
    start_date: '', payment_status: 'pending'
  })

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [enrRes, custRes, pkgRes, sessRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/packages?org_id=${id}`),
      fetch(`/api/session-templates?org_id=${id}`)
    ])
    setEnrollments(enrRes.ok ? await enrRes.json() : [])
    setCustomers(custRes.ok ? await custRes.json() : [])
    setPackages(pkgRes.ok ? await pkgRes.json() : [])
    setSessions(sessRes.ok ? await sessRes.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.customer_id || !form.package_id || !form.session_id || !form.start_date) {
      setMessage('All fields are required'); return
    }

    // Check capacity
    const pkg = packages.find(p => p.id === form.package_id)
    if (pkg?.capacity) {
      const enrolled = enrollments.filter(e => e.package_id === form.package_id && e.status === 'active').length
      if (enrolled >= pkg.capacity) {
        setMessage(`Package is full! Max capacity: ${pkg.capacity}`); return
      }
    }

    setSaving(true)
    const res = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: form.customer_id,
        package_id: form.package_id,
        session_id: form.session_id,
        organization_id: id,
        start_date: form.start_date,
        payment_status: form.payment_status,
        paid_at: form.payment_status === 'paid' ? new Date().toISOString() : null,
        sessions_remaining: pkg?.sessions_count || pkg?.total_sessions || 0,
        sessions_attended: 0,
        status: 'active'
      })
    })

    if (res.ok) {
      const newEnrollment = await res.json()
      // Generate calendar sessions
      await generateSessions(form.session_id, form.customer_id, newEnrollment.id, form.start_date, pkg)
      setMessage('Enrollment created!')
      setShowForm(false)
      setForm({ customer_id: '', package_id: '', session_id: '', start_date: '', payment_status: 'pending' })
      loadAll()
    } else {
      const d = await res.json()
      setMessage(d.error || 'Error')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 4000)
  }

  async function generateSessions(sessionId: string, customerId: string, enrollmentId: string, startDate: string, pkg: any) {
    const template = sessions.find(s => s.id === sessionId)
    if (!template || !pkg) return

    const totalSessions = pkg.sessions_count || pkg.total_sessions || 0
    if (totalSessions === 0) return

    const QATAR_OFFSET = 3 * 60 * 60 * 1000
    const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const [sh, sm] = template.start_time.slice(0,5).split(':').map(Number)
    const [eh, em] = template.end_time.slice(0,5).split(':').map(Number)
    const selectedDayNums = (template.recurrence_days || []).map((d: string) => dayOrder.indexOf(d)).sort((a: number, b: number) => a - b)

    // Parse date in local time to avoid UTC offset issue
    const [year, month, day] = startDate.split('-').map(Number)
    let current = new Date(year, month - 1, day)
    let count = 0

    while (count < totalSessions) {
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
          })
        })
        if (sessRes.ok) {
          const sess = await sessRes.json()
          await fetch('/api/calendar-bookings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sess.id, customer_id: customerId, organization_id: id, enrollment_id: enrollmentId })
          })
          count++
        } else {
          const errData = await sessRes.json()
          console.error('Session creation failed:', errData)
          break
        }
      }
      current.setDate(current.getDate() + 1)
      if (current > new Date(new Date(startDate).getTime() + 365 * 24 * 60 * 60 * 1000)) break
    }
  }

  async function handleCancel(enrollId: string) {
    if (!confirm('Cancel this enrollment?')) return
    await fetch(`/api/enrollments/${enrollId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
    loadAll()
  }

  async function markPaid(enrollId: string) {
    await fetch(`/api/enrollments/${enrollId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid', paid_at: new Date().toISOString() })
    })
    loadAll()
  }

  function getDayLabels(days: string[]) {
    return days?.map(d => DAY_NAMES.find(n => n.key === d)?.label).filter(Boolean).join('، ')
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    completed: 'bg-blue-50 text-blue-600',
    cancelled: 'bg-red-50 text-red-500',
  }

  const selectedPkg = packages.find(p => p.id === form.package_id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Enrollments</h1>
          <p className="text-xs text-gray-400">{enrollments.filter(e => e.status === 'active').length} active</p>
        </div>
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
            <h2 className="text-base font-bold text-gray-900 mb-4">New Enrollment</h2>
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
                    <option key={p.id} value={p.id}>{p.name} — {p.price} QAR ({p.total_sessions || p.sessions_count} حصة)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">SESSION *</label>
                <select value={form.session_id} onChange={e => setForm({...form, session_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">Select session...</option>
                  {sessions.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {s.start_time?.slice(0,5)}-{s.end_time?.slice(0,5)} ({getDayLabels(s.recurrence_days)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE *</label>
                <input value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PAYMENT STATUS</label>
                <select value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              {selectedPkg && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Package Info</p>
                  <p className="text-xs text-blue-600">{selectedPkg.total_sessions || selectedPkg.sessions_count} sessions</p>
                  {selectedPkg.capacity && <p className="text-xs text-blue-600">Max: {selectedPkg.capacity} students</p>}
                  <p className="text-xs text-blue-600">Absence: {selectedPkg.absence_policy === 'deduct' ? 'Deduct' : 'Postpone'}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? 'Creating...' : 'Create Enrollment'}
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
            <p className="text-gray-500 font-medium">No enrollments yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {enrollments.map(enr => {
              const total = enr.packages?.total_sessions || enr.packages?.sessions_count || 0
              const attended = enr.sessions_attended || 0
              const remaining = enr.sessions_remaining ?? (total - attended)
              const pkg = packages.find(p => p.id === enr.package_id)
              return (
                <div key={enr.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm">
                        {enr.customers?.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{enr.customers?.full_name}</p>
                        <p className="text-xs text-gray-400">{enr.packages?.name} — {enr.packages?.price} QAR</p>
                        {enr.session_templates && (
                          <p className="text-xs text-gray-400">{enr.session_templates?.title} — {getDayLabels(enr.session_templates?.recurrence_days)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enr.status]}`}>{enr.status}</span>
                        <div className="mt-1">
                          <span className={`text-xs font-semibold ${remaining <= 2 ? 'text-amber-500' : 'text-gray-600'}`}>
                            {attended}/{total} حصة
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 inline-block ${enr.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                          {enr.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {enr.payment_status !== 'paid' && enr.status === 'active' && (
                          <button onClick={() => markPaid(enr.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition">
                            Mark Paid
                          </button>
                        )}
                        {enr.status === 'active' && (
                          <button onClick={() => handleCancel(enr.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
