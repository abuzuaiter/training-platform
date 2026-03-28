'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Activity {
  id: string
  name: string
  description: string | null
  organization_id: string
  start_date: string
  end_date: string
  enrollment_type: string
  created_at: string
  organizations: { name: string }
}

interface Organization {
  id: string
  name: string
}

const enrollmentTypeColor: Record<string, string> = {
  fixed: 'bg-blue-50 text-blue-600',
  open: 'bg-green-50 text-green-600',
  private: 'bg-purple-50 text-purple-600',
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', organization_id: '', start_date: '', end_date: '', enrollment_type: 'fixed' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [cRes, oRes] = await Promise.all([fetch('/api/activities'), fetch('/api/organizations')])
    const [cData, oData] = await Promise.all([cRes.json(), oRes.json()])
    setActivities(cData || [])
    setOrganizations(oData || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.name || !form.organization_id || !form.start_date || !form.end_date) {
      setMessage('Please fill all required fields')
      return
    }
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Activity created successfully!')
      setForm({ name: '', description: '', organization_id: '', start_date: '', end_date: '', enrollment_type: 'fixed' })
      setShowForm(false)
      loadData()
    } else {
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/activities/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadData()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Activities</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-gray-500 text-sm mt-1">{activities.length} activities total</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setMessage('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + Add Activity
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">COURSE NAME *</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Swimming Level 1" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ORGANIZATION *</label>
                <select value={form.organization_id} onChange={e => setForm({...form, organization_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">Select organization...</option>
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">ENROLLMENT TYPE *</label>
                <select value={form.enrollment_type} onChange={e => setForm({...form, enrollment_type: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  <option value="fixed">Fixed — محدد بتاريخ</option>
                  <option value="open">Open — مفتوح</option>
                  <option value="private">Private — خاص</option>
                  <option value="session">Session — حصة واحدة</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE *</label>
                <input value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="date" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE *</label>
                <input value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  type="date" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="Activity description..." rows={3} />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Activity'}
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
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No activities yet</div>
        ) : (
          <div className="grid gap-4">
            {activities.map(activity => (
              <div key={activity.id} className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl">📚</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${enrollmentTypeColor[activity.enrollment_type] || 'bg-gray-100 text-gray-500'}`}>
                        {activity.enrollment_type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{activity.organizations?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(activity.start_date).toLocaleDateString()} → {new Date(activity.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/activities/${activity.id}`}
                    className="text-sm text-blue-600 font-semibold hover:underline px-3 py-1.5">
                    Manage
                  </Link>
                  {deleteConfirm === activity.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(activity.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold">Confirm</button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-semibold">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(activity.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">
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
