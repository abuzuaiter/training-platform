'use client'
import AdminLayout from '../admin-layout'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  description: string | null
  max_customers: number
  max_staff: number
  price: number
  discount_percentage: number
  billing_cycle: string
  is_active: boolean
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', max_customers: '50', max_staff: '10',
    price: '', discount_percentage: '0', billing_cycle: 'monthly',
    type: 'sessions', sessions_count: '', absence_policy: 'deduct',
    enable_notification: true, is_active: true
  })

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/plans')
    setPlans(await res.json() || [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.name || !form.price) { setMessage('Name and price are required'); return }
    setSaving(true)
    const res = await fetch('/api/plans', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        max_customers: parseInt(form.max_customers),
        max_staff: parseInt(form.max_staff),
        price: parseFloat(form.price),
        discount_percentage: parseFloat(form.discount_percentage),
        sessions_count: form.type === 'sessions' ? parseInt(form.sessions_count) : null,
      })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Plan created!')
      setShowForm(false)
      setForm({ name: '', description: '', max_customers: '50', max_staff: '10', price: '', discount_percentage: '0', billing_cycle: 'monthly', type: 'sessions', sessions_count: '', absence_policy: 'deduct', enable_notification: true, is_active: true })
      load()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function toggleActive(plan: Plan) {
    await fetch(`/api/plans/${plan.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !plan.is_active })
    })
    load()
  }

  const typeColors: Record<string, string> = {
    single: 'bg-purple-50 text-purple-600',
    sessions: 'bg-blue-50 text-blue-600',
    open: 'bg-green-50 text-green-600',
  }

  const typeLabels: Record<string, string> = {
    single: 'Single Session',
    sessions: 'Multi Session',
    open: 'Open',
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-semibold text-sm">Plans</span>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + New Plan
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">PLAN NAME *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="e.g. Swimming Starter" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TYPE *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="single">Single Session — حصة واحدة</option>
                  <option value="sessions">Multi Session — عدد حصص</option>
                  <option value="open">Open — مفتوحة</option>
                </select>
              </div>
              {form.type === 'sessions' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">NUMBER OF SESSIONS *</label>
                  <input value={form.sessions_count} onChange={e => setForm({...form, sessions_count: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" min="1" placeholder="8" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR) *</label>
                <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" placeholder="400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">DISCOUNT %</label>
                <input value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" min="0" max="100" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MAX CUSTOMERS</label>
                <input value={form.max_customers} onChange={e => setForm({...form, max_customers: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MAX STAFF</label>
                <input value={form.max_staff} onChange={e => setForm({...form, max_staff: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" />
              </div>
              {form.type !== 'single' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">ABSENCE POLICY</label>
                  <select value={form.absence_policy} onChange={e => setForm({...form, absence_policy: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                    <option value="deduct">Deduct — تُحتسب الحصة</option>
                    <option value="reschedule">Reschedule — تتأجل</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">BILLING CYCLE</label>
                <select value={form.billing_cycle} onChange={e => setForm({...form, billing_cycle: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              {form.type !== 'single' && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.enable_notification}
                      onChange={e => setForm({...form, enable_notification: e.target.checked})}
                      className="w-4 h-4 accent-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Enable notification when sessions are about to end</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Plan'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No plans yet</div>
        ) : (
          <div className="grid gap-4">
            {plans.map(plan => (
              <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[plan.type] || 'bg-gray-50 text-gray-600'}`}>
                        {typeLabels[plan.type] || plan.type}
                      </span>
                      {plan.type === 'sessions' && plan.sessions_count && (
                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                          {plan.sessions_count} sessions
                        </span>
                      )}
                      {!plan.is_active && (
                        <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="flex gap-4 flex-wrap text-sm">
                      <span className="font-bold text-green-600">{plan.price} QAR</span>
                      {plan.discount_percentage > 0 && (
                        <span className="text-amber-600 text-xs">{plan.discount_percentage}% off</span>
                      )}
                      <span className="text-gray-400 text-xs">Max {plan.max_customers} customers</span>
                      <span className="text-gray-400 text-xs">Max {plan.max_staff} staff</span>
                      {plan.type !== 'single' && (
                        <span className="text-gray-400 text-xs">
                          Absence: {plan.absence_policy === 'deduct' ? 'تُحتسب' : 'تتأجل'}
                        </span>
                      )}
                      {plan.enable_notification && plan.type !== 'single' && (
                        <span className="text-blue-400 text-xs">🔔 Notifications on</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => toggleActive(plan)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ml-4 ${plan.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}