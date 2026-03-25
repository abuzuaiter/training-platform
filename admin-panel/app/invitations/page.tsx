'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
  organization_id: string
}

interface Organization {
  id: string
  name: string
}

const roles = ['trainee', 'coach', 'parent', 'receptionist', 'admin']

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'trainee', organization_id: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const [invRes, orgRes] = await Promise.all([
      fetch('/api/invitations'),
      fetch('/api/organizations')
    ])
    const [invData, orgData] = await Promise.all([invRes.json(), orgRes.json()])
    setInvitations(invData || [])
    setOrganizations(orgData || [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.email || !form.organization_id) {
      setMessage('Email and organization are required')
      return
    }
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('Invitation sent successfully!')
      setForm({ email: '', role: 'trainee', organization_id: '' })
      setShowForm(false)
      loadData()
    } else {
      setMessage(data.error || 'Something went wrong')
    }
    setSaving(false)
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600',
    accepted: 'bg-green-50 text-green-600',
    expired: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Invitations</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
            <p className="text-gray-500 text-sm mt-1">{invitations.length} invitations total</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setMessage('') }}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + Send Invitation
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Invitation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL *</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  placeholder="trainee@email.com" type="email" />
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
                <label className="block text-xs font-semibold text-gray-500 mb-1">ROLE *</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Sending...' : 'Send Invitation'}
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
        ) : invitations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No invitations yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">EMAIL</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ORGANIZATION</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ROLE</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">SENT</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">EXPIRES</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv, i) => {
                  const org = organizations.find(o => o.id === inv.organization_id)
                  return (
                    <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{inv.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{org?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{inv.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[inv.status] || 'bg-gray-100 text-gray-500'}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{new Date(inv.expires_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
