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
  const [editPkg, setEditPkg] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', price: '', total_sessions: '', capacity: '',
    absence_policy: 'deduct', notify_before_end: false, is_active: true
  })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/packages?org_id=${id}`)
    setPackages(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.name || !form.price || !form.total_sessions) { setMessage('Name, price and sessions are required'); return }
    setSaving(true)
    const res = await fetch('/api/packages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        organization_id: id,
        price: parseFloat(form.price),
        sessions_count: parseInt(form.total_sessions),
        capacity: form.capacity ? parseInt(form.capacity) : null,
      })
    })
    if (res.ok) {
      setMessage('Package created!')
      setShowForm(false)
      setForm({ name: '', price: '', total_sessions: '', capacity: '', absence_policy: 'deduct', notify_before_end: false, is_active: true })
      load()
    } else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleEdit(pkg: any) {
    setEditPkg(pkg)
    setForm({
      name: pkg.name, price: String(pkg.price), total_sessions: String(pkg.total_sessions || pkg.sessions_count || ''),
      capacity: String(pkg.capacity || ''), absence_policy: pkg.absence_policy || 'deduct',
      notify_before_end: pkg.notify_before_end || pkg.enable_notification || false, is_active: pkg.is_active
    })
  }

  async function handleSaveEdit() {
    if (!editPkg) return
    setSaving(true)
    const res = await fetch(`/api/packages/${editPkg.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, price: parseFloat(form.price),
        sessions_count: parseInt(form.total_sessions),
        capacity: form.capacity ? parseInt(form.capacity) : null,
        absence_policy: form.absence_policy,
        notify_before_end: form.notify_before_end,
        is_active: form.is_active
      })
    })
    if (res.ok) { setMessage('Updated!'); setEditPkg(null); load() }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function toggleActive(pkg: any) {
    await fetch(`/api/packages/${pkg.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pkg.is_active })
    })
    load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Packages</h1>
          <p className="text-xs text-gray-400">{packages.length} packages</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
          + New Package
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">New Package</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">NAME *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Beginners Swimming Package" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR) *</label>
                <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" placeholder="350" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TOTAL SESSIONS *</label>
                <input value={form.total_sessions} onChange={e => setForm({...form, total_sessions: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" placeholder="8" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" placeholder="10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ABSENCE POLICY</label>
                <select value={form.absence_policy} onChange={e => setForm({...form, absence_policy: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="deduct">Deduct — الغياب يُحسب حصة</option>
                  <option value="postpone">Postpone — يحق التعويض</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input type="checkbox" id="notify" checked={form.notify_before_end}
                  onChange={e => setForm({...form, notify_before_end: e.target.checked})}
                  className="w-4 h-4 accent-blue-600" />
                <label htmlFor="notify" className="text-sm text-gray-700 cursor-pointer">
                  إشعار عند اقتراب نهاية الحصص
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCreate} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
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
            <p className="text-gray-500 font-medium">No packages yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {packages.map(pkg => (
              <div key={pkg.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${!pkg.is_active ? 'opacity-60' : ''}`}>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{pkg.name}</p>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{pkg.price} QAR</span>
                      <span className="text-xs text-gray-500">{pkg.total_sessions || pkg.sessions_count} حصة</span>
                      {pkg.capacity && <span className="text-xs text-gray-500">Max: {pkg.capacity}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pkg.absence_policy === 'deduct' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                        {pkg.absence_policy === 'deduct' ? 'Deduct' : 'Postpone'}
                      </span>
                      {(pkg.notify_before_end || pkg.enable_notification) && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">إشعار مفعّل</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(pkg)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                      Edit
                    </button>
                    <button onClick={() => toggleActive(pkg)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${pkg.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                {editPkg?.id === pkg.id && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">NAME</label>
                        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE</label>
                        <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="number" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">SESSIONS</label>
                        <input value={form.total_sessions} onChange={e => setForm({...form, total_sessions: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="number" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                        <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="number" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">ABSENCE POLICY</label>
                        <select value={form.absence_policy} onChange={e => setForm({...form, absence_policy: e.target.value})}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
                          <option value="deduct">Deduct</option>
                          <option value="postpone">Postpone</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="checkbox" checked={form.notify_before_end}
                          onChange={e => setForm({...form, notify_before_end: e.target.checked})}
                          className="w-4 h-4 accent-blue-600" />
                        <label className="text-xs text-gray-600">إشعار عند اقتراب النهاية</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} disabled={saving}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditPkg(null)}
                        className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
