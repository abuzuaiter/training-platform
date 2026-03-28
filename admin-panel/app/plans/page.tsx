'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  description: string | null
  max_customers: number
  price: number
  discount_percentage: number
  billing_cycle: string
  is_active: boolean
}

interface OrgPlan {
  id: string
  organization_id: string
  plan_id: string
  start_date: string
  end_date: string
  billing_cycle: string
  payment_status: string
  notes: string | null
  plans: Plan
}

interface Organization {
  id: string
  name: string
}

function ViewInvoiceButton({ orgPlanId }: { orgPlanId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/invoices?org_plan_id=' + orgPlanId)
    const data = await res.json()
    if (data && data.length > 0) {
      window.open('/invoices/' + data[0].id, '_blank')
    } else {
      alert('No invoice found for this plan')
    }
    setLoading(false)
  }

  return (
    <button onClick={handleClick} disabled={loading}
      className="text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 disabled:opacity-50">
      {loading ? '...' : 'View Invoice'}
    </button>
  )
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', max_customers: '', price: '', discount_percentage: '', billing_cycle: 'monthly' })
  const [assignForm, setAssignForm] = useState({ organization_id: '', plan_id: '', billing_cycle: 'monthly', start_date: '' })
  const [orgPlans, setOrgPlans] = useState<Record<string, OrgPlan[]>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editEndDate, setEditEndDate] = useState<{id: string, org_id: string, end_date: string} | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [pRes, oRes] = await Promise.all([fetch('/api/plans'), fetch('/api/organizations')])
    const [pData, oData] = await Promise.all([pRes.json(), oRes.json()])
    setPlans(pData || [])
    setOrganizations(oData || [])
    for (const org of (oData || [])) {
      const res = await fetch(`/api/organizations/${org.id}/plans`)
      const data = await res.json()
      setOrgPlans(prev => ({ ...prev, [org.id]: data || [] }))
    }
  }

  async function handleSubmit() {
    if (!form.name || !form.max_customers || !form.price) { setMessage('Please fill all required fields'); return }
    setSaving(true)
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Plan created successfully!')
      setForm({ name: '', description: '', max_customers: '', price: '', discount_percentage: '', billing_cycle: 'monthly' })
      setShowForm(false)
      loadAll()
    } else {
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  async function handleAssign() {
    if (!assignForm.organization_id || !assignForm.plan_id || !assignForm.start_date) {
      setMessage('Please fill all required fields')
      return
    }
    setSaving(true)
    const res = await fetch(`/api/organizations/${assignForm.organization_id}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...assignForm, payment_status: 'unpaid' })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Plan assigned successfully! Invoice created and sent.')
      setAssignForm({ organization_id: '', plan_id: '', billing_cycle: 'monthly', start_date: '' })
      setShowAssign(false)
      loadAll()
    } else {
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadAll()
  }

  async function togglePlanActive(plan: Plan) {
    await fetch(`/api/plans/${plan.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !plan.is_active })
    })
    loadAll()
  }

  async function handleUpdateEndDate() {
    if (!editEndDate) return
    await fetch(`/api/organization-plans/${editEndDate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ end_date: editEndDate.end_date })
    })
    setEditEndDate(null)
    loadAll()
  }

  const finalPrice = (plan: Plan) => {
    const discounted = plan.price * (1 - (plan.discount_percentage || 0) / 100)
    return discounted.toFixed(2)
  }

  const cycleLabel: Record<string, string> = {
    monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Plans</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
            <p className="text-gray-500 text-sm mt-1">{plans.length} plans total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowAssign(!showAssign); setMessage('') }}
              className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Assign Plan
            </button>
            <button onClick={() => { setShowForm(!showForm); setMessage('') }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              + New Plan
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') || message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PLAN NAME *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Starter" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MAX CUSTOMERS *</label>
                <input value={form.max_customers} onChange={e => setForm({...form, max_customers: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="50" type="number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR/cycle) *</label>
                <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="99" type="number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">BILLING CYCLE</label>
                <select value={form.billing_cycle} onChange={e => setForm({...form, billing_cycle: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="monthly">Monthly — شهري</option>
                  <option value="quarterly">Quarterly — ربع سنوي</option>
                  <option value="annual">Annual — سنوي</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">DISCOUNT (%)</label>
                <input value={form.discount_percentage} onChange={e => setForm({...form, discount_percentage: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="0" type="number" min="0" max="100" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Plan description..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Plan'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {showAssign && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Assign Plan to Organization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ORGANIZATION *</label>
                <select value={assignForm.organization_id} onChange={e => setAssignForm({...assignForm, organization_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Select organization...</option>
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PLAN *</label>
                <select value={assignForm.plan_id} onChange={e => setAssignForm({...assignForm, plan_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Select plan...</option>
                  {plans.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.max_customers} customers — {finalPrice(p)} QAR</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">BILLING CYCLE *</label>
                <select value={assignForm.billing_cycle} onChange={e => setAssignForm({...assignForm, billing_cycle: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="monthly">Monthly — شهري</option>
                  <option value="quarterly">Quarterly — ربع سنوي</option>
                  <option value="annual">Annual — سنوي</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE *</label>
                <input value={assignForm.start_date} onChange={e => setAssignForm({...assignForm, start_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleAssign} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Assigning...' : 'Assign Plan'}
              </button>
              <button onClick={() => setShowAssign(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {editEndDate && (
          <div className="bg-white rounded-2xl border border-amber-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Set End Date (Cancel Subscription)</h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE</label>
                <input value={editEndDate.end_date} onChange={e => setEditEndDate({...editEndDate, end_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
              </div>
              <button onClick={handleUpdateEndDate}
                className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition">
                Update
              </button>
              <button onClick={() => setEditEndDate(null)}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No plans yet — create your first plan</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {plans.map(plan => (
              <div key={plan.id} className={`bg-white rounded-2xl border p-6 ${plan.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                    {plan.description && <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Max Customers</span>
                    <span className="text-sm font-semibold text-gray-900">{plan.max_customers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Billing</span>
                    <span className="text-sm font-semibold text-gray-900">{cycleLabel[plan.billing_cycle] || 'Monthly'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Price</span>
                    <div className="text-right">
                      {plan.discount_percentage > 0 ? (
                        <span className="text-sm font-bold text-green-600">{finalPrice(plan)} QAR <span className="text-xs text-gray-400 line-through ml-1">{plan.price}</span> <span className="text-xs bg-green-50 text-green-600 px-1 rounded">-{plan.discount_percentage}%</span></span>
                      ) : (
                        <span className="text-sm font-bold text-gray-900">{plan.price} QAR</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => togglePlanActive(plan)}
                    className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition ${plan.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {plan.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  {deleteConfirm === plan.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(plan.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-600 text-white font-semibold">Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-semibold">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(plan.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {organizations.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Organization Plans</h2>
            <div className="space-y-4">
              {organizations.map(org => (
                <div key={org.id} className="border border-gray-100 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2">{org.name}</h3>
                  {(orgPlans[org.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-400">No plan assigned</p>
                  ) : (
                    <div className="space-y-2">
                      {(orgPlans[org.id] || []).map(op => {
                        const isActive = new Date(op.end_date) >= new Date()
                        return (
                          <div key={op.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{op.plans?.name}</span>
                              <span className="ml-2 text-xs text-gray-400">
                                {new Date(op.start_date).toLocaleDateString()} → {new Date(op.end_date).toLocaleDateString()}
                              </span>
                              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                                {cycleLabel[op.billing_cycle] || 'Monthly'}
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <ViewInvoiceButton orgPlanId={op.id} />
                              <button onClick={() => setEditEndDate({ id: op.id, org_id: org.id, end_date: op.end_date })}
                                className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 font-semibold hover:bg-amber-100">
                                Set End Date
                              </button>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${op.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                {op.payment_status}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                {isActive ? 'Active' : 'Expired'}
                              </span>
                              <button onClick={async () => { await fetch(`/api/organization-plans/${op.id}`, { method: 'DELETE' }); loadAll() }}
                                className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}