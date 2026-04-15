'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const categories = [
  'Swimming', 'Football', 'Basketball', 'Tennis', 'Fitness & Gym',
  'Martial Arts', 'Yoga & Pilates', 'Online Activities', 'Academic Training', 'Other'
]

export default function ManageOrgPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [org, setOrg] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [orgPlan, setOrgPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    name: '', name_ar: '', email: '', phone: '', mobile: '',
    category: '', account_manager_id: '', logo_url: ''
  })

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [orgRes, usersRes, plansRes, orgPlanRes] = await Promise.all([
      fetch(`/api/organizations/${id}`),
      fetch('/api/users'),
      fetch('/api/plans'),
      fetch(`/api/organizations/${id}/plans`)
    ])
    const orgData = orgRes.ok ? await orgRes.json() : null
    if (orgData) {
      setOrg(orgData)
      setForm({
        name: orgData.name || '',
        name_ar: orgData.name_ar || '',
        email: orgData.email || '',
        phone: orgData.phone || '',
        mobile: orgData.mobile || '',
        category: orgData.category || '',
        account_manager_id: orgData.account_manager_id || '',
        logo_url: orgData.logo_url || ''
      })
    }
    const usersData = await usersRes.json()
    setUsers(Array.isArray(usersData) ? usersData : [])
    const plansData = await plansRes.json()
    setPlans(Array.isArray(plansData) ? plansData : [])
    const orgPlanData = await orgPlanRes.json()
    setOrgPlan(Array.isArray(orgPlanData) ? orgPlanData[0] : null)
    setLoading(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('org_id', id)
    const res = await fetch('/api/upload-logo', { method: 'POST', body: formData })
    if (res.ok) {
      const { url } = await res.json()
      setForm(prev => ({ ...prev, logo_url: url }))
      setMessage('Logo uploaded!')
      setTimeout(() => setMessage(''), 3000)
    }
    setUploadingLogo(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, account_manager_id: form.account_manager_id || null })
    })
    if (res.ok) { setMessage('Saved!'); loadAll() }
    else { setMessage('Error saving') }
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>
  if (!org) return <div className="text-center py-12 text-gray-400">Organization not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/organizations" className="text-gray-400 hover:text-gray-600 text-sm">Organizations</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">{org.name}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${org.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {org.status}
        </span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message === 'Saved!' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Organization Details */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Organization Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">NAME (English) *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">الاسم (عربي)</label>
              <input value={form.name_ar} onChange={e => setForm({...form, name_ar: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-right" dir="rtl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">CATEGORY</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="">Select category...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ACCOUNT MANAGER</label>
              <select value={form.account_manager_id} onChange={e => setForm({...form, account_manager_id: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="">No account manager</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" type="email" />
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
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/organizations"
              className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
              Back
            </Link>
          </div>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Plan & Billing</h2>
          {orgPlan ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{orgPlan.plans?.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(orgPlan.start_date).toLocaleDateString()} → {new Date(orgPlan.end_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${orgPlan.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                    {orgPlan.payment_status}
                  </span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{orgPlan.plans?.price} QAR</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No plan assigned yet</p>
          )}
          <Link href={`/organizations/${id}/plans`}
            className="mt-4 inline-block text-xs px-4 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition">
            Manage Plan
          </Link>
        </div>

      </div>
    </div>
  )
}
