'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const PAGES = [
  { key: 'organizations', label: 'Organizations', icon: '🏢' },
  { key: 'plans', label: 'Plans', icon: '📦' },
  { key: 'invoices', label: 'Invoices', icon: '🧾' },
  { key: 'customers', label: 'Customers', icon: '🧑‍🤝‍🧑' },
  { key: 'subscriptions', label: 'Subscriptions', icon: '💳' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'invitations', label: 'Invitations', icon: '✉️' },
  { key: 'activities', label: 'Activities', icon: '📋' },
  { key: 'audit_logs', label: 'Audit Logs', icon: '📋' },
]

const ACCESS_LEVELS = [
  { value: 'none', label: 'No Access', color: 'bg-gray-100 text-gray-500' },
  { value: 'view', label: 'View Only', color: 'bg-blue-50 text-blue-600' },
  { value: 'full', label: 'Full Access', color: 'bg-green-50 text-green-600' },
]

interface Role {
  id: string
  name: string
  permissions: Record<string, string>
  user_roles?: { user_id: string; users: { full_name: string; email: string } }[]
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', permissions: {} as Record<string, string> })
  const [assignUser, setAssignUser] = useState<{roleId: string, userId: string} | null>(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [rolesRes, usersRes] = await Promise.all([
      fetch('/api/roles'), fetch('/api/users')
    ])
    const [rolesData, usersData] = await Promise.all([rolesRes.json(), usersRes.json()])
    setRoles(rolesData || [])
    setUsers(usersData || [])
    setLoading(false)
  }

  function initForm(role?: Role) {
    if (role) {
      setForm({ name: role.name, permissions: { ...role.permissions } })
      setEditRole(role)
    } else {
      const defaultPerms: Record<string, string> = {}
      PAGES.forEach(p => { defaultPerms[p.key] = 'none' })
      setForm({ name: '', permissions: defaultPerms })
      setEditRole(null)
    }
    setShowForm(true)
  }

  function setPermission(key: string, value: string) {
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: value } }))
  }

  async function handleSave() {
    if (!form.name) { setMessage('Name is required'); return }
    setSaving(true)
    const url = editRole ? `/api/roles/${editRole.id}` : '/api/roles'
    const method = editRole ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(editRole ? 'Role updated!' : 'Role created!')
      setShowForm(false)
      setEditRole(null)
      loadAll()
    } else {
      setMessage(data.error || 'Error')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/roles/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null)
    loadAll()
  }

  async function handleAssign(roleId: string, userId: string) {
    await fetch('/api/user-roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role_id: roleId })
    })
    setAssignUser(null)
    loadAll()
  }

  async function handleRemoveUser(roleId: string, userId: string) {
    await fetch('/api/user-roles', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role_id: roleId })
    })
    loadAll()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Roles & Permissions</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
            <p className="text-gray-500 text-sm mt-1">{roles.length} roles</p>
          </div>
          <button onClick={() => initForm()}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            + New Role
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editRole ? 'Edit Role' : 'New Role'}</h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">ROLE NAME *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full md:w-64 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="e.g. Accountant, Manager..." />
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">PAGE</th>
                    {ACCESS_LEVELS.map(a => (
                      <th key={a.value} className="text-center px-4 py-3 text-xs font-semibold text-gray-500">{a.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAGES.map((page, i) => (
                    <tr key={page.key} className={`border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="mr-2">{page.icon}</span>{page.label}
                      </td>
                      {ACCESS_LEVELS.map(level => (
                        <td key={level.value} className="px-4 py-3 text-center">
                          <input
                            type="radio"
                            name={`perm_${page.key}`}
                            value={level.value}
                            checked={(form.permissions[page.key] || 'none') === level.value}
                            onChange={() => setPermission(page.key, level.value)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}
              </button>
              <button onClick={() => { setShowForm(false); setEditRole(null) }}
                className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : roles.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No roles yet — create your first role</div>
        ) : (
          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg">{role.name}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => initForm(role)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100">
                      Edit
                    </button>
                    {deleteConfirm === role.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(role.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold">Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 font-semibold">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(role.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">Delete</button>
                    )}
                  </div>
                </div>

                {/* Permissions Summary */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {PAGES.map(page => {
                    const perm = role.permissions[page.key] || 'none'
                    if (perm === 'none') return null
                    const level = ACCESS_LEVELS.find(a => a.value === perm)
                    return (
                      <span key={page.key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${level?.color}`}>
                        {page.icon} {page.label} — {level?.label}
                      </span>
                    )
                  })}
                  {Object.values(role.permissions).every(v => v === 'none') && (
                    <span className="text-xs text-gray-400">No permissions assigned</span>
                  )}
                </div>

                {/* Assigned Users */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500">ASSIGNED USERS ({role.user_roles?.length || 0})</p>
                    <button onClick={() => setAssignUser({ roleId: role.id, userId: '' })}
                      className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200">
                      + Assign User
                    </button>
                  </div>

                  {assignUser?.roleId === role.id && (
                    <div className="flex gap-2 mb-3">
                      <select value={assignUser.userId} onChange={e => setAssignUser({...assignUser, userId: e.target.value})}
                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                        <option value="">Select user...</option>
                        {users.filter(u => !role.user_roles?.some(ur => ur.user_id === u.id)).map(u => (
                          <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                        ))}
                      </select>
                      <button onClick={() => handleAssign(role.id, assignUser.userId)} disabled={!assignUser.userId}
                        className="bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
                        Assign
                      </button>
                      <button onClick={() => setAssignUser(null)}
                        className="border border-gray-200 text-gray-600 px-3 py-2 rounded-xl text-sm font-semibold">
                        Cancel
                      </button>
                    </div>
                  )}

                  {(role.user_roles || []).length === 0 ? (
                    <p className="text-xs text-gray-400">No users assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {role.user_roles?.map(ur => (
                        <div key={ur.user_id} className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1">
                          <span className="text-xs text-gray-700">{ur.users?.full_name}</span>
                          <button onClick={() => handleRemoveUser(role.id, ur.user_id)}
                            className="text-gray-400 hover:text-red-500 text-xs ml-1">✕</button>
                        </div>
                      ))}
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