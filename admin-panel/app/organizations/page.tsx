'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Plus, ChevronRight } from 'lucide-react'

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
  account_manager?: { full_name?: string; email?: string }
}

const categories = [
  'Swimming', 'Football', 'Basketball', 'Tennis', 'Fitness & Gym',
  'Martial Arts', 'Yoga & Pilates', 'Online Activities', 'Academic Training', 'Other'
]

const inputStyle = {
  width: '100%',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '8px 12px',
  fontSize: '14px',
  outline: 'none',
  background: 'var(--surface)',
  color: 'var(--ink)',
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', name_ar: '', email: '', phone: '', mobile: '', admin_email: '', category: '', account_manager_id: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => { loadOrgs(); loadUsers() }, [])

  async function loadUsers() {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
  }

  async function loadOrgs() {
    setLoading(true)
    const res = await fetch('/api/organizations')
    const data = await res.json()
    setOrgs(Array.isArray(data) ? data : [])
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
      setForm({ name: '', name_ar: '', email: '', phone: '', mobile: '', admin_email: '', category: '', account_manager_id: '' })
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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="px-6 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" style={{ color: 'var(--text-ter)' }} className="hover:underline">Dashboard</Link>
          <ChevronRight size={14} style={{ color: 'var(--text-ter)' }} />
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>Organizations</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Title row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Organizations</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>{orgs.length} organizations total</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setMessage('') }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition"
            style={{ background: 'var(--primary)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <Plus size={15} />
            Add Organization
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: message.includes('success') ? 'var(--green-dim)' : 'var(--danger-dim)',
              color:      message.includes('success') ? 'var(--green)'     : 'var(--danger)',
            }}>
            {message}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--ink)' }}>New Organization</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'NAME (English) *', key: 'name',          placeholder: 'Swimming Club',      type: 'text' },
                { label: 'الاسم (عربي)',      key: 'name_ar',       placeholder: 'نادي السباحة',       type: 'text', rtl: true },
                { label: 'ADMIN EMAIL',       key: 'admin_email',   placeholder: 'admin@club.com',     type: 'email' },
                { label: 'EMAIL',             key: 'email',         placeholder: 'info@club.com',      type: 'email' },
                { label: 'PHONE',             key: 'phone',         placeholder: '+97444123456',       type: 'text' },
                { label: 'MOBILE',            key: 'mobile',        placeholder: '+97455123456',       type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-ter)' }}>{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    style={{ ...inputStyle, ...(f.rtl ? { textAlign: 'right' } : {}) }}
                    placeholder={f.placeholder}
                    type={f.type}
                    dir={f.rtl ? 'rtl' : undefined}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-ter)' }}>CATEGORY</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}>
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-ter)' }}>ACCOUNT MANAGER</label>
                <select value={form.account_manager_id} onChange={e => setForm({ ...form, account_manager_id: e.target.value })}
                  style={inputStyle}>
                  <option value="">Select account manager...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleSubmit} disabled={saving}
                className="px-6 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                {saving ? 'Saving...' : 'Create Organization'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-2 rounded-xl text-sm font-semibold transition"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-sec)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Org List */}
        {loading ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-ter)' }}>Loading...</div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: 'var(--text-ter)' }}>No organizations yet</div>
        ) : (
          <div className="grid gap-3">
            {orgs.map(org => (
              <div key={org.id} className="rounded-2xl p-5 flex items-center justify-between"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid var(--border)`,
                  opacity: org.status === 'inactive' ? 0.6 : 1,
                }}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg"
                    style={{
                      background: org.status === 'active' ? 'var(--primary-dim)' : 'var(--bg)',
                      color:      org.status === 'active' ? 'var(--primary)'     : 'var(--text-ter)',
                    }}>
                    {org.name.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{org.name}</h3>
                      {org.category && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--teal-dim)', color: 'var(--teal)' }}>
                          {org.category}
                        </span>
                      )}
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: org.status === 'active' ? 'var(--green-dim)' : 'var(--danger-dim)',
                          color:      org.status === 'active' ? 'var(--green)'     : 'var(--danger)',
                        }}>
                        {org.status}
                      </span>
                    </div>
                    {org.name_ar && <p className="text-xs mt-0.5" style={{ color: 'var(--text-sec)' }} dir="rtl">{org.name_ar}</p>}
                    <div className="flex gap-3 mt-1 flex-wrap">
                      {org.email  && <span className="text-xs" style={{ color: 'var(--text-ter)' }}>{org.email}</span>}
                      {org.mobile && <span className="text-xs" style={{ color: 'var(--text-ter)' }}>{org.mobile}</span>}
                      {org.account_manager && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                          AM: {org.account_manager.full_name || org.account_manager.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/organizations/${org.id}`}
                    className="text-sm font-semibold px-3 py-1.5 rounded-lg transition"
                    style={{ color: 'var(--primary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-dim)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    Manage
                  </Link>
                  <button onClick={() => toggleStatus(org)}
                    className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                    style={{
                      background: org.status === 'active' ? 'var(--warn-dim)'   : 'var(--green-dim)',
                      color:      org.status === 'active' ? 'var(--warn)'       : 'var(--green)',
                    }}>
                    {org.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  {deleteConfirm === org.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(org.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                        style={{ background: 'var(--danger)', color: '#fff' }}>
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                        style={{ background: 'var(--bg)', color: 'var(--text-sec)', border: '1px solid var(--border)' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(org.id)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                      style={{ background: 'var(--danger-dim)', color: 'var(--danger)' }}>
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
