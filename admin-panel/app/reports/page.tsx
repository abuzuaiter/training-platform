'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Organization { id: string; name: string }
interface Invoice { id: string; invoice_number: string; amount: number; status: string; created_at: string; organizations: { id: string; name: string } | null }
interface Enrollment { id: string; status: string; sessions_remaining: number | null; organization_id: string; customers: { full_name: string } | null; organizations: { name: string } | null; packages: { name: string } | null }
interface Customer { id: string; full_name: string; mobile: string | null; status: string; customer_code: string | null; customer_organizations: { organization_id: string; organizations: { name: string } | null }[] }

export default function ReportsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [enrollmentFilter, setEnrollmentFilter] = useState('all')
  const [customerFilter, setCustomerFilter] = useState('all')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [orgsRes, invRes, enrRes, cusRes] = await Promise.all([
      fetch('/api/reports/orgs'),
      fetch('/api/reports/invoices'),
      fetch('/api/reports/enrollments'),
      fetch('/api/reports/customers'),
    ])
    const [orgsData, invData, enrData, cusData] = await Promise.all([
      orgsRes.json(), invRes.json(), enrRes.json(), cusRes.json()
    ])
    setOrgs(orgsData || [])
    setInvoices(invData || [])
    setEnrollments(enrData || [])
    setCustomers(cusData || [])
    setLoading(false)
  }

  const filteredInvoices = invoices
    .filter(i => selectedOrg === 'all' || i.organizations?.id === selectedOrg)
    .filter(i => invoiceFilter === 'all' || i.status === invoiceFilter)

  const filteredEnrollments = enrollments
    .filter(e => selectedOrg === 'all' || e.organization_id === selectedOrg)
    .filter(e => {
      if (enrollmentFilter === 'all') return true
      if (enrollmentFilter === 'expiring') return e.status === 'active' && e.sessions_remaining != null && e.sessions_remaining <= 2
      return e.status === enrollmentFilter
    })

  const filteredCustomers = customers
    .filter(c => selectedOrg === 'all' || c.customer_organizations.some(o => o.organization_id === selectedOrg))
    .filter(c => customerFilter === 'all' || (customerFilter === 'active' ? c.status === 'active' : c.status !== 'active'))

  const totalRevenue = filteredInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalPending = filteredInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0)

  function exportCSV(filename: string, headers: string[], rows: any[][]) {
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = filename
    a.click()
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString()
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Reports</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Overview across all organizations</p>
        </div>

        {/* Org Filter */}
        <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
          className="mb-8 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 w-64">
          <option value="all">All Organizations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>

        {/* REVENUE */}
        <Section title="Revenue" onExport={() => exportCSV('invoices_report.csv',
          ['Invoice', 'Organization', 'Amount', 'Status', 'Date'],
          filteredInvoices.map(i => [i.invoice_number, i.organizations?.name || '', i.amount, i.status, formatDate(i.created_at)])
        )}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatCard value={`${totalRevenue.toFixed(0)} QAR`} label="Collected" color="green" />
            <StatCard value={`${totalPending.toFixed(0)} QAR`} label="Pending" color="amber" />
            <StatCard value={filteredInvoices.length.toString()} label="Invoices" color="blue" />
          </div>
          <FilterChips value={invoiceFilter} options={[['all','All'],['paid','Paid'],['pending','Pending']]} onChange={setInvoiceFilter} />
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-3">
            {filteredInvoices.length === 0 ? <Empty /> : filteredInvoices.map((inv, i) => (
              <div key={inv.id} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{inv.invoice_number}</p>
                  <p className="text-xs text-gray-400">{inv.organizations?.name} · {formatDate(inv.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{inv.amount} QAR</span>
                  <Badge label={inv.status === 'paid' ? 'Paid' : 'Pending'} color={inv.status === 'paid' ? 'green' : 'amber'} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ENROLLMENTS */}
        <Section title="Enrollments" onExport={() => exportCSV('enrollments_report.csv',
          ['Customer', 'Package', 'Organization', 'Status', 'Sessions Left'],
          filteredEnrollments.map(e => [e.customers?.full_name || '', e.packages?.name || '', e.organizations?.name || '', e.status, e.sessions_remaining ?? ''])
        )}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatCard value={enrollments.filter(e => e.status === 'active').length.toString()} label="Active" color="green" />
            <StatCard value={enrollments.filter(e => e.status === 'active' && e.sessions_remaining != null && e.sessions_remaining <= 2).length.toString()} label="Expiring" color="amber" />
            <StatCard value={enrollments.filter(e => e.status === 'expired').length.toString()} label="Expired" color="red" />
          </div>
          <FilterChips value={enrollmentFilter} options={[['all','All'],['active','Active'],['expiring','Expiring'],['expired','Expired']]} onChange={setEnrollmentFilter} />
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-3">
            {filteredEnrollments.length === 0 ? <Empty /> : filteredEnrollments.map((e, i) => {
              const expiring = e.status === 'active' && e.sessions_remaining != null && e.sessions_remaining <= 2
              const label = expiring ? 'Expiring' : e.status === 'active' ? 'Active' : 'Expired'
              const color = expiring ? 'amber' : e.status === 'active' ? 'green' : 'red'
              return (
                <div key={e.id} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.customers?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{e.packages?.name || '—'} · {e.organizations?.name || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {e.sessions_remaining != null && <span className="text-sm font-bold text-gray-900">{e.sessions_remaining} left</span>}
                    <Badge label={label} color={color} />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* CUSTOMERS */}
        <Section title="Customers" onExport={() => exportCSV('customers_report.csv',
          ['Name', 'Mobile', 'Code', 'Status'],
          filteredCustomers.map(c => [c.full_name, c.mobile || '', c.customer_code || '', c.status])
        )}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatCard value={customers.length.toString()} label="Total" color="blue" />
            <StatCard value={customers.filter(c => c.status === 'active').length.toString()} label="Active" color="green" />
            <StatCard value={customers.filter(c => c.status !== 'active').length.toString()} label="Inactive" color="red" />
          </div>
          <FilterChips value={customerFilter} options={[['all','All'],['active','Active'],['inactive','Inactive']]} onChange={setCustomerFilter} />
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-3">
            {filteredCustomers.length === 0 ? <Empty /> : filteredCustomers.map((c, i) => {
              const orgNames = c.customer_organizations.map(o => o.organizations?.name).filter(Boolean).join(', ')
              return (
                <div key={c.id} className={`flex items-center justify-between px-5 py-3 ${i > 0 ? 'border-t border-gray-50' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{c.full_name}</p>
                    <p className="text-xs text-gray-400">{c.mobile || '—'} · {orgNames || '—'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.customer_code && <span className="text-xs text-gray-400 font-mono">{c.customer_code}</span>}
                    <Badge label={c.status === 'active' ? 'Active' : 'Inactive'} color={c.status === 'active' ? 'green' : 'red'} />
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, onExport, children }: { title: string; onExport: () => void; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onExport} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition">
          ↓ Export CSV
        </button>
      </div>
      {children}
    </div>
  )
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    green: 'text-green-600', amber: 'text-amber-600', blue: 'text-blue-600', red: 'text-red-500'
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function Badge({ label, color }: { label: string; color: string }) {
  const styles: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
    blue: 'bg-blue-50 text-blue-600',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[color]}`}>{label}</span>
}

function FilterChips({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      {options.map(([v, label]) => (
        <button key={v} onClick={() => onChange(v)}
          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${value === v ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          {label}
        </button>
      ))}
    </div>
  )
}

function Empty() {
  return <p className="text-center text-gray-400 text-sm py-8">No data found</p>
}
