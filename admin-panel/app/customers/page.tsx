'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  customer_code: string
  full_name: string
  email: string | null
  mobile: string | null
  has_guardian: boolean
  status: string
  organizations: { id: string; name: string; org_code: string }
}

export default function AllCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOrg, setFilterOrg] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [orgs, setOrgs] = useState<{id: string, name: string}[]>([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [cRes, oRes] = await Promise.all([
      fetch('/api/customers'),
      fetch('/api/organizations')
    ])
    const [cData, oData] = await Promise.all([cRes.json(), oRes.json()])
    setCustomers(cData || [])
    setOrgs(oData || [])
    setLoading(false)
  }

  function exportCSV() {
    const headers = ['customer_code','full_name','email','mobile','organization','has_guardian','status']
    const rows = filtered.map(c => [
      c.customer_code || '', c.full_name, c.email || '', c.mobile || '',
      c.organizations?.name || '', c.has_guardian ? 'true' : 'false', c.status
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'all_customers_export.csv'
    a.click()
  }

  const filtered = customers.filter(c => {
    const matchSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.mobile?.includes(search) ||
      c.customer_code?.toLowerCase().includes(search.toLowerCase())
    const matchOrg = filterOrg === 'all' || c.organizations?.id === filterOrg
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchOrg && matchStatus
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
          <button onClick={exportCSV}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
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
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No customers found</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">CUSTOMER</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">CONTACT</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ORGANIZATION</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">{c.email || '—'}</p>
                      <p className="text-xs text-gray-400">{c.mobile || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                        {c.organizations?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {c.status}
                      </span>
                      {c.has_guardian && <span className="ml-1 text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">Guardian</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/organizations/${c.organizations?.id}/customers/${c.id}`}
                        className="text-xs text-blue-600 font-semibold hover:underline">
                        Manage →
                      </Link>
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