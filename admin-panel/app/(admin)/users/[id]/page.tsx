'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  full_name: string
  email: string | null
  mobile: string | null
  created_at: string
  memberships: Array<{
    role: string
    status: string
    joined_at: string
    organizations: { id: string; name: string }
  }>
}

export default function UserPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', mobile: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (id) loadUser() }, [id])

  async function loadUser() {
    const res = await fetch(`/api/users/${id}`)
    const data = await res.json()
    setUser(data)
    setForm({
      full_name: data.full_name || '',
      email: data.email || '',
      mobile: data.mobile || '',
    })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMessage('Saved successfully!')
      loadUser()
    } else {
      const data = await res.json()
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/users" className="text-gray-400 hover:text-gray-600 text-sm">Users</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">{user.full_name}</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">FULL NAME</label>
              <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                type="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE</label>
              <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">JOINED</label>
              <input value={new Date(user.created_at).toLocaleDateString()} disabled
                className="w-full border border-gray-100 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => router.push('/users')}
              className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Back
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Organizations</h2>
          {user.memberships.length === 0 ? (
            <p className="text-sm text-gray-400">Not a member of any organization</p>
          ) : (
            <div className="space-y-3">
              {user.memberships.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{m.organizations?.name}</p>
                    <p className="text-xs text-gray-400">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{m.role}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{m.status}</span>
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
