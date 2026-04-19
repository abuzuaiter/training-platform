'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrgCustomersPage() {
  const params = useParams()
  const id = params.id as string
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
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
    const diff = Date.now() - new Date(dob).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  }

  function getEnrollment(customerId: string) {
    return enrollments.find(e => e.customer_id === customerId && e.status === 'active')
  }

  async function handleSubmit() {
    if (!form.full_name) { alert('Full name is required'); return }
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}/customers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Customer added!')
      setShowForm(false)
      setForm({ full_name: '', email: '', mobile: '', date_of_birth: '', gender: '', has_guardian: false, guardian_name: '', guardian_email: '', guardian_mobile: '', notes: '' })
      load()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
    setTimeout(() => setMessage(''), 4000)
  }

  async function handleEdit() {
    setEditSaving(true)
    await fetch(`/api/organizations/${id}/customers/${editCustomer.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
    setEditCustomer(null)
    setEditSaving(false)
    load()
  }

  async function handleDelete(customerId: string) {
    if (!confirm('Delete this customer?')) return
    await fetch(`/api/organizations/${id}/customers/${customerId}`, { method: 'DELETE' })
    load()
  }

  function exportCSV() {
    const headers = ['customer_code','full_name','mobile','email','gender','date_of_birth','has_guardian','guardian_name','guardian_email','guardian_mobile','notes']
    const rows = customers.map(c => headers.map(h => `"${(c[h] ?? '').toString().replace(/"/g, '')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'customers.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `full_name,mobile,email,gender,date_of_birth,has_guardian,guardian_name,guardian_email,guardian_mobile,notes
# INSTRUCTIONS:
# full_name: Required. Customer full name
# mobile: Optional. Phone e.g. +97412345678
# email: Optional. Email address
# gender: Optional. male / female
# date_of_birth: Optional. Format YYYY-MM-DD e.g. 1990-01-15
# has_guardian: Optional. true / false
# guardian_name: Optional. Guardian full name
# guardian_email: Optional. Guardian email
# guardian_mobile: Optional. Guardian phone
# notes: Optional. Any additional notes
# Delete comment lines (starting with #) before importing
Ahmed Ali,+97412345678,ahmed@email.com,male,1990-01-15,false,,,, 
Sara Mohammed,+97487654321,sara@email.com,female,2015-06-20,true,Fatima Mohammed,fatima@email.com,+97498765432,Allergic to peanuts`
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'customers-template.csv'; a.click()
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    let success = 0, failed = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      if (!row.full_name) { failed++; continue }
      if (row.has_guardian) row.has_guardian = row.has_guardian === 'true'
      const res = await fetch(`/api/organizations/${id}/customers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...row, organization_id: id })
      })
      if (res.ok) success++; else failed++
    }
    alert(`Imported: ${success} success, ${failed} failed`)
    e.target.value = ''
    load()
  }

  const filtered = customers.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search) ||
    c.customer_code?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Customers</h1>
          <p className="text-xs text-gray-400">{customers.length} total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">📋 Template</button>
          <label className="cursor-pointer border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            📥 Import
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <button onClick={exportCSV} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">📤 Export</button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">+ Add Customer</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">{message}</div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">New Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">FULL NAME *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
                <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">GENDER</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">DATE OF BIRTH</label>
                <input value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">NOTES</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>

              {/* Guardian */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={form.has_guardian} onChange={e => setForm({...form, has_guardian: e.target.checked})}
                    className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Has Guardian</span>
                </label>
                {form.has_guardian && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-blue-50 rounded-xl p-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN NAME</label>
                      <input value={form.guardian_name} onChange={e => setForm({...form, guardian_name: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN EMAIL</label>
                      <input value={form.guardian_email} onChange={e => setForm({...form, guardian_email: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN MOBILE</label>
                      <input value={form.guardian_mobile} onChange={e => setForm({...form, guardian_mobile: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? 'Saving...' : 'Add Customer'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No customers found</div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(c => {
              const enr = getEnrollment(c.id)
              const age = getAge(c.date_of_birth)
              const total = enr?.packages?.sessions_count || 0
              const remaining = enr?.sessions_remaining ?? 0
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                        {c.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{c.full_name}</p>
                          {age !== null && <span className="text-xs text-gray-400">{age} yrs</span>}
                          {c.gender && <span className="text-xs text-gray-400">{c.gender === 'male' ? '♂' : '♀'}</span>}
                          {c.has_guardian && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">Guardian</span>}
                        </div>
                        <div className="flex gap-3 mt-0.5">
                          {c.mobile && <p className="text-xs text-gray-400">{c.mobile}</p>}
                          {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                          <p className="text-xs text-gray-300">{c.customer_code}</p>
                        </div>
                        {c.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{c.notes}</p>}
                        {c.has_guardian && c.guardian_mobile && (
                          <p className="text-xs text-purple-600 mt-0.5">👨‍👩‍👧 ولي الأمر: {c.guardian_name || ''} — {c.guardian_mobile}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {enr && total > 0 && (
                        <div className="text-right">
                          <div className="flex gap-0.5 mb-0.5 justify-end">
                            {Array.from({ length: Math.min(total, 12) }).map((_, i) => (
                              <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i < Math.min(total, 12) - Math.round((remaining / total) * Math.min(total, 12)) ? 'bg-blue-500' : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${remaining <= 2 ? 'text-amber-500' : 'text-gray-400'}`}>{remaining}/{total}</p>
                        </div>
                      )}
                      <button onClick={() => { setEditCustomer(c); setEditForm({ full_name: c.full_name, mobile: c.mobile||'', email: c.email||'', gender: c.gender||'', date_of_birth: c.date_of_birth||'', has_guardian: c.has_guardian||false, guardian_name: c.guardian_name||'', guardian_email: c.guardian_email||'', guardian_mobile: c.guardian_mobile||'', notes: c.notes||'' }) }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 font-semibold hover:bg-gray-100">Edit</button>
                      <Link href={`/org/${id}/enrollments`}>
                        <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100">Enroll</button>
                      </Link>
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100">Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {/* Edit Modal */}
      {editCustomer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Edit Customer</h2>
              <button onClick={() => setEditCustomer(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">FULL NAME *</label>
                <input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
                <input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
                <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">GENDER</label>
                <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">DATE OF BIRTH</label>
                <input value={editForm.date_of_birth} onChange={e => setEditForm({...editForm, date_of_birth: e.target.value})} type="date"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">NOTES</label>
                <input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input type="checkbox" checked={editForm.has_guardian} onChange={e => setEditForm({...editForm, has_guardian: e.target.checked})}
                    className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Has Guardian</span>
                </label>
                {editForm.has_guardian && (
                  <div className="grid grid-cols-1 gap-3 bg-blue-50 rounded-xl p-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN NAME</label>
                      <input value={editForm.guardian_name} onChange={e => setEditForm({...editForm, guardian_name: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN EMAIL</label>
                      <input value={editForm.guardian_email} onChange={e => setEditForm({...editForm, guardian_email: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN MOBILE</label>
                      <input value={editForm.guardian_mobile} onChange={e => setEditForm({...editForm, guardian_mobile: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleEdit} disabled={editSaving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEditCustomer(null)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
