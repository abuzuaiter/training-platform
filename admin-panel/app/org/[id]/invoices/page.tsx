'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrgInvoicesPage() {
  const params = useParams()
  const id = params.id as string
  const [invoices, setInvoices] = useState<any[]>([])
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [invRes, orgRes] = await Promise.all([
      fetch(`/api/org-invoices?org_id=${id}`),
      fetch(`/api/organizations/${id}`)
    ])
    setInvoices(invRes.ok ? await invRes.json() : [])
    setOrg(orgRes.ok ? await orgRes.json() : null)
    setLoading(false)
  }

  async function markPaid(invoiceId: string) {
    await fetch(`/api/org-invoices/${invoiceId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    })
    setMessage('Marked as paid!')
    setTimeout(() => setMessage(''), 3000)
    loadAll()
  }

  function handlePrint(invoice: any) {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>${invoice.invoice_number}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #1a1a2e; }
        .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .logo { width: 64px; height: 64px; object-fit: contain; }
        .invoice-num { font-size: 24px; font-weight: 800; color: #185FA5; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; }
        td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; }
        .total { font-weight: 800; font-size: 18px; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .paid { background: #dcfce7; color: #16a34a; }
        .pending { background: #fef3c7; color: #d97706; }
      </style></head><body>
      <div class="header">
        <div style="display:flex; align-items:center; gap:16px;">
          ${org?.logo_url ? `<img src="${org.logo_url}" class="logo" />` : ''}
          <div>
            <div style="font-size:20px; font-weight:800;">${org?.name || ''}</div>
            <div style="color:#64748b; font-size:13px;">${org?.email || ''}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="invoice-num">${invoice.invoice_number}</div>
          <div style="color:#64748b; font-size:13px;">${new Date(invoice.created_at).toLocaleDateString()}</div>
        </div>
      </div>
      <div style="margin-bottom:24px;">
        <div style="font-size:11px; font-weight:600; color:#64748b; margin-bottom:4px;">BILL TO</div>
        <div style="font-size:18px; font-weight:700;">${invoice.customers?.full_name || '—'}</div>
        <div style="color:#64748b;">${invoice.customers?.mobile || ''}</div>
      </div>
      <table>
        <tr><th>Description</th><th>Amount</th></tr>
        <tr><td>Training Package</td><td>${invoice.amount} QAR</td></tr>
        <tr><td class="total">Total</td><td class="total">${invoice.amount} QAR</td></tr>
      </table>
      <span class="status ${invoice.status}">${invoice.status === 'paid' ? 'PAID' : 'PENDING'}</span>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Invoices</h1>
        <p className="text-xs text-gray-400">{invoices.length} invoices</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-50 text-green-700 text-sm font-medium">{message}</div>
        )}

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
            <p className="text-2xl font-bold text-blue-600">{invoices.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 font-medium">No invoices yet</p>
            <p className="text-gray-400 text-sm mt-1">Invoices are created automatically when you enroll a customer</p>
          </div>
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
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
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
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        {inv.status !== 'paid' && (
                          <button onClick={() => markPaid(inv.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition">
                            Mark Paid
                          </button>
                        )}
                        <button onClick={() => handlePrint(inv)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                          Print
                        </button>
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
