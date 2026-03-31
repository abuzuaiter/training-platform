'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrgSubscriptionsPage() {
  const params = useParams()
  const id = params.id as string
  const [customers, setCustomers] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [subForm, setSubForm] = useState({ subscription_type: 'monthly', price: '', start_date: '', end_date: '', payment_status: 'unpaid', notes: '' })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/organizations/${id}/customers`)
    const cData = await res.json() || []
    setCustomers(cData)
    const allSubs: any[] = []
    for (const c of cData) {
      const subRes = await fetch(`/api/customers/${c.id}/subscriptions`)
      const subData = await subRes.json() || []
      for (const s of subData) allSubs.push({ ...s, customer: c })
    }
    setSubscriptions(allSubs)
    setLoading(false)
  }

  async function handleAddSub(customerId: string) {
    if (!subForm.price || !subForm.start_date || !subForm.end_date) { setMessage('Please fill all required fields'); return }
    setSaving(true)
    const res = await fetch(`/api/customers/${customerId}/subscriptions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...subForm, organization_id: id, price: parseFloat(subForm.price) })
    })
    if (res.ok) { setMessage('Subscription added!'); setShowForm(null); setSubForm({ subscription_type: 'monthly', price: '', start_date: '', end_date: '', payment_status: 'unpaid', notes: '' }); load() }
    else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  async function togglePayment(sub: any) {
    await fetch(`/api/customers/${sub.customer.id}/subscriptions/${sub.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: sub.payment_status === 'paid' ? 'unpaid' : 'paid' })
    })
    load()
  }

  const today = new Date()
  const filtered = subscriptions.filter(s => {
    const isActive = new Date(s.end_date) >= today
    const matchSearch = s.customer?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? isActive : !isActive)
    return matchSearch && matchStatus
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/org/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Subscriptions</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} subscriptions</p>
          </div>
          <select value={showForm || ''} onChange={e => setShowForm(e.target.value || null)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
            <option value="">+ Add Subscription</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
        </div>

        {message && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('added') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Subscription for {customers.find(c => c.id === showForm)?.full_name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TYPE</label>
                <select value={subForm.subscription_type} onChange={e => setSubForm({...subForm, subscription_type: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="session">Session</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR)</label>
                <input value={subForm.price} onChange={e => setSubForm({...subForm, price: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="number" placeholder="200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE</label>
                <input value={subForm.start_date} onChange={e => setSubForm({...subForm, start_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE</label>
                <input value={subForm.end_date} onChange={e => setSubForm({...subForm, end_date: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="date" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PAYMENT</label>
                <select value={subForm.payment_status} onChange={e => setSubForm({...subForm, payment_status: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleAddSub(showForm)} disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">{saving ? 'Saving...' : 'Add'}</button>
              <button onClick={() => setShowForm(null)} className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">Cancel</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Search customer..." />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No subscriptions yet</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => {
              const isActive = new Date(s.end_date) >= today
              return (
                <div key={s.id} className={`bg-white rounded-2xl border p-4 ${isActive ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{s.customer?.full_name}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{s.subscription_type}</span>
                        <span className="text-xs font-medium text-gray-900">{s.price} QAR</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{s.payment_status}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{isActive ? 'Active' : 'Expired'}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(s.start_date).toLocaleDateString()} → {new Date(s.end_date).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => togglePayment(s)} className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${s.payment_status === 'paid' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {s.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
