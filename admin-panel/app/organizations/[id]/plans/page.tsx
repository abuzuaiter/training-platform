'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrgPlansPage() {
  const params = useParams()
  const id = params.id as string
  const [org, setOrg] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [orgPlans, setOrgPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ plan_id: '', start_date: '', billing_cycle: 'monthly' })

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [orgRes, plansRes, orgPlansRes] = await Promise.all([
      fetch(`/api/organizations/${id}`),
      fetch('/api/plans'),
      fetch(`/api/organizations/${id}/plans`)
    ])
    setOrg(orgRes.ok ? await orgRes.json() : null)
    const plansData = await plansRes.json()
    setPlans(Array.isArray(plansData) ? plansData : [])
    const orgPlansData = await orgPlansRes.json()
    setOrgPlans(Array.isArray(orgPlansData) ? orgPlansData : [])
    setLoading(false)
  }

  async function handleAssign() {
    if (!form.plan_id || !form.start_date) { setMessage('Plan and start date are required'); return }
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}/plans`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id })
    })
    const data = await res.json()
    if (res.ok) { setMessage('Plan assigned!'); setForm({ plan_id: '', start_date: '', billing_cycle: 'monthly' }); loadAll() }
    else { setMessage(data.error || 'Error') }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function markPaid(orgPlanId: string) {
    await fetch(`/api/organization-plans/${orgPlanId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: 'paid', paid_at: new Date().toISOString() })
    })
    loadAll()
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/organizations" className="text-gray-400 hover:text-gray-600 text-sm">Organizations</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/organizations/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">{org?.name}</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Plans</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Assign Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Assign New Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">PLAN *</label>
              <select value={form.plan_id} onChange={e => setForm({...form, plan_id: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="">Select plan...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {p.price} QAR</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE *</label>
              <input value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">BILLING CYCLE</label>
              <select value={form.billing_cycle} onChange={e => setForm({...form, billing_cycle: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <button onClick={handleAssign} disabled={saving}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
            {saving ? 'Assigning...' : 'Assign Plan'}
          </button>
        </div>

        {/* Plan History */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Plan History</h2>
          {orgPlans.length === 0 ? (
            <p className="text-sm text-gray-400">No plans assigned yet</p>
          ) : (
            <div className="space-y-3">
              {orgPlans.map(op => (
                <div key={op.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{op.plans?.name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(op.start_date).toLocaleDateString()} → {new Date(op.end_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-400">{op.billing_cycle}</p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{op.plans?.price} QAR</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${op.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                        {op.payment_status}
                      </span>
                    </div>
                    {op.payment_status !== 'paid' && (
                      <button onClick={() => markPaid(op.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-600 font-semibold hover:bg-green-100 transition">
                        Mark Paid
                      </button>
                    )}
                    <Link href={`/invoices`}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                      View Invoice
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
