'use client'
import AdminLayout from '../admin-layout'
mport { useEffect, useState } from 'react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  organization_id: string
  amount: number
  status: string
  type: string
  issued_at: string
  paid_at: string | null
  notes: string | null
  organizations: { id: string; name: string; email: string | null }
  organization_plans: {
    plans: { name: string }
    start_date: string
    end_date: string
  } | null
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { loadInvoices() }, [])

  async function loadInvoices() {
    setLoading(true)
    const res = await fetch('/api/invoices')
    const data = await res.json()
    setInvoices(data || [])
    setLoading(false)
  }

  async function markPaid(invoice: Invoice) {
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    })
    if (res.ok) {
      setMessage('Marked as paid! Receipt sent to ' + invoice.organizations?.email)
      loadInvoices()
    }
  }

  async function markOrgPlanPaid(invoice: Invoice) {
    if (!invoice.organization_plans) return
    // Update organization plan payment status
    const orgPlanRes = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    })
    if (orgPlanRes.ok) {
      setMessage('Invoice marked as paid!')
      loadInvoices()
    }
  }

  function exportCSV() {
    const headers = ['invoice_number','organization','type','amount','status','issued_at','paid_at']
    const rows = filtered.map(inv => [
      inv.invoice_number,
      inv.organizations?.name || '',
      inv.type,
      inv.amount,
      inv.status,
      new Date(inv.issued_at).toLocaleDateString(),
      inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'invoices_export.csv'
    a.click()
  }

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.organizations?.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus
    const matchType = filterType === 'all' || inv.type === filterType
    return matchSearch && matchStatus && matchType
  })

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0)

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Invoices</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-500 text-sm mt-1">{invoices.length} invoices total</p>
          </div>
          <button onClick={exportCSV}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">TOTAL COLLECTED</p>
            <p className="text-2xl font-bold text-green-600">{totalRevenue.toFixed(2)} QAR</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">PENDING</p>
            <p className="text-2xl font-bold text-amber-600">{pendingAmount.toFixed(2)} QAR</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">TOTAL INVOICES</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
          </div>
        </div>

        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Search invoice or organization..." />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Types</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No invoices yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">INVOICE</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ORGANIZATION</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">PLAN</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">AMOUNT</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">DATE</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv, i) => (
                  <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.type === 'receipt' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{inv.organizations?.name}</p>
                      <p className="text-xs text-gray-400">{inv.organizations?.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {inv.organization_plans?.plans?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{inv.amount} QAR</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(inv.issued_at).toLocaleDateString()}
                      {inv.paid_at && <p className="text-green-600">Paid: {new Date(inv.paid_at).toLocaleDateString()}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {inv.status === 'pending' && (
                          <button onClick={() => markPaid(inv)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition">
                            Mark Paid
                          </button>
                        )}
                        <Link href={`/invoices/${inv.id}`}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                          View →
                        </Link>
                      </div>
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