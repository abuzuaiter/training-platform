'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  customer_code: string
  full_name: string
  email: string | null
  mobile: string | null
  has_guardian: boolean
  guardian_email: string | null
  guardian_mobile: string | null
  notes: string | null
  status: string
}

export default function CustomersPage() {
  const params = useParams()
  const id = params.id as string
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [search, setSearch] = useState('')
  const [filterGuardian, setFilterGuardian] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    has_guardian: false, guardian_email: '', guardian_mobile: '', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => { if (id) loadCustomers() }, [id])

  async function loadCustomers() {
    setLoading(true)
    const res = await fetch(`/api/organizations/${id}/customers`)
    const data = await res.json()
    setCustomers(data || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.full_name) { alert('Full name is required'); return }
    setSaving(true)
    setMessage('')
    const res = await fetch(`/api/organizations/${id}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Customer added successfully!')
      setForm({ full_name: '', email: '', mobile: '', has_guardian: false, guardian_email: '', guardian_mobile: '', notes: '' })
      setShowForm(false)
      loadCustomers()
    } else {
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  async function toggleStatus(customer: Customer) {
    await fetch(`/api/organizations/${id}/customers/${customer.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: customer.status === 'active' ? 'inactive' : 'active' })
    })
    loadCustomers()
  }

  async function handleDelete(customerId: string) {
    await fetch(`/api/organizations/${id}/customers/${customerId}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadCustomers()
  }

  function downloadTemplate() {
    const csv = 'full_name,email,mobile,has_guardian,guardian_email,guardian_mobile,notes\nJohn Doe,john@email.com,+97455123456,false,,,\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'customers_template.csv'
    a.click()
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = lines.slice(1)
    let success = 0, failed = 0
    for (const row of rows) {
      if (!row.trim()) continue
      const values = row.split(',')
      const obj: Record<string, any> = {}
      headers.forEach((h, i) => { obj[h] = values[i]?.trim() || null })
      const res = await fetch(`/api/organizations/${id}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...obj, has_guardian: obj.has_guardian === 'true' })
      })
      if (res.ok) { success++ } else { failed++ }
    }
    setMessage('Imported: ' + success + ' success, ' + failed + ' failed')
    setShowBulk(false)
    loadCustomers()
  }

  function exportCSV() {
    const headers = ['customer_code','full_name','email','mobile','has_guardian','guardian_email','guardian_mobile','status','notes']
    const rows = filtered.map(c => [
      c.customer_code || '', c.full_name, c.email || '', c.mobile || '',
      c.has_guardian ? 'true' : 'false', c.guardian_email || '', c.guardian_mobile || '',
      c.status, c.notes || ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'customers_export.csv'
    a.click()
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectAll() {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map(c => c.id))
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile?.includes(search) ||
      c.customer_code?.toLowerCase().includes(search.toLowerCase())
    const matchGuardian = filterGuardian === 'all' || (filterGuardian === 'yes' ? c.has_guardian : !c.has_guardian)
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchGuardian && matchStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/organizations" className="text-gray-400 hover:text-gray-600 text-sm">Organizations</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/organizations/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Manage</Link>
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
          <div className="flex gap-2 flex-wrap">
            <button onClick={exportCSV}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Export
            </button>
            <button onClick={() => setShowBulk(!showBulk)}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Bulk Import
            </button>
            <button onClick={() => { setShowForm(!showForm); setMessage('') }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              + Add Customer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Search name, email, mobile, ID..." />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={filterGuardian} onChange={e => setFilterGuardian(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Customers</option>
            <option value="yes">With Guardian</option>
            <option value="no">Without Guardian</option>
          </select>
        </div>

        {selected.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">{selected.length} selected</span>
            <div className="flex gap-2">
              <button onClick={() => setSelected([])}
                className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-600 font-semibold border border-gray-200">
                Clear
              </button>
            </div>
          </div>
        )}

        {showBulk && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Bulk Import Customers</h2>
            <ol className="text-sm text-gray-600 space-y-1 mb-4 list-decimal list-inside">
              <li>Download the CSV template</li>
              <li>Fill in customer data (one per row)</li>
              <li>Save and upload the file</li>
            </ol>
            <div className="flex gap-3 flex-wrap">
              <button onClick={downloadTemplate}
                className="border border-blue-300 text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition">
                Download Template
              </button>
              <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer">
                Upload CSV
                <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" />
              </label>
              <button onClick={() => setShowBulk(false)}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') || message.includes('Imported') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Customer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">FULL NAME *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="john@email.com" type="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
                <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="+97455123456" />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.has_guardian} onChange={e => setForm({...form, has_guardian: e.target.checked})} className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Has a Guardian</span>
                </label>
              </div>
              {form.has_guardian && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN EMAIL</label>
                    <input value={form.guardian_email} onChange={e => setForm({...form, guardian_email: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="guardian@email.com" type="email" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN MOBILE</label>
                    <input value={form.guardian_mobile} onChange={e => setForm({...form, guardian_mobile: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="+97455123456" />
                  </div>
                </>
              )}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">NOTES</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Any notes..." rows={2} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Customer'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">{search ? 'No results found' : 'No customers yet'}</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                onChange={selectAll} className="w-4 h-4 accent-blue-600" />
              <span className="text-xs text-gray-400">Select all</span>
            </div>
            <div className="grid gap-4">
              {filtered.map(c => (
                <div key={c.id} className={`bg-white rounded-2xl border p-5 ${c.status === 'inactive' ? 'opacity-60 border-gray-100' : 'border-gray-200'} ${selected.includes(c.id) ? 'ring-2 ring-blue-300' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 accent-blue-600" />
                      <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-lg">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{c.full_name}</h3>
                          {c.customer_code && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{c.customer_code}</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1 flex-wrap">
                          {c.email && <span className="text-xs text-gray-400">{c.email}</span>}
                          {c.mobile && <span className="text-xs text-gray-400">{c.mobile}</span>}
                        </div>
                        {c.has_guardian && <p className="text-xs text-gray-400 mt-0.5">Guardian: {c.guardian_email || c.guardian_mobile} <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium ml-1">Guardian</span></p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Link href={`/organizations/${id}/customers/${c.id}`}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100">
                        Manage
                      </Link>
                      <button onClick={() => toggleStatus(c)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${c.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {c.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      {deleteConfirm === c.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDelete(c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-semibold">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(c.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">Delete</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}