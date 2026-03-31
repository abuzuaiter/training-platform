'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrgInvitationsPage() {
  const params = useParams()
  const id = params.id as string
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('trainee')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/invitations?org_id=${id}`)
    setInvitations(await res.json() || [])
    setLoading(false)
  }

  async function handleSend() {
    if (!email) { setMessage('Email is required'); return }
    setSending(true)
    const res = await fetch('/api/invitations', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role, organization_id: id })
    })
    const data = await res.json()
    if (res.ok) { setMessage('Invitation sent!'); setEmail(''); load() }
    else { setMessage(data.error || 'Error') }
    setSending(false)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600', accepted: 'bg-green-50 text-green-600', expired: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/org/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Invitations</span>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Invitations</h1>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Send Invitation</h2>
          {message && <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="member@email.com" type="email" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ROLE</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none">
                <option value="trainee">Trainee</option>
                <option value="coach">Coach</option>
                <option value="receptionist">Receptionist</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <button onClick={handleSend} disabled={sending} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">{sending ? 'Sending...' : 'Send Invitation'}</button>
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : invitations.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No invitations sent yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">EMAIL</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ROLE</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">STATUS</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">SENT</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv, i) => (
                  <tr key={inv.id} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-4 text-sm text-gray-900">{inv.email}</td>
                    <td className="px-6 py-4"><span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{inv.role}</span></td>
                    <td className="px-6 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] || 'bg-gray-100 text-gray-500'}`}>{inv.status}</span></td>
                    <td className="px-6 py-4 text-xs text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
