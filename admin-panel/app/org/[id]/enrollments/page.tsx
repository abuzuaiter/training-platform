'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ClipboardList, Plus, Check, Filter, ChevronDown, X, RefreshCw } from 'lucide-react'

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 12,
  padding: '8px 12px', fontSize: 14, background: 'var(--bg)',
  color: 'var(--ink)', outline: 'none',
}
const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-ter)', marginBottom: 4, letterSpacing: '0.5px' }}>
    {children}
  </p>
)

const DAY_NAMES: Record<string, string> = {
  sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت'
}
const DAY_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

export default function OrgEnrollmentsPage() {
  const params = useParams()
  const id = params.id as string

  const [enrollments, setEnrollments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')
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

  async function syncBookings() {
    setSyncing(true)
    const res = await fetch('/api/enrollments/sync-bookings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id: id })
    })
    const data = await res.json()
    showMsg(data.message || 'Sync complete', res.ok ? 'ok' : 'err')
    setSyncing(false)
  }

  function showMsg(text: string, type: 'ok' | 'err' = 'ok') {
    setMessage(text); setMsgType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  async function handleCreate() {
    const pkg = packages.find(p => p.id === form.package_id)
    const isDuration = pkg?.type === 'duration'

    if (!form.customer_id || !form.package_id || !form.start_date) {
      showMsg('Customer, package and start date are required', 'err'); return
    }
    if (!isDuration && !form.session_id) {
      showMsg('Please select a session', 'err'); return
    }
    if (!pkg) { showMsg('Package not found', 'err'); return }

    const totalSessions = isDuration ? 0 : (pkg?.sessions_count || 0)
    if (!isDuration && totalSessions === 0) {
      showMsg('Package has 0 sessions — please edit the package and add session count', 'err'); return
    }
    if (pkg.capacity) {
      const enrolled = enrollments.filter(e => e.package_id === form.package_id && e.status === 'active').length
      if (enrolled >= pkg.capacity) { showMsg(`Package is full! Max: ${pkg.capacity}`, 'err'); return }
    }

    // Calculate end_date for duration packages
    let endDate: string | null = null
    if (isDuration && pkg.duration_days && form.start_date) {
      const d = new Date(form.start_date)
      d.setDate(d.getDate() + pkg.duration_days)
      endDate = d.toISOString().split('T')[0]
    }

    setSaving(true)
    const enrRes = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: form.customer_id,
        package_id: form.package_id,
        session_id: isDuration ? null : form.session_id,
        organization_id: id,
        start_date: form.start_date,
        end_date: endDate,
        payment_status: form.payment_status,
        paid_at: form.payment_status === 'paid' ? new Date().toISOString() : null,
        sessions_remaining: isDuration ? null : totalSessions,
        sessions_attended: 0,
        status: 'active'
      })
    })
    if (!enrRes.ok) {
      const d = await enrRes.json(); showMsg(d.error || 'Error creating enrollment', 'err'); setSaving(false); return
    }
    const newEnrollment = await enrRes.json()

    // Generate calendar sessions only for session-based packages
    if (!isDuration) {
      const template = sessions.find(s => s.id === form.session_id)
      if (template && totalSessions > 0) {
        const QATAR_OFFSET = 3 * 60 * 60 * 1000
        const [sh, sm] = template.start_time.slice(0,5).split(':').map(Number)
        const [eh, em] = template.end_time.slice(0,5).split(':').map(Number)
        const selectedDayNums = (template.recurrence_days || []).map((d: string) => DAY_ORDER.indexOf(d)).filter((n: number) => n >= 0).sort((a: number, b: number) => a - b)
        const [year, month, day] = form.start_date.split('-').map(Number)

        // Fetch existing sessions once to avoid creating duplicates
        const existingRes = await fetch(`/api/calendar-sessions?org_id=${id}`)
        const existingSessions: any[] = existingRes.ok ? await existingRes.json() : []

        let current = new Date(year, month - 1, day)
        let count = 0, attempts = 0
        while (count < totalSessions && attempts < 365) {
          attempts++
          if (selectedDayNums.includes(current.getDay())) {
            const startDt  = new Date(current.getFullYear(), current.getMonth(), current.getDate(), sh, sm, 0)
            const endDt    = new Date(current.getFullYear(), current.getMonth(), current.getDate(), eh, em, 0)
            const startUTC = new Date(startDt.getTime() - QATAR_OFFSET).toISOString()
            const endUTC   = new Date(endDt.getTime()   - QATAR_OFFSET).toISOString()

            // Reuse existing session if one already exists at this exact time + title
            const existing = existingSessions.find(s =>
              s.title === template.title &&
              s.start_time === startUTC &&
              s.organization_id === id
            )

            let sessionId: string | null = existing?.id || null

            if (!sessionId) {
              const sessRes = await fetch('/api/calendar-sessions', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organization_id: id, title: template.title, start_time: startUTC, end_time: endUTC, capacity: template.capacity || 10 })
              })
              if (sessRes.ok) {
                const sess = await sessRes.json()
                sessionId = sess.id
                existingSessions.push(sess) // keep local list up to date
              }
            }

            if (sessionId) {
              // Only book if customer not already booked in this session
              const alreadyBooked = existingSessions
                .find((s: any) => s.id === sessionId)
                ?.calendar_bookings?.some((b: any) => b.customer_id === form.customer_id)

              if (!alreadyBooked) {
                await fetch('/api/calendar-bookings', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ session_id: sessionId, customer_id: form.customer_id, organization_id: id, enrollment_id: newEnrollment.id })
                })
              }
              count++
            }
          }
          current.setDate(current.getDate() + 1)
        }
      }
    }

    await fetch('/api/org-invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organization_id: id, enrollment_id: newEnrollment.id, customer_id: form.customer_id, amount: pkg?.price || 0 })
    })

    showMsg(isDuration
      ? `Enrollment created! Valid until ${endDate}.`
      : `Enrollment created! ${totalSessions} sessions generated.`
    )
    setShowForm(false)
    setForm({ customer_id: '', package_id: '', session_id: '', start_date: '', payment_status: 'pending' })
    setSaving(false)
    loadAll()
  }

  async function handleCancel(enrollId: string) {
    if (!confirm('Cancel this enrollment?')) return
    await fetch(`/api/enrollments/${enrollId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
    loadAll()
  }

  async function markPaid(enrollId: string) {
    await fetch(`/api/enrollments/${enrollId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_status: 'paid', paid_at: new Date().toISOString() }) })
    loadAll()
  }

  // ── Filters ───────────────────────────────────────────────────────
  const [filterCustomer, setFilterCustomer] = useState<string>('')
  const [filterPackage,  setFilterPackage]  = useState<string>('')
  const [filterStatus,   setFilterStatus]   = useState<string>('')
  const [filterPayment,  setFilterPayment]  = useState<string>('')

  const filteredEnrollments = enrollments.filter(e => {
    if (filterCustomer && e.customer_id !== filterCustomer)             return false
    if (filterPackage  && e.package_id  !== filterPackage)             return false
    if (filterStatus   && e.status      !== filterStatus)              return false
    if (filterPayment  && e.payment_status !== filterPayment)          return false
    return true
  })
  const activeFilters = [filterCustomer, filterPackage, filterStatus, filterPayment].filter(Boolean).length
  function clearFilters() { setFilterCustomer(''); setFilterPackage(''); setFilterStatus(''); setFilterPayment('') }

  const selectedPkg  = packages.find(p => p.id === form.package_id)
  const selectedSess = sessions.find(s => s.id === form.session_id)
  const isDurationPkg = selectedPkg?.type === 'duration'

  function calcEndDate() {
    if (!isDurationPkg || !selectedPkg?.duration_days || !form.start_date) return null
    const d = new Date(form.start_date)
    d.setDate(d.getDate() + selectedPkg.duration_days)
    return d.toISOString().split('T')[0]
  }
  const endDatePreview = calcEndDate()
  const activeCount = enrollments.filter(e => e.status === 'active').length

  const statusStyle = (status: string) => {
    if (status === 'active')    return { background: 'var(--green-dim)',   color: 'var(--green)' }
    if (status === 'completed') return { background: 'var(--primary-dim)', color: 'var(--primary)' }
    return { background: 'var(--danger-dim)', color: 'var(--danger)' }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Enrollments</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>{activeCount} active</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncBookings} disabled={syncing}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-sec)', cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? 0.7 : 1 }}
            title="Add all enrolled customers to their calendar sessions">
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing…' : 'Sync Calendar'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: 'var(--primary)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            <Plus size={15} /> New Enrollment
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{
          background: msgType === 'ok' ? 'var(--green-dim)' : 'var(--danger-dim)',
          color: msgType === 'ok' ? 'var(--green)' : 'var(--danger)',
        }}>{message}</div>
      )}

      {/* New Enrollment Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--ink)' }}>New Enrollment</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CUSTOMER *</Label>
              <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <Label>PACKAGE *</Label>
              <select value={form.package_id} onChange={e => setForm({...form, package_id: e.target.value})} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select package...</option>
                {packages.filter(p => p.is_active).map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.sessions_count} sessions — {p.price} QAR</option>
                ))}
              </select>
            </div>
            {!isDurationPkg && (
              <div>
                <Label>SESSION *</Label>
                <select value={form.session_id} onChange={e => setForm({...form, session_id: e.target.value})} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Select session...</option>
                  {sessions.filter(s => s.is_active).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title} — {s.start_time?.slice(0,5)}-{s.end_time?.slice(0,5)} ({(s.recurrence_days || []).map((d: string) => DAY_NAMES[d]).join('، ')})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <Label>START DATE *</Label>
              <input value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} style={inp} type="date" />
            </div>
            <div>
              <Label>PAYMENT</Label>
              <select value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})} style={{ ...inp, cursor: 'pointer' }}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {/* Summary box */}
            {isDurationPkg && selectedPkg && form.start_date && (
              <div className="rounded-xl p-3" style={{ background: 'var(--teal-dim)', gridColumn: '1 / -1' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--teal)' }}>Duration Package — No sessions generated</p>
                <p className="text-xs" style={{ color: 'var(--teal)' }}>
                  Access period: {form.start_date} → {endDatePreview || '—'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--teal)' }}>
                  Duration: {selectedPkg.duration_days} days
                </p>
              </div>
            )}
            {!isDurationPkg && selectedPkg && selectedSess && (
              <div className="rounded-xl p-3" style={{ background: 'var(--primary-dim)', gridColumn: '1 / -1' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--primary)' }}>Summary</p>
                <p className="text-xs" style={{ color: 'var(--primary)' }}>{selectedPkg.sessions_count} sessions will be generated</p>
                <p className="text-xs" style={{ color: 'var(--primary)' }}>Days: {(selectedSess.recurrence_days || []).map((d: string) => DAY_NAMES[d]).join('، ')}</p>
                <p className="text-xs" style={{ color: 'var(--primary)' }}>Time: {selectedSess.start_time?.slice(0,5)} — {selectedSess.end_time?.slice(0,5)}</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} disabled={saving}
              className="text-sm font-semibold px-5 py-2 rounded-xl text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}>
              {saving ? 'Creating sessions...' : 'Create Enrollment'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-sm font-semibold px-5 py-2 rounded-xl"
              style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--bg)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      {!loading && enrollments.length > 0 && (() => {
        const sel = (active: boolean): React.CSSProperties => ({
          appearance: 'none' as any, WebkitAppearance: 'none',
          border: active ? '1.5px solid var(--primary)' : '1px solid var(--border)',
          borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: 12, fontWeight: 600,
          background: active ? 'var(--primary-dim)' : 'var(--surface)',
          color: active ? 'var(--primary)' : 'var(--text-sec)',
          cursor: 'pointer', outline: 'none',
        })
        const chevron: React.CSSProperties = { position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' as any }
        const dropWrap: React.CSSProperties = { position: 'relative' }
        return (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: activeFilters > 0 ? 'var(--primary)' : 'var(--text-ter)' }}>
              <Filter size={13} />
              <span>{activeFilters > 0 ? `${activeFilters} filter${activeFilters > 1 ? 's' : ''} active` : 'Filter by'}</span>
            </div>

            {/* Customer */}
            <div style={dropWrap}>
              <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)} style={{ ...sel(!!filterCustomer), minWidth: 150 }}>
                <option value="">All Customers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
              <ChevronDown size={12} style={{ ...chevron, color: filterCustomer ? 'var(--primary)' : 'var(--text-ter)' }} />
            </div>

            {/* Package */}
            <div style={dropWrap}>
              <select value={filterPackage} onChange={e => setFilterPackage(e.target.value)} style={{ ...sel(!!filterPackage), minWidth: 150 }}>
                <option value="">All Packages</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={12} style={{ ...chevron, color: filterPackage ? 'var(--primary)' : 'var(--text-ter)' }} />
            </div>

            {/* Status */}
            <div style={dropWrap}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...sel(!!filterStatus), minWidth: 120 }}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown size={12} style={{ ...chevron, color: filterStatus ? 'var(--primary)' : 'var(--text-ter)' }} />
            </div>

            {/* Payment */}
            <div style={dropWrap}>
              <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)} style={{ ...sel(!!filterPayment), minWidth: 120 }}>
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown size={12} style={{ ...chevron, color: filterPayment ? 'var(--primary)' : 'var(--text-ter)' }} />
            </div>

            {activeFilters > 0 && (
              <button onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                <X size={11} /> Clear
              </button>
            )}
          </div>
        )
      })()}

      {/* List */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-ter)' }}>Loading...</div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-20">
          <ClipboardList size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-ter)' }}>No enrollments yet</p>
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="text-center py-20">
          <Filter size={32} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-ter)' }}>No enrollments match the current filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEnrollments.map(enr => {
            const total = enr.packages?.sessions_count || 0
            const attended = enr.sessions_attended || 0
            const remaining = enr.sessions_remaining ?? (total - attended)
            const custProfile = customers.find((c: any) => c.id === enr.customer_id)
            const initial = enr.customers?.full_name?.charAt(0)?.toUpperCase() || '?'
            return (
              <div key={enr.id} className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                    {custProfile?.avatar_url
                      ? <img src={custProfile.avatar_url} alt={enr.customers?.full_name} className="w-full h-full object-cover" />
                      : initial}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{enr.customers?.full_name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-ter)' }}>
                      {enr.packages?.name} — {enr.packages?.price} QAR
                    </p>
                    <div className="flex gap-2 mt-1 items-center flex-wrap">
                      {enr.packages?.type === 'duration' ? (
                        <span className="text-xs font-semibold" style={{ color: 'var(--teal)' }}>
                          {enr.end_date ? `Until ${enr.end_date}` : 'Duration'}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: remaining <= 2 ? 'var(--warn)' : 'var(--text-sec)' }}>
                          {attended}/{total} sessions
                        </span>
                      )}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                        background: enr.payment_status === 'paid' ? 'var(--green-dim)' : 'var(--warn-dim)',
                        color: enr.payment_status === 'paid' ? 'var(--green)' : 'var(--warn)',
                      }}>
                        {enr.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={statusStyle(enr.status)}>
                        {enr.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {enr.payment_status !== 'paid' && enr.status === 'active' && (
                    <button onClick={() => markPaid(enr.id)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                      <Check size={11} /> Mark Paid
                    </button>
                  )}
                  {enr.status === 'active' && (
                    <button onClick={() => handleCancel(enr.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
