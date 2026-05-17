'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: string
  type: string
  issued_at: string
  paid_at: string | null
  notes: string | null
  organizations: { id: string; name: string; email: string | null; mobile: string | null; phone: string | null }
  organization_plans: {
    start_date: string
    end_date: string
    billing_cycle: string
    plans: { name: string; max_customers: number }
  } | null
}

export default function InvoicePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)

  useEffect(() => { if (id) loadInvoice() }, [id])

  async function loadInvoice() {
    const res = await fetch(`/api/invoices/${id}`)
    const data = await res.json()
    setInvoice(data)
    setLoading(false)
  }

  async function markPaid() {
    setMarking(true)
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid' })
    })
    if (res.ok) loadInvoice()
    setMarking(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!invoice) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Not found</div>

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
        {/* Actions Bar - hidden on print */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <button onClick={() => router.push('/invoices')}
            className="text-gray-500 hover:text-gray-700 text-sm font-medium">
            ← Back to Invoices
          </button>
          <div className="flex gap-3">
            {invoice.status === 'pending' && (
              <button onClick={markPaid} disabled={marking}
                className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50">
                {marking ? 'Processing...' : '✓ Mark as Paid'}
              </button>
            )}
            <button onClick={() => window.print()}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              🖨️ Print / Save PDF
            </button>
          </div>
        </div>

        {/* Invoice */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden print:rounded-none print:shadow-none" id="invoice" style={{width:'210mm', minHeight:'297mm'}}>
          {/* Header */}
          <div style={{background: '#185FA5'}} className="px-10 py-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">موعد — Mawid</h1>
                <p className="text-blue-200 text-sm mt-1">Smart Appointment Management</p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold text-xl">{invoice.type === 'receipt' ? 'RECEIPT' : 'INVOICE'}</p>
                <p className="text-blue-200 font-mono text-sm mt-1">{invoice.invoice_number}</p>
              </div>
            </div>
          </div>

          {/* Status Banner */}
          {invoice.status === 'paid' && (
            <div className="bg-green-50 border-b border-green-100 px-10 py-3 flex items-center gap-2">
              <span className="text-green-600 font-bold text-sm">✅ PAID</span>
              {invoice.paid_at && <span className="text-green-500 text-xs">on {new Date(invoice.paid_at).toLocaleDateString()}</span>}
            </div>
          )}
          {invoice.status === 'pending' && (
            <div className="bg-amber-50 border-b border-amber-100 px-10 py-3">
              <span className="text-amber-600 font-bold text-sm">⏳ PAYMENT PENDING</span>
            </div>
          )}

          <div className="px-10 py-8">
            {/* Bill To / Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold text-gray-400 mb-2">BILL TO</p>
                <p className="font-bold text-gray-900 text-lg">{invoice.organizations?.name}</p>
                {invoice.organizations?.email && <p className="text-gray-500 text-sm">{invoice.organizations.email}</p>}
                {invoice.organizations?.mobile && <p className="text-gray-500 text-sm">{invoice.organizations.mobile}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 mb-2">INVOICE DETAILS</p>
                <p className="text-sm text-gray-600">Issue Date: <span className="font-medium text-gray-900">{new Date(invoice.issued_at).toLocaleDateString()}</span></p>
                {invoice.paid_at && <p className="text-sm text-gray-600 mt-1">Paid Date: <span className="font-medium text-green-600">{new Date(invoice.paid_at).toLocaleDateString()}</span></p>}
                {invoice.organization_plans && (
                  <p className="text-sm text-gray-600 mt-1">Period: <span className="font-medium text-gray-900">{new Date(invoice.organization_plans.start_date).toLocaleDateString()} → {new Date(invoice.organization_plans.end_date).toLocaleDateString()}</span></p>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
              <thead>
                <tr style={{background: '#f8fafc'}} className="border border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">DESCRIPTION</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">CYCLE</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500">MAX CUSTOMERS</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border border-gray-200 border-t-0">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-gray-900">{invoice.organization_plans?.plans?.name || 'Subscription Plan'}</p>
                    {invoice.notes && <p className="text-xs text-gray-400 mt-1">{invoice.notes}</p>}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600 capitalize">{invoice.organization_plans?.billing_cycle || 'Monthly'}</td>
                  <td className="px-4 py-4 text-sm text-gray-600">{invoice.organization_plans?.plans?.max_customers || '—'}</td>
                  <td className="px-4 py-4 text-right font-bold text-gray-900">{invoice.amount.toFixed(2)} QAR</td>
                </tr>
              </tbody>
            </table>

            {/* Total */}
            <div className="flex justify-end mb-8">
              <div className="w-64">
                <div className="flex justify-between py-2 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Subtotal</span>
                  <span className="text-sm text-gray-900">{invoice.amount.toFixed(2)} QAR</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900">
                  <span className="font-bold text-gray-900">Total Due</span>
                  <span className="font-bold text-gray-900 text-lg">{invoice.amount.toFixed(2)} QAR</span>
                </div>
              </div>
            </div>

            {/* Stamp + Footer */}
            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-end mb-4">
                <img
                  src="https://fgvasfyctknpoweinsre.supabase.co/storage/v1/object/public/org-assets/stamps/Company.jpg"
                  alt="Company Stamp"
                  style={{ width: 120, height: 120, objectFit: 'contain', opacity: 0.9 }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Thank you for your business!</p>
                <p className="text-xs text-gray-400 mt-1">موعد — Mawid | Smart Appointment Management Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}