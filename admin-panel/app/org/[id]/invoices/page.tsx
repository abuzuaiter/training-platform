'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { FileText, Check, Printer, DollarSign, Clock, Hash } from 'lucide-react'

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
        .invoice-num { font-size: 22px; font-weight: 800; color: #6FA3C5; }
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
      ${org?.stamp_url ? `<div class="stamp-section"><img src="${org.stamp_url}" class="stamp-img" alt="Stamp" /></div>` : ''}
      <div class="footer">
        <div class="disclaimer" dir="rtl"><strong>ملاحظة:</strong> هذه الفاتورة صادرة إلكترونيًا وهي وثيقة رسمية معتمدة. المبالغ المدفوعة غير قابلة للاسترداد بعد بدء الدورة. يُطَّبق نظام الغياب وفقًا لسياسة الباقة المشترك بها.<br>لأي استفسار يرجى التواصل معنا على &nbsp;<strong>Email:</strong> ${org?.email || '—'} &nbsp; <strong>Phone:</strong> ${org?.phone || org?.mobile || '—'}</div>
        <div class="disclaimer"><strong>Note:</strong> This is an electronically issued invoice and serves as an official document. Payments are non-refundable once the course has commenced. Absence policy is applied according to the enrolled package terms.<br>For any inquiries, please contact us at &nbsp;<strong>Email:</strong> ${org?.email || '—'} &nbsp; <strong>Phone:</strong> ${org?.phone || org?.mobile || '—'}</div>
      </div>
      </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0)

  const statCards = [
    { label: 'Collected',  value: `${totalPaid} QAR`,    icon: DollarSign, color: 'var(--green)',   bg: 'var(--green-dim)'   },
    { label: 'Pending',    value: `${totalPending} QAR`,  icon: Clock,      color: 'var(--warn)',    bg: 'var(--warn-dim)'    },
    { label: 'Total',      value: invoices.length,        icon: Hash,       color: 'var(--primary)', bg: 'var(--primary-dim)' },
  ]

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Invoices</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>{invoices.length} invoices</p>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>{message}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-ter)' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-ter)' }}>Loading...</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-ter)' }}>No invoices yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-ter)' }}>Invoices are created automatically when you enroll a customer</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--divider)', background: 'var(--bg)' }}>
                {['INVOICE','CUSTOMER','AMOUNT','STATUS','DATE','ACTIONS'].map(h => (
                  <th key={h} className="text-left px-5 py-3"
                    style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-ter)', letterSpacing: '0.5px' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--divider)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{inv.invoice_number}</span>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-sec)' }}>
                    {inv.customers?.full_name || '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>{inv.amount} QAR</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{
                      background: inv.status === 'paid' ? 'var(--green-dim)' : 'var(--warn-dim)',
                      color: inv.status === 'paid' ? 'var(--green)' : 'var(--warn)',
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-ter)' }}>
                    {new Date(inv.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      {inv.status !== 'paid' && (
                        <button onClick={() => markPaid(inv.id)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                          <Check size={11} /> Mark Paid
                        </button>
                      )}
                      <button onClick={() => handlePrint(inv)}
                        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                        <Printer size={11} /> Print
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
  )
}
