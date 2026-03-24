'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const categories = [
  'Swimming', 'Football', 'Basketball', 'Tennis', 'Fitness & Gym',
  'Martial Arts', 'Yoga & Pilates', 'Online Courses', 'Academic Training', 'Other'
]

interface Organization {
  id: string
  name: string
  name_ar: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  category: string | null
  status: string
}

export default function ManageOrgPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [form, setForm] = useState({ name: '', name_ar: '', email: '', phone: '', mobile: '', category: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (id) loadOrg() }, [id])

  async function loadOrg() {
    const res = await fetch(`/api/organizations/${id}`)
    const data = await res.json()
    setOrg(data)
    setForm({
      name: data.name || '',
      name_ar: data.name_ar || '',
      email: data.email || '',
      phone: data.phone || '',
      mobile: data.mobile || '',
      category: data.category || '',
    })
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name) { setMessage('Name is required'); return }
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMessage('Saved successfully!')
      loadOrg()
    } else {
      const data = await res.json()
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  async function toggleStatus() {
    const newStatus = org?.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/organizations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    loadOrg()
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!org) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/organizations" className="text-gray-400 hover:text-gray-600 text-sm">Organizations</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">{org.name}</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${org.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {org.status}
            </span>
          </div>
          <button onClick={toggleStatus}
            className={`text-sm px-4 py-2 rounded-xl font-semibold transition ${org.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
            {org.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Organization Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">NAME (English) *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">الاسم (عربي)</label>
              <input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-right"
                dir="rtl" />
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
              <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                type="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">PHONE</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
              <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => router.push('/organizations')}
              className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
