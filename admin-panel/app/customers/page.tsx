'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface CustomerOrg {
  organization_id: string
  organizations: { id: string; name: string; org_code: string }
}

interface Customer {
  id: string
  customer_code: string
  full_name: string
  email: string | null
  mobile: string | null
  has_guardian: boolean
  status: string
  customer_organizations: CustomerOrg[]
}

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOrg, setFilterOrg] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterGuardian, setFilterGuardian] = useState('all')
  const [orgs, setOrgs] = useState<{id: string, name: string}[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    has_guardian: false, guardian_email: '', guardian_mobile: '',
    notes: '', organization_id: ''
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [cRes, oRes] = await Promise.all([fetch('/api/customers'), fetch('/api/organizations')])
    const [cData, oData] = await Promise.all([cRes.json(), oRes.json()])
    setCustomers(cData || [])
    setOrgs(oData || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.full_name) { alert('Full name is required'); return }
    setSaving(true)
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Customer added successfully!')
      setForm({ full_name: '', email: '', mobile: '', has_guardian: false, guardian_email: '', guardian_mobile: '', notes: '', organization_id: '' })
      setShowForm(false)
      loadAll()
    } else {
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
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
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...obj, has_guardian: obj.has_guardian === 'true' })
      })
      if (res.ok) { success++ } else { failed++ }
    }
    setMessage('Imported: ' + success + ' success, ' + failed + ' failed')
    setShowBulk(false)
    loadAll()
  }

  function exportCSV() {
    const headers = ['customer_code','full_name','email','mobile','organizations','has_guardian','status']
    const rows = filtered.map(c => [
      c.customer_code || '', c.full_name, c.email || '', c.mobile || '',
      c.customer_organizations?.map(co => co.organizations?.name).join(';') || '',
      c.has_guardian ? 'true' : 'false', c.status
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'all_customers_export.csv'
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
    const matchOrg = filterOrg === 'all' || c.customer_organizations?.some(co => co.organization_id === filterOrg)
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    const matchGuardian = filterGuardian === 'all' || (filterGuardian === 'yes' ? c.has_guardian : !c.has_guardian)
    return matchSearch && matchOrg && matchStatus && matchGuardian
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">All Customers</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Customers</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Search name, email, mobile, ID..." />
          <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Organizations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
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
            <button onClick={() => setSelected([])}
              className="text-xs px-3 py-1.5 rounded-lg bg-white text-gray-600 font-semibold border border-gray-200">
              Clear
            </button>
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
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ORGANIZATION</label>
                <select value={form.organization_id} onChange={e => setForm({...form, organization_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">No organization yet</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
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
          <div className="text-center py-12 text-gray-400">No customers found</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0}
                onChange={selectAll} className="w-4 h-4 accent-blue-600" />
              <span className="text-xs text-gray-400">Select all</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 w-8"></th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">CUSTOMER</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">CONTACT</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">ORGANIZATIONS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${selected.includes(c.id) ? 'bg-blue-50/30' : i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-4">
                        <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} className="w-4 h-4 accent-blue-600" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                            {c.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{c.full_name}</p>
                            {c.customer_code && <p className="text-xs text-gray-400 font-mono">{c.customer_code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs text-gray-500">{c.email || '—'}</p>
                        <p className="text-xs text-gray-400">{c.mobile || '—'}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {c.customer_organizations?.length > 0 ? (
                            c.customer_organizations.map(co => (
                              <span key={co.organization_id} className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                                {co.organizations?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">No org</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {c.status}
                        </span>
                        {c.has_guardian && <span className="ml-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Guardian</span>}
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/customers/${c.id}`}
                          className="text-xs text-blue-600 font-semibold hover:underline">
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}