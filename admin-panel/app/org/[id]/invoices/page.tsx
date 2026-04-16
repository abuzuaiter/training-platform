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
    const invNum = invoice.invoice_number
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
      <html><head><title>${invNum}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 48px; color: #1a1a2e; background: white; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
        .logo { width: 72px; height: 72px; object-fit: contain; }
        .org-name { font-size: 22px; font-weight: 800; color: #1a1a2e; }
        .org-info { font-size: 13px; color: #64748b; margin-top: 4px; }
        .invoice-num { font-size: 22px; font-weight: 800; color: #185FA5; }
        .invoice-date { font-size: 13px; color: #64748b; margin-top: 4px; }
        .bill-to { margin-bottom: 28px; }
        .label { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 1px; margin-bottom: 6px; }
        .customer-name { font-size: 18px; font-weight: 700; }
        .customer-info { font-size: 13px; color: #64748b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { background: #f8fafc; padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
        td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .total-row td { font-weight: 800; font-size: 16px; background: #f8fafc; border-top: 2px solid #e2e8f0; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; }
        .paid-badge { background: #dcfce7; color: #16a34a; }
        .pending-badge { background: #fef3c7; color: #d97706; }
        .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
        .disclaimer { font-size: 11px; color: #94a3b8; line-height: 1.6; margin-bottom: 12px; }
        .stamp-section { display: flex; justify-content: flex-end; margin-top: 24px; }
        .stamp-img { width: 100px; height: 100px; object-fit: contain; opacity: 0.85; }
      </style></head><body>
      <div class="header">
        <div style="display:flex; align-items:center; gap:16px;">
          ${org?.logo_url ? `<img src="${org.logo_url}" class="logo" />` : ''}
          <div>
            <div class="org-name">${org?.name || ''}</div>
            <div class="org-info">${org?.email || ''}</div>
            <div class="org-info">${org?.phone || org?.mobile || ''}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="invoice-num">${invNum}</div>
          <div class="invoice-date">Date: ${new Date(invoice.created_at).toLocaleDateString('en-GB')}</div>
          ${invoice.status === 'paid' ? `<div class="invoice-date">Paid: ${new Date(invoice.paid_at).toLocaleDateString('en-GB')}</div>` : ''}
        </div>
      </div>

      <div class="bill-to">
        <div class="label">BILL TO</div>
        <div class="customer-name">${invoice.customers?.full_name || '—'}</div>
        <div class="customer-info">${invoice.customers?.mobile || ''}</div>
      </div>

      <table>
        <tr>
          <th>DESCRIPTION</th>
          <th>SUBSCRIPTION PERIOD</th>
          <th style="text-align:right;">AMOUNT</th>
        </tr>
        <tr>
          <td>${invoice.enrollments?.packages?.name || 'Training Package'}</td>
          <td>${invoice.enrollments?.packages?.sessions_count ? invoice.enrollments.packages.sessions_count + ' Sessions' : '—'}</td>
          <td style="text-align:right;">${invoice.amount} QAR</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">Total</td>
          <td style="text-align:right;">${invoice.amount} QAR</td>
        </tr>
      </table>

      <div style="margin-top:16px;">
        <span class="status-badge ${invoice.status === 'paid' ? 'paid-badge' : 'pending-badge'}">
          ${invoice.status === 'paid' ? '✓ PAID' : 'PAYMENT PENDING'}
        </span>
      </div>

      ${org?.stamp_url ? `
      <div class="stamp-section">
        <img src="${org.stamp_url}" class="stamp-img" alt="Stamp" />
      </div>` : ''}

      <div class="footer">
        <div class="disclaimer">
          <strong>ملاحظة:</strong> هذه الفاتورة صادرة إلكترونياً وهي وثيقة رسمية معتمدة. المبالغ المدفوعة غير قابلة للاسترداد بعد بدء الدورة. يُطبَّق نظام الغياب وفقاً لسياسة الباقة المشترك بها. لأي استفسار يرجى التواصل معنا عبر ${org?.email || '[email/number]'}.
        </div>
        <div class="disclaimer">
          <strong>Note:</strong> This is an electronically issued invoice and serves as an official document. Payments are non-refundable once the course has commenced. Absence policy is applied according to the enrolled package terms. For inquiries, please contact us at ${org?.email || '[email/number]'}.
        </div>
      </div>
      </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
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
