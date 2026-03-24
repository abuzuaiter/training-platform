'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  name_ar: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  category: string | null
  status: string
  created_at: string
}

const categories = [
  'Swimming', 'Football', 'Basketball', 'Tennis', 'Fitness & Gym',
  'Martial Arts', 'Yoga & Pilates', 'Online Courses', 'Academic Training', 'Other'
]

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', name_ar: '', email: '', phone: '', mobile: '', admin_email: '', category: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { loadOrgs() }, [])

  async function loadOrgs() {
    setLoading(true)
    const res = await fetch('/api/organizations')
    const data = await res.json()
    setOrgs(data || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.name) { setMessage('Organization name is required'); return }
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/organizations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.error || 'Something went wrong')
    } else {
      setMessage('Organization created successfully!')
      setForm({ name: '', name_ar: '', email: '', phone: '', mobile: '', admin_email: '', category: '' })
      setShowForm(false)
      loadOrgs()
    }
    setSaving(false)
  }

  async function toggleStatus(org: Organization) {
    const newStatus = org.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/organizations/${org.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    loadOrgs()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/organizations/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadOrgs()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Organizations</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-500 text-sm mt-1">{orgs.length} organizations total</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setMessage('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + Add Organization
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Organization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">NAME (English) *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Swimming Club" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">الاسم (عربي)</label>
                <input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-right"
                  placeholder="نادي السباحة" dir="rtl" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">CATEGORY</label>
                <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ADMIN EMAIL</label>
                <input value={form.admin_email} onChange={e => setForm({...form, admin_email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="admin@club.com" type="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="info@club.com" type="email" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">PHONE</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="+97444123456" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
                <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="+97455123456" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Organization'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No organizations yet</div>
        ) : (
          <div className="grid gap-4">
            {orgs.map(org => (
              <div key={org.id} className={`bg-white rounded-2xl border p-6 flex items-center justify-between ${org.status === 'inactive' ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${org.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      {org.category && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">{org.category}</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${org.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {org.status}
                      </span>
                    </div>
                    {org.name_ar && <p className="text-sm text-gray-500" dir="rtl">{org.name_ar}</p>}
                    <div className="flex gap-3 mt-1">
                      {org.email && <span className="text-xs text-gray-400">{org.email}</span>}
                      {org.mobile && <span className="text-xs text-gray-400">{org.mobile}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/organizations/${org.id}`}
                    className="text-sm text-blue-600 font-semibold hover:underline px-3 py-1.5">
                    Manage
                  </Link>
                  <button onClick={() => toggleStatus(org)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${org.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                    {org.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  {deleteConfirm === org.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(org.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(org.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition">
                      Delete
                    </button>
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
