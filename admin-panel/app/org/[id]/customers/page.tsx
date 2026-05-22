'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Users, Search, Plus, Download, Upload, FileText, X, Edit2, Trash2, UserCheck } from 'lucide-react'

const inp = {
  width: '100%', border: '1px solid var(--border)', borderRadius: '10px',
  padding: '8px 12px', fontSize: '13px', color: 'var(--ink)',
  background: 'var(--surface)', outline: 'none',
} as React.CSSProperties

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-ter)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
    {children}
  </label>
)

export default function OrgCustomersPage() {
  const params = useParams()
  const id = params.id as string
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [editCustomer, setEditCustomer] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [editSaving, setEditSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    date_of_birth: '', gender: '',
    has_guardian: false, guardian_name: '', guardian_email: '', guardian_mobile: '',
    notes: ''
  })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const [custRes, enrRes] = await Promise.all([
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/enrollments?org_id=${id}`)
    ])
    setCustomers(custRes.ok ? await custRes.json() : [])
    setEnrollments(enrRes.ok ? await enrRes.json() : [])
    setLoading(false)
  }

  function getAge(dob: string) {
    if (!dob) return null
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  }

  function getEnrollment(customerId: string) {
    return enrollments.find(e => e.customer_id === customerId && e.status === 'active')
  }

  function notify(msg: string, ok = true) {
    setMessage(msg); setMsgOk(ok)
    setTimeout(() => setMessage(''), 4000)
  }

  async function handleSubmit() {
    if (!form.full_name) { notify('Full name is required', false); return }
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}/customers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      notify('Customer added!')
      setShowForm(false)
      setForm({ full_name: '', email: '', mobile: '', date_of_birth: '', gender: '', has_guardian: false, guardian_name: '', guardian_email: '', guardian_mobile: '', notes: '' })
      load()
    } else { notify(data.error || 'Error', false) }
    setSaving(false)
  }

  async function handleEdit() {
    setEditSaving(true)
    await fetch(`/api/organizations/${id}/customers/${editCustomer.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
    setEditCustomer(null); setEditSaving(false); load()
  }

  async function handleDelete(customerId: string) {
    if (!confirm('Delete this customer?')) return
    await fetch(`/api/organizations/${id}/customers/${customerId}`, { method: 'DELETE' })
    load()
  }

  function exportCSV() {
    const headers = ['customer_code','full_name','mobile','email','gender','date_of_birth','has_guardian','guardian_name','guardian_email','guardian_mobile','notes']
    const rows = customers.map(c => headers.map(h => `"${(c[h] ?? '').toString().replace(/"/g, '')}"`).join(','))
    const csv = ['\uFEFFsep=,', headers.join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'customers.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `\uFEFFsep=,
full_name,mobile,email,gender,date_of_birth,has_guardian,guardian_name,guardian_email,guardian_mobile,notes,package_name,session_title,start_date,payment_status
Ahmed Ali,+97412345678,ahmed@email.com,male,1990-01-15,false,,,,,"Beginners Swimming - 8 Sessions",Swimming Beginners,2026-06-01,pending
Sara Mohammed,+97487654321,,female,2015-06-20,true,Fatima Mohammed,fatima@email.com,+97498765432,Allergic to peanuts,"Beginners Swimming - 8 Sessions",Swimming Beginners,2026-06-01,paid
Khalid Nasser,+97455512345,,male,,false,,,,,,,, `
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'customers-template.csv'; a.click()
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => { const t = l.trim(); return t && !t.startsWith('#') && !t.toLowerCase().startsWith('sep=') })
    if (lines.length < 2) { alert('No data rows found'); e.target.value = ''; return }
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

    // Pre-load packages & sessions once if any row needs enrollment
    const dataLines = lines.slice(1)
    const pkgIdx  = headers.indexOf('package_name')
    const needsEnrollment = pkgIdx >= 0 && dataLines.some(l => {
      const vals = l.split(','); return (vals[pkgIdx] || '').replace(/"/g, '').trim() !== ''
    })
    let allPackages: any[] = [], allSessions: any[] = []
    if (needsEnrollment) {
      const [pkgRes, sessRes] = await Promise.all([
        fetch(`/api/packages?org_id=${id}`),
        fetch(`/api/session-templates?org_id=${id}`)
      ])
      allPackages = pkgRes.ok ? await pkgRes.json() : []
      allSessions = sessRes.ok ? await sessRes.json() : []
    }

    const ENROLLMENT_KEYS = ['package_name','session_title','start_date','payment_status']
    const DAY_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const QATAR_OFFSET = 3 * 60 * 60 * 1000
    let custOk = 0, custFail = 0, enrOk = 0

    for (let i = 0; i < dataLines.length; i++) {
      const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      if (!row.full_name) { custFail++; continue }
      if (row.has_guardian) row.has_guardian = row.has_guardian === 'true'

      // Build customer payload — exclude enrollment-only fields
      const custPayload: any = { organization_id: id }
      for (const key of headers) {
        if (!ENROLLMENT_KEYS.includes(key)) custPayload[key] = row[key]
      }

      const custRes = await fetch(`/api/organizations/${id}/customers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custPayload)
      })
      if (!custRes.ok) { custFail++; continue }
      custOk++
      const newCustomer = await custRes.json()

      // Create enrollment if all 3 fields are present
      const pkgName   = row.package_name?.trim()
      const sessTitle = row.session_title?.trim()
      const startDate = row.start_date?.trim()
      if (!pkgName || !sessTitle || !startDate) continue

      const pkg  = allPackages.find((p: any) => p.name.trim().toLowerCase() === pkgName.toLowerCase() && p.is_active)
      const sess = allSessions.find((s: any) => s.title.trim().toLowerCase() === sessTitle.toLowerCase() && s.is_active)
      if (!pkg || !sess) continue

      const totalSessions = pkg.sessions_count || 0
      if (totalSessions === 0) continue

      const enrRes = await fetch('/api/enrollments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: newCustomer.id, package_id: pkg.id, session_id: sess.id,
          organization_id: id, start_date: startDate,
          payment_status: row.payment_status || 'pending',
          paid_at: row.payment_status === 'paid' ? new Date().toISOString() : null,
          sessions_remaining: totalSessions, sessions_attended: 0, status: 'active'
        })
      })
      if (!enrRes.ok) continue
      const newEnrollment = await enrRes.json()
      enrOk++

      // Generate calendar sessions + bookings
      const [sh, sm] = sess.start_time.slice(0,5).split(':').map(Number)
      const [eh, em] = sess.end_time.slice(0,5).split(':').map(Number)
      const dayNums = (sess.recurrence_days || [])
        .map((d: string) => DAY_ORDER.indexOf(d))
        .filter((n: number) => n >= 0)
        .sort((a: number, b: number) => a - b)
      const [yr, mo, dy] = startDate.split('-').map(Number)
      let cur = new Date(yr, mo - 1, dy), count = 0, attempts = 0
      while (count < totalSessions && attempts < 365) {
        attempts++
        if (dayNums.includes(cur.getDay())) {
          const s = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), sh, sm, 0)
          const en = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), eh, em, 0)
          const calRes = await fetch('/api/calendar-sessions', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organization_id: id, title: sess.title,
              start_time: new Date(s.getTime() - QATAR_OFFSET).toISOString(),
              end_time:   new Date(en.getTime() - QATAR_OFFSET).toISOString(),
              capacity: sess.capacity || 10
            })
          })
          if (calRes.ok) {
            const calSess = await calRes.json()
            await fetch('/api/calendar-bookings', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ session_id: calSess.id, customer_id: newCustomer.id, organization_id: id, enrollment_id: newEnrollment.id })
            })
            count++
          }
        }
        cur.setDate(cur.getDate() + 1)
      }

      // Auto-create invoice
      await fetch('/api/org-invoices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: id, enrollment_id: newEnrollment.id, customer_id: newCustomer.id, amount: pkg.price || 0 })
      })
    }

    const msg = [`✅ Customers added: ${custOk}`, `❌ Failed: ${custFail}`]
    if (enrOk > 0) msg.push(`📋 Enrollments created: ${enrOk}`)
    alert(msg.join('\n'))
    e.target.value = ''; load()
  }

  const filtered = customers.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search) ||
    c.customer_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Customers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>{customers.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <FileText size={14} />Template
          </button>
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <Upload size={14} />Import
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <Download size={14} />Export
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: 'var(--primary)' }}>
            <Plus size={15} />Add Customer
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: msgOk ? 'var(--green-dim)' : 'var(--danger-dim)', color: msgOk ? 'var(--green)' : 'var(--danger)' }}>
          {message}
        </div>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>New Customer</h2>
            <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-ter)' }}><X size={18} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Full Name *</Label><input style={inp} value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} /></div>
            <div><Label>Mobile</Label><input style={inp} value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} /></div>
            <div><Label>Email</Label><input style={inp} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><Label>Gender</Label>
              <select style={inp} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div><Label>Date of Birth</Label><input style={inp} type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} /></div>
            <div><Label>Notes</Label><input style={inp} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input type="checkbox" checked={form.has_guardian} onChange={e => setForm({...form, has_guardian: e.target.checked})} className="w-4 h-4" style={{ accentColor: 'var(--primary)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Has Guardian</span>
              </label>
              {form.has_guardian && (
                <div className="grid grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: 'var(--primary-dim)' }}>
                  <div><Label>Guardian Name</Label><input style={inp} value={form.guardian_name} onChange={e => setForm({...form, guardian_name: e.target.value})} /></div>
                  <div><Label>Guardian Email</Label><input style={inp} value={form.guardian_email} onChange={e => setForm({...form, guardian_email: e.target.value})} /></div>
                  <div><Label>Guardian Mobile</Label><input style={inp} value={form.guardian_mobile} onChange={e => setForm({...form, guardian_mobile: e.target.value})} /></div>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}>{saving ? 'Saving...' : 'Add Customer'}</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 rounded-xl text-sm font-semibold"
              style={{ border: '1px solid var(--border)', color: 'var(--text-sec)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-ter)' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, mobile, code..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm" style={{ ...inp, border: '1px solid var(--border)' }} />
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-ter)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p style={{ color: 'var(--text-ter)' }}>No customers found</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--divider)', background: 'var(--bg)' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-ter)' }}>CUSTOMER</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-ter)' }}>CONTACT</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-ter)' }}>ENROLLMENT</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-ter)' }}>SESSIONS</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const enr = getEnrollment(c.id)
                const age = getAge(c.date_of_birth)
                const total = enr?.packages?.sessions_count || 0
                const remaining = enr?.sessions_remaining ?? 0
                const initial = c.full_name?.charAt(0)?.toUpperCase() || '?'
                return (
                  <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                          style={{ background: 'var(--primary-dim)' }}>
                          {c.avatar_url
                            ? <img src={c.avatar_url} alt={c.full_name} className="w-full h-full object-cover" />
                            : <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{initial}</span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{c.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {age !== null && <span className="text-xs" style={{ color: 'var(--text-ter)' }}>{age} yrs</span>}
                            {c.gender && <span className="text-xs" style={{ color: 'var(--text-ter)' }}>{c.gender === 'male' ? '♂' : '♀'}</span>}
                            {c.has_guardian && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#EDE9FE', color: '#7C3AED' }}>Guardian</span>}
                            <span className="text-xs" style={{ color: 'var(--border)' }}>{c.customer_code}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {c.mobile && <p className="text-xs" style={{ color: 'var(--text-sec)' }}>{c.mobile}</p>}
                      {c.email && <p className="text-xs" style={{ color: 'var(--text-ter)' }}>{c.email}</p>}
                    </td>
                    <td className="px-5 py-3">
                      {enr ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                          {enr.packages?.name || 'Active'}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-ter)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {enr && total > 0 ? (
                        <div>
                          <div className="flex gap-0.5 mb-1">
                            {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
                              <div key={i} className="w-2 h-2 rounded-sm"
                                style={{ background: i < Math.min(total,10) - Math.round((remaining / total) * Math.min(total,10)) ? 'var(--primary)' : 'var(--border)' }} />
                            ))}
                          </div>
                          <p className="text-xs font-semibold" style={{ color: remaining <= 2 ? 'var(--warn)' : 'var(--text-ter)' }}>{remaining}/{total}</p>
                        </div>
                      ) : <span style={{ color: 'var(--text-ter)' }}>—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => { setEditCustomer(c); setEditForm({ full_name: c.full_name, mobile: c.mobile||'', email: c.email||'', gender: c.gender||'', date_of_birth: c.date_of_birth||'', has_guardian: c.has_guardian||false, guardian_name: c.guardian_name||'', guardian_email: c.guardian_email||'', guardian_mobile: c.guardian_mobile||'', notes: c.notes||'' }) }}
                          className="p-1.5 rounded-lg transition" style={{ background: 'var(--bg)', color: 'var(--text-sec)' }}>
                          <Edit2 size={13} />
                        </button>
                        <Link href={`/org/${id}/enrollments`}>
                          <button className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                            style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                            <UserCheck size={12} />Enroll
                          </button>
                        </Link>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg transition"
                          style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="w-full max-w-lg rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Edit Customer</h2>
              <button onClick={() => setEditCustomer(null)} style={{ color: 'var(--text-ter)' }}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Full Name *</Label><input style={inp} value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} /></div>
              <div><Label>Mobile</Label><input style={inp} value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} /></div>
              <div><Label>Email</Label><input style={inp} value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
              <div><Label>Gender</Label>
                <select style={inp} value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div><Label>Date of Birth</Label><input style={inp} type="date" value={editForm.date_of_birth} onChange={e => setEditForm({...editForm, date_of_birth: e.target.value})} /></div>
              <div className="col-span-2"><Label>Notes</Label><input style={inp} value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} /></div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={editForm.has_guardian} onChange={e => setEditForm({...editForm, has_guardian: e.target.checked})} className="w-4 h-4" style={{ accentColor: 'var(--primary)' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Has Guardian</span>
                </label>
                {editForm.has_guardian && (
                  <div className="grid gap-3 p-4 rounded-xl" style={{ background: 'var(--primary-dim)' }}>
                    <div><Label>Guardian Name</Label><input style={inp} value={editForm.guardian_name} onChange={e => setEditForm({...editForm, guardian_name: e.target.value})} /></div>
                    <div><Label>Guardian Email</Label><input style={inp} value={editForm.guardian_email} onChange={e => setEditForm({...editForm, guardian_email: e.target.value})} /></div>
                    <div><Label>Guardian Mobile</Label><input style={inp} value={editForm.guardian_mobile} onChange={e => setEditForm({...editForm, guardian_mobile: e.target.value})} /></div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleEdit} disabled={editSaving} className="px-6 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--primary)' }}>{editSaving ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={() => setEditCustomer(null)} className="px-6 py-2 rounded-xl text-sm font-semibold"
                style={{ border: '1px solid var(--border)', color: 'var(--text-sec)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
