'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrgEnrollmentsPage() {
  const params = useParams()
  const id = params.id as string
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ customer_id: '', package_id: '', start_date: '' })

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [enrRes, custRes, pkgRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/packages?org_id=${id}`)
    ])
    setEnrollments(enrRes.ok ? await enrRes.json() : [])
    setCustomers(custRes.ok ? await custRes.json() : [])
    setPackages(pkgRes.ok ? await pkgRes.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.customer_id || !form.package_id) { setMessage('Customer and package are required'); return }
    setSaving(true)
    const res = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, organization_id: id })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Enrollment created!')
      setShowForm(false)
      setForm({ customer_id: '', package_id: '', start_date: '' })
      loadAll()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function handleCancel(enrollId: string) {
    await fetch(`/api/enrollments/${enrollId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
    loadAll()
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    completed: 'bg-blue-50 text-blue-600',
    cancelled: 'bg-red-50 text-red-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Enrollments</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + New Enrollment
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Enrollment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CUSTOMER *</label>
                <select value={form.customer_id} onChange={e => setForm({...form, customer_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PACKAGE *</label>
                <select value={form.package_id} onChange={e => setForm({...form, package_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="">Select package...</option>
                  {packages.filter(p => p.is_active).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — {p.price} QAR</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE</label>
                <input value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="date" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Enrollment'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-gray-500 font-medium">No enrollments yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {enrollments.map(enr => (
              <div key={enr.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                      {enr.customers?.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{enr.customers?.full_name}</p>
                      <p className="text-xs text-gray-400">{enr.packages?.name} — {enr.packages?.price} QAR</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[enr.status]}`}>
                        {enr.status}
                      </span>
                      {enr.sessions_remaining !== null && (
                        <p className={`text-xs mt-1 font-medium ${enr.sessions_remaining <= 2 ? 'text-amber-500' : 'text-gray-500'}`}>
                          {enr.sessions_remaining} sessions left
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Started: {new Date(enr.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    {enr.status === 'active' && (
                      <button onClick={() => handleCancel(enr.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
