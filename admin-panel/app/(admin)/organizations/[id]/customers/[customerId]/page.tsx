'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Customer {
  id: string
  customer_code: string
  full_name: string
  email: string | null
  mobile: string | null
  has_guardian: boolean
  guardian_email: string | null
  guardian_mobile: string | null
  notes: string | null
  status: string
}

interface Subscription {
  id: string
  subscription_type: string
  price: number
  start_date: string
  end_date: string
  payment_status: string
  notes: string | null
  created_at: string
}

export default function ManageCustomerPage() {
  const params = useParams()
  const id = params.id as string
  const customerId = params.customerId as string
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [form, setForm] = useState({
    full_name: '', email: '', mobile: '',
    has_guardian: false, guardian_email: '', guardian_mobile: '',
    notes: '', status: 'active'
  })
  const [subForm, setSubForm] = useState({
    subscription_type: 'monthly', price: '', start_date: '', end_date: '', payment_status: 'unpaid', notes: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subSaving, setSubSaving] = useState(false)
  const [showSubForm, setShowSubForm] = useState(false)
  const [message, setMessage] = useState('')
  const [subMessage, setSubMessage] = useState('')

  useEffect(() => { if (customerId) { loadCustomer(); loadSubscriptions() } }, [customerId])

  async function loadCustomer() {
    const res = await fetch(`/api/organizations/${id}/customers/${customerId}`)
    const data = await res.json()
    setCustomer(data)
    setForm({
      full_name: data.full_name || '',
      email: data.email || '',
      mobile: data.mobile || '',
      has_guardian: data.has_guardian || false,
      guardian_email: data.guardian_email || '',
      guardian_mobile: data.guardian_mobile || '',
      notes: data.notes || '',
      status: data.status || 'active'
    })
    setLoading(false)
  }

  async function loadSubscriptions() {
    const res = await fetch(`/api/customers/${customerId}/subscriptions`)
    const data = await res.json()
    setSubscriptions(data || [])
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}/customers/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) { setMessage('Saved successfully!'); loadCustomer() }
    else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  async function handleAddSubscription() {
    if (!subForm.price || !subForm.start_date || !subForm.end_date) {
      setSubMessage('Please fill all required fields')
      return
    }
    setSubSaving(true)
    const res = await fetch(`/api/customers/${customerId}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...subForm, organization_id: id, price: parseFloat(subForm.price) })
    })
    if (res.ok) {
      setSubMessage('Subscription added!')
      setSubForm({ subscription_type: 'monthly', price: '', start_date: '', end_date: '', payment_status: 'unpaid', notes: '' })
      setShowSubForm(false)
      loadSubscriptions()
    } else {
      const d = await res.json()
      setSubMessage(d.error || 'Error')
    }
    setSubSaving(false)
  }

  async function togglePayment(sub: Subscription) {
    await fetch(`/api/customers/${customerId}/subscriptions/${sub.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: sub.payment_status === 'paid' ? 'unpaid' : 'paid' })
    })
    loadSubscriptions()
  }

  async function deleteSub(subId: string) {
    await fetch(`/api/customers/${customerId}/subscriptions/${subId}`, { method: 'DELETE' })
    loadSubscriptions()
  }

  const activeSubscription = subscriptions.find(s => {
    const end = new Date(s.end_date)
    return end >= new Date()
  })

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {customer?.customer_code && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono">{customer.customer_code}</span>}
              {activeSubscription ? (
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Active Subscription</span>
              ) : (
                <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">No Active Subscription</span>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Customer Details */}
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

        {/* Subscriptions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Subscriptions ({subscriptions.length})</h2>
            <button onClick={() => setShowSubForm(!showSubForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              + Add Subscription
            </button>
          </div>

          {subMessage && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${subMessage.includes('added') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {subMessage}
            </div>
          )}

          {showSubForm && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">TYPE *</label>
                  <select value={subForm.subscription_type} onChange={e => setSubForm({...subForm, subscription_type: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option value="session">Session</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR) *</label>
                  <input value={subForm.price} onChange={e => setSubForm({...subForm, price: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" placeholder="200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE *</label>
                  <input value={subForm.start_date} onChange={e => setSubForm({...subForm, start_date: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE *</label>
                  <input value={subForm.end_date} onChange={e => setSubForm({...subForm, end_date: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">PAYMENT STATUS</label>
                  <select value={subForm.payment_status} onChange={e => setSubForm({...subForm, payment_status: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">NOTES</label>
                  <input value={subForm.notes} onChange={e => setSubForm({...subForm, notes: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Optional notes" />
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button onClick={handleAddSubscription} disabled={subSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {subSaving ? 'Saving...' : 'Add'}
                </button>
                <button onClick={() => setShowSubForm(false)}
                  className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {subscriptions.length === 0 ? (
            <p className="text-sm text-gray-400">No subscriptions yet</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.map(s => {
                const isActive = new Date(s.end_date) >= new Date()
                return (
                  <div key={s.id} className={`p-4 rounded-xl border ${isActive ? 'border-green-100 bg-green-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{s.price} QAR</span>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{s.subscription_type}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                            {s.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </span>
                          {isActive ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                          ) : (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Expired</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(s.start_date).toLocaleDateString()} → {new Date(s.end_date).toLocaleDateString()}
                        </p>
                        {s.notes && <p className="text-xs text-gray-400 mt-0.5">{s.notes}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => togglePayment(s)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${s.payment_status === 'paid' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                          {s.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                        <button onClick={() => deleteSub(s.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}