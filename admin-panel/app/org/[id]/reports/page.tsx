'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrgReportsPage() {
  const params = useParams()
  const id = params.id as string
  const [invoices, setInvoices] = useState<any[]>([])
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('today')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [filterCustomer, setFilterCustomer] = useState('')
  const [filterPackage, setFilterPackage] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [invRes, orgRes, custRes, pkgRes] = await Promise.all([
      fetch(`/api/org-invoices?org_id=${id}`),
      fetch(`/api/organizations/${id}`),
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/packages?org_id=${id}`)
    ])
    setInvoices(invRes.ok ? await invRes.json() : [])
    setOrg(orgRes.ok ? await orgRes.json() : null)
    setCustomers(custRes.ok ? await custRes.json() : [])
    setPackages(pkgRes.ok ? await pkgRes.json() : [])
    setLoading(false)
  }

  function getFiltered() {
    const now = new Date()
    return invoices.filter(inv => {
      const d = new Date(inv.created_at)
      // Period filter
      let periodMatch = true
      if (filter === 'today') periodMatch = d.toDateString() === now.toDateString()
      else if (filter === 'week') periodMatch = d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      else if (filter === 'month') periodMatch = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      else if (filter === 'custom' && from && to) {
        const toDate = new Date(to); toDate.setHours(23, 59, 59)
        periodMatch = d >= new Date(from) && d <= toDate
      }
      // Customer filter
      const customerMatch = !filterCustomer || inv.customer_id === filterCustomer
      // Package filter
      const packageMatch = !filterPackage || inv.enrollments?.packages?.name === filterPackage
      // Status filter
      const statusMatch = !filterStatus || inv.status === filterStatus
      return periodMatch && customerMatch && packageMatch && statusMatch
    })
  }

  function handlePrint() {
    const filtered = getFiltered()
    const totalPaid = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
    const totalPending = filtered.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)

    const periodLabel = filter === 'today' ? 'Today' :
      filter === 'week' ? 'This Week' :
      filter === 'month' ? 'This Month' :
      `${from} — ${to}`

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
    <html><head><title>Invoices Report</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; }
      .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e2e8f0; }
      .org-name { font-size: 20px; font-weight: 800; }
      .report-title { font-size: 18px; font-weight: 700; color: #185FA5; }
      .period { font-size: 13px; color: #64748b; margin-top: 4px; }
      .stats { display: flex; gap: 24px; margin-bottom: 24px; }
      .stat { background: #f8fafc; border-radius: 12px; padding: 16px 24px; text-align: center; flex: 1; }
      .stat-value { font-size: 22px; font-weight: 800; }
      .stat-label { font-size: 11px; color: #64748b; margin-top: 4px; }
      .green { color: #16a34a; }
      .amber { color: #d97706; }
      .blue { color: #185FA5; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f8fafc; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; border-bottom: 1px solid #e2e8f0; }
      td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
      .paid { color: #16a34a; font-weight: 600; }
      .pending { color: #d97706; font-weight: 600; }
    </style></head><body>
    <div class="header">
      <div style="display:flex; align-items:center; gap:12px;">
        ${org?.logo_url ? `<img src="${org.logo_url}" style="width:48px; height:48px; object-fit:contain;" />` : ''}
        <div>
          <div class="org-name">${org?.name || ''}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="report-title">Invoices Report</div>
        <div class="period">Period: ${periodLabel}</div>
        <div class="period">Generated: ${new Date().toLocaleDateString('en-GB')}</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat"><div class="stat-value green">${totalPaid} QAR</div><div class="stat-label">Collected</div></div>
      <div class="stat"><div class="stat-value amber">${totalPending} QAR</div><div class="stat-label">Pending</div></div>
      <div class="stat"><div class="stat-value blue">${filtered.length}</div><div class="stat-label">Total Invoices</div></div>
    </div>

    <table>
      <tr>
        <th>INVOICE</th>
        <th>CUSTOMER</th>
        <th>AMOUNT</th>
        <th>STATUS</th>
        <th>DATE</th>
      </tr>
      ${filtered.map(inv => `
      <tr>
        <td>${inv.invoice_number}</td>
        <td>${inv.customers?.full_name || '—'}</td>
        <td>${inv.amount} QAR</td>
        <td class="${inv.status}">${inv.status.toUpperCase()}</td>
        <td>${new Date(inv.created_at).toLocaleDateString('en-GB')}</td>
      </tr>`).join('')}
    </table>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const filtered = getFiltered()
  const totalPaid = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = filtered.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Reports</h1>
          <p className="text-xs text-gray-400">Financial & Attendance</p>
        </div>
        <button onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          Print Report
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="flex gap-2 flex-wrap items-center">
            {['today', 'week', 'month', 'custom'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'Custom'}
              </button>
            ))}
            {filter === 'custom' && (
              <div className="flex gap-2 items-center ml-2">
                <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                <span className="text-gray-400">→</span>
                <input type="date" value={to} onChange={e => setTo(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
              </div>
            )}
          </div>
          <div className="flex gap-3 flex-wrap mt-3 pt-3 border-t border-gray-100">
            <select value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none min-w-40">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
            <select value={filterPackage} onChange={e => setFilterPackage(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none min-w-40">
              <option value="">All Packages</option>
              {packages.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            {(filterCustomer || filterPackage || filterStatus) && (
              <button onClick={() => { setFilterCustomer(''); setFilterPackage(''); setFilterStatus('') }}
                className="text-xs px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 transition font-semibold">
                Clear Filters
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap items-center hidden">
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalPaid} QAR</p>
            <p className="text-xs text-gray-400 mt-1">Collected</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-amber-500">{totalPending} QAR</p>
            <p className="text-xs text-gray-400 mt-1">Pending</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{filtered.length}</p>
            <p className="text-xs text-gray-400 mt-1">Invoices</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No invoices in this period</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">INVOICE</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">CUSTOMER</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">AMOUNT</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">DATE</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{inv.customers?.full_name || '—'}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">{inv.amount} QAR</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
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
