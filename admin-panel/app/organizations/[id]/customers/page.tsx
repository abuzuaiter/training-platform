'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  full_name: string
  email: string | null
  mobile: string | null
  has_guardian: boolean
  guardian_email: string | null
  guardian_mobile: string | null
  subscription_price: number | null
  subscription_type: string
  subscription_start: string | null
  subscription_end: string | null
  payment_status: string
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
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    has_guardian: false, guardian_email: '', guardian_mobile: '',
    subscription_price: '', subscription_type: 'monthly',
    subscription_start: '', subscription_end: '',
    payment_status: 'unpaid', notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
      body: JSON.stringify({
        ...form,
        subscription_price: form.subscription_price ? parseFloat(form.subscription_price) : null
      })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Customer added successfully!')
      setForm({ full_name: '', email: '', mobile: '', has_guardian: false, guardian_email: '', guardian_mobile: '', subscription_price: '', subscription_type: 'monthly', subscription_start: '', subscription_end: '', payment_status: 'unpaid', notes: '' })
      setShowForm(false)
      loadCustomers()
    } else {
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  async function toggleStatus(customer: Customer) {
    const newStatus = customer.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/organizations/${id}/customers/${customer.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    loadCustomers()
  }

  async function togglePayment(customer: Customer) {
    const newStatus = customer.payment_status === 'paid' ? 'unpaid' : 'paid'
    await fetch(`/api/organizations/${id}/customers/${customer.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: newStatus })
    })
    loadCustomers()
  }

  async function handleDelete(customerId: string) {
    await fetch(`/api/organizations/${id}/customers/${customerId}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadCustomers()
  }

  function downloadTemplate() {
    const csv = 'full_name,email,mobile,subscription_type,subscription_price,subscription_start,subscription_end,payment_status,has_guardian,guardian_email,guardian_mobile,notes\nJohn Doe,john@email.com,+97455123456,monthly,200,2026-01-01,2026-12-31,unpaid,false,,,\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'customers_template.csv'
    a.click()
  }

  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => l.trim())
    const headers = lines[0].split(',')
    const rows = lines.slice(1)
    let success = 0, failed = 0
    for (const row of rows) {
      const values = row.split(',')
      const obj: any = {}
      headers.forEach((h, i) => { obj[h.trim()] = values[i]?.trim() || null })
      const res = await fetch(`/api/organizations/${id}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...obj,
          has_guardian: obj.has_guardian === 'true',
          subscription_price: obj.subscription_price ? parseFloat(obj.subscription_price) : null
        })
      })
      if (res.ok) { success++ } else { failed++ }
    }
    setMessage(`Imported: ${success} success, ${failed} failed`)
    setShowBulk(false)
    loadCustomers()
  }

  const subTypeLabel: Record<string, string> = {
    session: 'Session', weekly: 'Weekly', monthly: 'Monthly'
  }

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search)
  )

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
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500 text-sm mt-1">{customers.length} customers total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowBulk(!showBulk)}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              📥 Bulk Import
            </button>
            <button onClick={() => { setShowForm(!showForm); setMessage('') }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              + Add Customer
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Search by name, email or mobile..." />
        </div>

        {/* Bulk Import */}
        {showBulk && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Bulk Import Customers</h2>
            <p className="text-sm text-gray-500 mb-4">Upload a CSV file with customer data. Follow these steps:</p>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1 mb-4">
              <li>Download the CSV template below</li>
              <li>Fill in the customer data (one customer per row)</li>
              <li>Save the file and upload it here</li>
              <li>The system will import all valid rows automatically</li>
            </ol>
            <div className="flex gap-3">
              <button onClick={downloadTemplate}
                className="border border-blue-300 text-blue-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-50 transition">
                ⬇️ Download Template
              </button>
              <label className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition cursor-pointer">
                📂 Upload CSV
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
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">SUBSCRIPTION TYPE</label>
                <select value={form.subscription_type} onChange={e => setForm({...form, subscription_type: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="session">Session</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">SUBSCRIPTION PRICE (QAR)</label>
                <input value={form.subscription_price} onChange={e => setForm({...form, subscription_price: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="200" type="number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PAYMENT STATUS</label>
                <select value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE</label>
                <input value={form.subscription_start} onChange={e => setForm({...form, subscription_start: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE</label>
                <input value={form.subscription_end} onChange={e => setForm({...form, subscription_end: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
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
          <div className="grid gap-4">
            {filtered.map(c => (
              <div key={c.id} className={`bg-white rounded-2xl border p-5 ${c.status === 'inactive' ? 'opacity-60 border-gray-100' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-lg">
                      {c.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{c.full_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {c.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {subTypeLabel[c.subscription_type] || c.subscription_type}
                        </span>
                      </div>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        {c.email && <span className="text-xs text-gray-400">{c.email}</span>}
                        {c.mobile && <span className="text-xs text-gray-400">{c.mobile}</span>}
                        {c.subscription_price && <span className="text-xs text-green-600 font-medium">{c.subscription_price} QAR</span>}
                      </div>
                      {(c.subscription_start || c.subscription_end) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.subscription_start && new Date(c.subscription_start).toLocaleDateString()}
                          {c.subscription_start && c.subscription_end && ' → '}
                          {c.subscription_end && new Date(c.subscription_end).toLocaleDateString()}
                        </p>
                      )}
                      {c.has_guardian && <p className="text-xs text-gray-400 mt-0.5">Guardian: {c.guardian_email || c.guardian_mobile} <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium ml-1">Guardian</span></p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Link href={`/organizations/${id}/customers/${c.id}`}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100">
                      Manage
                    </Link>
                    <button onClick={() => togglePayment(c)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${c.payment_status === 'paid' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {c.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
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
        )}
      </div>
    </div>
  )
}