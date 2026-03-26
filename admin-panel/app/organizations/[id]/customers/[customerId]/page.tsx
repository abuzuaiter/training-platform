'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  full_name: string
  email: string | null
  mobile: string | null
  has_guardian: boolean
  guardian_email: string | null
  guardian_mobile: string | null
  subscription_price: number | null
  subscription_type: string
  subscription_start: string | null
  subscription_end: string | null
  payment_status: string
  notes: string | null
  status: string
}

export default function ManageCustomerPage() {
  const params = useParams()
  const id = params.id as string
  const customerId = params.customerId as string
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    has_guardian: false, guardian_email: '', guardian_mobile: '',
    subscription_price: '', subscription_type: 'monthly',
    subscription_start: '', subscription_end: '',
    payment_status: 'unpaid', notes: '', status: 'active'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (customerId) loadCustomer() }, [customerId])

  async function loadCustomer() {
    const res = await fetch(`/api/organizations/${id}/customers/${customerId}`)
    const data = await res.json()
    setForm({
      full_name: data.full_name || '',
      email: data.email || '',
      mobile: data.mobile || '',
      has_guardian: data.has_guardian || false,
      guardian_email: data.guardian_email || '',
      guardian_mobile: data.guardian_mobile || '',
      subscription_price: data.subscription_price?.toString() || '',
      subscription_type: data.subscription_type || 'monthly',
      subscription_start: data.subscription_start || '',
      subscription_end: data.subscription_end || '',
      payment_status: data.payment_status || 'unpaid',
      notes: data.notes || '',
      status: data.status || 'active'
    })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}/customers/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        subscription_price: form.subscription_price ? parseFloat(form.subscription_price) : null
      })
    })
    if (res.ok) setMessage('Saved successfully!')
    else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/organizations" className="text-gray-400 hover:text-gray-600 text-sm">Organizations</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/organizations/${id}/customers`} className="text-gray-400 hover:text-gray-600 text-sm">Customers</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">{form.full_name}</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{form.full_name}</h1>
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">FULL NAME *</label>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
              <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">SUBSCRIPTION TYPE</label>
              <select value={form.subscription_type} onChange={e => setForm({...form, subscription_type: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="session">Session</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR)</label>
              <input value={form.subscription_price} onChange={e => setForm({...form, subscription_price: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">PAYMENT STATUS</label>
              <select value={form.payment_status} onChange={e => setForm({...form, payment_status: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE</label>
              <input value={form.subscription_start} onChange={e => setForm({...form, subscription_start: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE</label>
              <input value={form.subscription_end} onChange={e => setForm({...form, subscription_end: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">STATUS</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.has_guardian} onChange={e => setForm({...form, has_guardian: e.target.checked})} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm font-medium text-gray-700">Has a Guardian</span>
              </label>
            </div>
            {form.has_guardian && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN EMAIL</label>
                  <input value={form.guardian_email} onChange={e => setForm({...form, guardian_email: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="email" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">GUARDIAN MOBILE</label>
                  <input value={form.guardian_mobile} onChange={e => setForm({...form, guardian_mobile: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">NOTES</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" rows={3} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => router.push(`/organizations/${id}/customers`)}
              className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}