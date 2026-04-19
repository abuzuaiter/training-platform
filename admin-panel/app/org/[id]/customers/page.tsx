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
  const [form, setForm] = useState({ full_name: '', email: '', mobile: '', has_guardian: false, guardian_email: '', guardian_mobile: '', notes: '' })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const [custRes, enrRes] = await Promise.all([
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/enrollments?org_id=${id}`)
    ])
    setCustomers(await custRes.json() || [])
    setEnrollments(enrRes.ok ? await enrRes.json() : [])
    setLoading(false)
  }

  function getEnrollment(customerId: string) {
    return enrollments.find(e => e.customer_id === customerId && e.status === 'active')
  }

  function SessionSquares({ total, remaining }: { total: number, remaining: number }) {
    const used = total - remaining
    const squares = Math.min(total, 20)
    const usedSquares = Math.round((used / total) * squares)
    return (
      <div>
        <div className="flex flex-wrap gap-0.5 mb-1">
          {Array.from({ length: squares }).map((_, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${i < usedSquares ? 'bg-blue-500' : 'bg-gray-200'}`} />
          ))}
        </div>
        <p className={`text-xs font-medium ${remaining <= 2 ? 'text-amber-500' : 'text-gray-400'}`}>
          {remaining} / {total} remaining
        </p>
      </div>
    )
  }

  async function handleSubmit() {
    if (!form.full_name) { alert('Full name is required'); return }
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}/customers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) { setMessage('Customer added!'); setShowForm(false); setForm({ full_name: '', email: '', mobile: '', has_guardian: false, guardian_email: '', guardian_mobile: '', notes: '' }); load() }
    else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleDelete(customerId: string) {
    await fetch(`/api/organizations/${id}/customers/${customerId}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    load()
  }

  const filtered = customers.filter(c =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search) ||
    c.customer_code?.toLowerCase().includes(search.toLowerCase())
  )

  function exportCSV() {
    const headers = ['full_name','mobile','email','gender','date_of_birth']
    const rows = customers.map(c => [c.full_name, c.mobile||'', c.email||'', c.gender||'', c.date_of_birth||''])
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
    a.download = 'customers.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `full_name,mobile,email,gender,date_of_birth
# INSTRUCTIONS:
# full_name: Required. Customer full name
# mobile: Optional. Phone number e.g. +97412345678
# email: Optional. Email address
# gender: Optional. male or female
# date_of_birth: Optional. Format YYYY-MM-DD
# Delete these comment lines before importing
Ahmed Ali,+97412345678,ahmed@email.com,male,1990-01-15
Sara Mohammed,+97487654321,sara@email.com,female,1995-06-20`
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
    a.download = 'customers-template.csv'; a.click()
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'))
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''))
    let success = 0, failed = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g,''))
      const row: any = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      if (!row.full_name) { failed++; continue }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/org/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Customers</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} of {customers.length} customers</p>
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

        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4"
          placeholder="Search name, email, mobile, ID..." />

        {message && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('added') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">FULL NAME *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
                <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.has_guardian} onChange={e => setForm({...form, has_guardian: e.target.checked})} className="w-4 h-4 accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Has a Guardian</span>
                </label>
              </div>
              {form.has_guardian && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN EMAIL</label>
                    <input value={form.guardian_email} onChange={e => setForm({...form, guardian_email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="email" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN MOBILE</label>
                    <input value={form.guardian_mobile} onChange={e => setForm({...form, guardian_mobile: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">NOTES</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">{saving ? 'Saving...' : 'Add Customer'}</button>
              <button onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        )}

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No customers yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">CUSTOMER</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">CONTACT</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">{c.full_name?.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{c.full_name}</p>
                          {c.customer_code && <p className="text-xs text-gray-400 font-mono">{c.customer_code}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">{c.email || '—'}</p>
                      <p className="text-xs text-gray-400">{c.mobile || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{c.status}</span>
                      {c.has_guardian && <span className="ml-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">Guardian</span>}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const enr = getEnrollment(c.id)
                        if (!enr || enr.sessions_remaining === null) return <span className="text-xs text-gray-300">—</span>
                        const total = enr.packages?.sessions_count || enr.sessions_remaining
                        return <SessionSquares total={total} remaining={enr.sessions_remaining} />
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      {deleteConfirm === c.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(c.id)} className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white font-semibold">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
