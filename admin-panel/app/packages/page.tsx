'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Organization { id: string; name: string }
interface Package {
  id: string; name: string; description: string | null; type: string
  sessions_count: number | null; price: number; capacity: number | null
  absence_policy: string | null; enable_notification: boolean; is_active: boolean
  organization_id: string; organizations?: { name: string }
}

export default function PackagesPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editPkg, setEditPkg] = useState<Package | null>(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '', description: '', price: '', sessions_count: '',
    capacity: '', type: 'sessions', absence_policy: 'deduct',
    enable_notification: true, organization_id: ''
  })

  useEffect(() => { loadOrgs() }, [])
  useEffect(() => { loadPackages() }, [selectedOrg])

  async function loadOrgs() {
    const res = await fetch('/api/reports/orgs')
    const data = res.ok ? await res.json() : []
    setOrgs(data)
  }

  async function loadPackages() {
    setLoading(true)
    const url = selectedOrg === 'all' ? '/api/packages?include_org=1' : `/api/packages?org_id=${selectedOrg}&include_org=1`
    const res = await fetch(url)
    setPackages(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.name || !form.price || !form.organization_id) {
      setMessage('Name, price and organization are required'); return
    }
    setSaving(true)
    const res = await fetch('/api/packages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: form.organization_id,
        name: form.name,
        description: form.description || null,
        type: form.type,
        sessions_count: form.type === 'sessions' ? parseInt(form.sessions_count) || null : null,
        price: parseFloat(form.price),
        capacity: form.capacity ? parseInt(form.capacity) : null,
        absence_policy: form.type !== 'single' ? form.absence_policy : null,
        enable_notification: form.type !== 'single' ? form.enable_notification : false,
      })
    })
    if (res.ok) {
      setMessage('Package created!')
      setShowForm(false)
      resetForm()
      loadPackages()
    } else {
      const d = await res.json(); setMessage(d.error || 'Error')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function handleSaveEdit() {
    if (!editPkg) return
    setSaving(true)
    const res = await fetch(`/api/packages/${editPkg.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || null,
        type: form.type,
        price: parseFloat(form.price),
        sessions_count: form.type === 'sessions' ? parseInt(form.sessions_count) || null : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
        absence_policy: form.type !== 'single' ? form.absence_policy : null,
        enable_notification: form.type !== 'single' ? form.enable_notification : false,
      })
    })
    if (res.ok) { setMessage('Updated!'); setEditPkg(null); loadPackages() }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  async function toggleActive(pkg: Package) {
    await fetch(`/api/packages/${pkg.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pkg.is_active })
    })
    loadPackages()
  }

  async function handleDelete(pkg: Package) {
    if (!confirm(`Delete "${pkg.name}"?`)) return
    await fetch(`/api/packages/${pkg.id}`, { method: 'DELETE' })
    loadPackages()
  }

  function startEdit(pkg: Package) {
    setEditPkg(pkg)
    setForm({
      name: pkg.name, description: pkg.description || '',
      price: String(pkg.price),
      sessions_count: String(pkg.sessions_count || ''),
      capacity: String(pkg.capacity || ''),
      type: pkg.type || 'sessions',
      absence_policy: pkg.absence_policy || 'deduct',
      enable_notification: pkg.enable_notification,
      organization_id: pkg.organization_id,
    })
    setShowForm(false)
  }

  function resetForm() {
    setForm({ name: '', description: '', price: '', sessions_count: '', capacity: '', type: 'sessions', absence_policy: 'deduct', enable_notification: true, organization_id: '' })
  }

  const typeLabel = (t: string) => ({ sessions: 'Multi Session', single: 'Single Session', open: 'Open' }[t] || t)

  const activeCount = packages.filter(p => p.is_active).length

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Packages</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Packages</h1>
            <p className="text-gray-500 text-sm mt-1">{packages.length} total · {activeCount} active</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditPkg(null); resetForm() }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + New Package
          </button>
        </div>

        {/* Org Filter */}
        <select value={selectedOrg} onChange={e => setSelectedOrg(e.target.value)}
          className="mb-6 border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 w-64">
          <option value="all">All Organizations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">New Package</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">ORGANIZATION *</label>
                <select value={form.organization_id} onChange={e => setForm({...form, organization_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400">
                  <option value="">Select organization...</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">NAME *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Beginners Swimming Package" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</label>
                <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">TYPE</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                  <option value="sessions">Multi Session</option>
                  <option value="single">Single Session</option>
                  <option value="open">Open</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR) *</label>
                <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" placeholder="350" />
              </div>
              {form.type === 'sessions' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">SESSIONS COUNT *</label>
                  <input value={form.sessions_count} onChange={e => setForm({...form, sessions_count: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                    type="number" placeholder="8" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="number" placeholder="10" />
              </div>
              {form.type !== 'single' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">ABSENCE POLICY</label>
                    <select value={form.absence_policy} onChange={e => setForm({...form, absence_policy: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                      <option value="deduct">Deduct — تُحتسب الحصة</option>
                      <option value="reschedule">Reschedule — تتأجل</option>
                    </select>
                  </div>
                  <div className="col-span-2 flex items-center gap-3">
                    <input type="checkbox" id="notify_create" checked={form.enable_notification}
                      onChange={e => setForm({...form, enable_notification: e.target.checked})}
                      className="w-4 h-4 accent-blue-600" />
                    <label htmlFor="notify_create" className="text-sm text-gray-700 cursor-pointer">
                      Notify when sessions are about to end
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-5">
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

        {/* Packages List */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : packages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No packages found</div>
        ) : (
          <div className="grid gap-3">
            {packages.map(pkg => (
              <div key={pkg.id} className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${!pkg.is_active ? 'opacity-60' : ''}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900">{pkg.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pkg.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {pkg.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
                          {typeLabel(pkg.type)}
                        </span>
                      </div>
                      {pkg.description && <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>}
                      {/* Org badge */}
                      {pkg.organizations?.name && (
                        <p className="text-xs text-gray-400 mt-1">🏢 {pkg.organizations.name}</p>
                      )}
                      <div className="flex gap-4 mt-3 flex-wrap">
                        <span className="text-sm font-bold text-green-600">{pkg.price} QAR</span>
                        {pkg.sessions_count && <span className="text-sm text-gray-500">{pkg.sessions_count} sessions</span>}
                        {pkg.capacity && <span className="text-sm text-gray-500">Cap: {pkg.capacity}</span>}
                        {pkg.absence_policy && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pkg.absence_policy === 'deduct' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                            {pkg.absence_policy === 'deduct' ? 'Deduct' : 'Reschedule'}
                          </span>
                        )}
                        {pkg.enable_notification && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600">Notifications on</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => startEdit(pkg)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
                        Edit
                      </button>
                      <button onClick={() => toggleActive(pkg)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${pkg.is_active ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {pkg.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDelete(pkg)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-50 text-gray-500 font-semibold hover:bg-red-50 hover:text-red-500 transition">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Edit inline */}
                  {editPkg?.id === pkg.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-1 py-4 mt-4 rounded-xl">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">NAME</label>
                          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</label>
                          <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">TYPE</label>
                          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
                            <option value="sessions">Multi Session</option>
                            <option value="single">Single Session</option>
                            <option value="open">Open</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">PRICE (QAR)</label>
                          <input value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="number" />
                        </div>
                        {form.type === 'sessions' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">SESSIONS</label>
                            <input value={form.sessions_count} onChange={e => setForm({...form, sessions_count: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="number" />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">CAPACITY</label>
                          <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400 bg-white" type="number" />
                        </div>
                        {form.type !== 'single' && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">ABSENCE POLICY</label>
                            <select value={form.absence_policy} onChange={e => setForm({...form, absence_policy: e.target.value})}
                              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none">
                              <option value="deduct">Deduct</option>
                              <option value="reschedule">Reschedule</option>
                            </select>
                          </div>
                        )}
                        {form.type !== 'single' && (
                          <div className="col-span-2 flex items-center gap-2">
                            <input type="checkbox" checked={form.enable_notification}
                              onChange={e => setForm({...form, enable_notification: e.target.checked})}
                              className="w-4 h-4 accent-blue-600" />
                            <label className="text-xs text-gray-600">Notify when sessions are about to end</label>
                          </div>
                        )}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
