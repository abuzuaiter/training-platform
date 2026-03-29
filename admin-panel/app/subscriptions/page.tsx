'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Subscription {
  id: string
  customer_id: string
  organization_id: string
  subscription_type: string
  price: number
  start_date: string
  end_date: string
  payment_status: string
  notes: string | null
  created_at: string
  customers: { full_name: string; customer_code: string; email: string | null }
  organizations: { name: string }
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [filterOrg, setFilterOrg] = useState('all')
  const [orgs, setOrgs] = useState<{id: string, name: string}[]>([])

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [subsRes, orgsRes] = await Promise.all([
      fetch('/api/subscriptions'),
      fetch('/api/organizations')
    ])
    const [subsData, orgsData] = await Promise.all([subsRes.json(), orgsRes.json()])
    setSubs(subsData || [])
    setOrgs(orgsData || [])
    setLoading(false)
  }

  async function togglePayment(sub: Subscription) {
    await fetch(`/api/customers/${sub.customer_id}/subscriptions/${sub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: sub.payment_status === 'paid' ? 'unpaid' : 'paid' })
    })
    loadAll()
  }

  function exportCSV() {
    const headers = ['customer','code','organization','type','price','start','end','payment','status']
    const rows = filtered.map(s => [
      s.customers?.full_name, s.customers?.customer_code,
      s.organizations?.name, s.subscription_type, s.price,
      new Date(s.start_date).toLocaleDateString(),
      new Date(s.end_date).toLocaleDateString(),
      s.payment_status,
      new Date(s.end_date) >= new Date() ? 'active' : 'expired'
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'subscriptions.csv'
    a.click()
  }

  const today = new Date()

  const filtered = subs.filter(s => {
    const isActive = new Date(s.end_date) >= today
    const matchSearch = s.customers?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.customers?.customer_code?.toLowerCase().includes(search.toLowerCase()) ||
      s.organizations?.name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? isActive : !isActive)
    const matchPayment = filterPayment === 'all' || s.payment_status === filterPayment
    const matchOrg = filterOrg === 'all' || s.organization_id === filterOrg
    return matchSearch && matchStatus && matchPayment && matchOrg
  })

  const totalActive = subs.filter(s => new Date(s.end_date) >= today).length
  const totalExpired = subs.filter(s => new Date(s.end_date) < today).length
  const totalPaid = subs.filter(s => s.payment_status === 'paid').length
  const totalUnpaid = subs.filter(s => s.payment_status === 'unpaid').length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Subscriptions</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} of {subs.length} subscriptions</p>
          </div>
          <button onClick={exportCSV}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-1">ACTIVE</p>
            <p className="text-2xl font-bold text-green-600">{totalActive}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-1">EXPIRED</p>
            <p className="text-2xl font-bold text-red-500">{totalExpired}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-1">PAID</p>
            <p className="text-2xl font-bold text-blue-600">{totalPaid}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 mb-1">UNPAID</p>
            <p className="text-2xl font-bold text-amber-600">{totalUnpaid}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Search customer, code, org..." />
          <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Organizations</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
          <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No subscriptions found</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">CUSTOMER</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">ORGANIZATION</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">TYPE</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">PRICE</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">PERIOD</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const isActive = new Date(s.end_date) >= today
                  return (
                    <tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900 text-sm">{s.customers?.full_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{s.customers?.customer_code}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
                          {s.organizations?.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {s.subscription_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">{s.price} QAR</td>
                      <td className="px-5 py-3 text-xs text-gray-400">
                        {new Date(s.start_date).toLocaleDateString()} → {new Date(s.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                            {isActive ? 'Active' : 'Expired'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {s.payment_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => togglePayment(s)}
                            className={`text-xs px-2 py-1 rounded-lg font-semibold transition ${s.payment_status === 'paid' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {s.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          </button>
                          <Link href={`/customers/${s.customer_id}`}
                            className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100">
                            View →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}