'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function OrgPackagesPage() {
  const params = useParams()
  const id = params.id as string
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', type: 'sessions',
    sessions_count: '', price: '', absence_policy: 'deduct', enable_notification: true
  })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/packages?org_id=${id}`)
    setPackages(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.name || !form.price) { setMessage('Name and price are required'); return }
    setSaving(true)
    const res = await fetch('/api/packages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form, organization_id: id,
        price: parseFloat(form.price),
        sessions_count: form.type === 'sessions' ? parseInt(form.sessions_count) : null,
      })
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Package created!')
      setShowForm(false)
      setForm({ name: '', description: '', type: 'sessions', sessions_count: '', price: '', absence_policy: 'deduct', enable_notification: true })
      load()
    } else { setMessage(data.error || 'Error') }
    setSaving(false)
  }

  async function toggleActive(pkg: any) {
    await fetch(`/api/packages/${pkg.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pkg.is_active })
    })
    load()
  }

  async function handleDelete(pkgId: string) {
    await fetch(`/api/packages/${pkgId}`, { method: 'DELETE' })
    load()
  }

  const typeColors: Record<string, string> = {
    single: 'bg-purple-50 text-purple-700',
    sessions: 'bg-blue-50 text-blue-700',
    open: 'bg-green-50 text-green-700',
  }

  const typeLabels: Record<string, string> = {
    single: 'حصة واحدة',
    sessions: 'عدد حصص',
    open: 'مفتوحة',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Packages</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + New Package
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">PACKAGE NAME *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="e.g. باقة السباحة المبتدئ" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TYPE *</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="single">حصة واحدة — Single</option>
                  <option value="sessions">عدد حصص — Sessions</option>
                  <option value="open">مفتوحة — Open</option>
                </select>
              </div>
              {form.type === 'sessions' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">NUMBER OF SESSIONS *</label>
                  <input value={form.sessions_count} onChange={e => setForm({...form, sessions_count: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    type="number" min="1" placeholder="8" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR) *</label>
                <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" placeholder="400" />
              </div>
              {form.type !== 'single' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">ABSENCE POLICY</label>
                  <select value={form.absence_policy} onChange={e => setForm({...form, absence_policy: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                    <option value="deduct">تُحتسب — Deduct</option>
                    <option value="reschedule">تتأجل — Reschedule</option>
                  </select>
                </div>
              )}
              {form.type !== 'single' && (
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.enable_notification}
                      onChange={e => setForm({...form, enable_notification: e.target.checked})}
                      className="w-4 h-4 accent-blue-600" />
                    <span className="text-sm font-medium text-gray-700">تفعيل الإشعار عند اقتراب نهاية الحصص</span>
                  </label>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Optional..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Package'}
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
        ) : packages.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📦</div>
            <p className="text-gray-500 font-medium">No packages yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first package to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className={`bg-white rounded-2xl border p-5 ${pkg.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-bold text-gray-900">{pkg.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[pkg.type]}`}>
                        {typeLabels[pkg.type]}
                      </span>
                      {pkg.type === 'sessions' && pkg.sessions_count && (
                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                          {pkg.sessions_count} حصص
                        </span>
                      )}
                      {!pkg.is_active && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <div className="flex gap-4 flex-wrap text-sm items-center">
                      <span className="font-bold text-green-600">{pkg.price} QAR</span>
                      {pkg.type !== 'single' && (
                        <span className="text-gray-400 text-xs">غياب: {pkg.absence_policy === 'deduct' ? 'تُحتسب' : 'تتأجل'}</span>
                      )}
                      {pkg.enable_notification && pkg.type !== 'single' && (
                        <span className="text-blue-400 text-xs">🔔 إشعارات</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => toggleActive(pkg)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${pkg.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {pkg.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                    <button onClick={() => handleDelete(pkg.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition">
                      حذف
                    </button>
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
