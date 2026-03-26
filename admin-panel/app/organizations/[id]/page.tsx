'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const categories = [
  'Swimming', 'Football', 'Basketball', 'Tennis', 'Fitness & Gym',
  'Martial Arts', 'Yoga & Pilates', 'Online Courses', 'Academic Training', 'Other'
]

const roles = ['admin', 'coach', 'receptionist', 'trainee', 'parent']

interface Organization {
  id: string
  name: string
  name_ar: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  category: string | null
  status: string
  admin: { full_name: string; email: string } | null
}

interface Member {
  id: string
  user_id: string
  role: string
  status: string
  joined_at: string
  user: { full_name: string; email: string | null; mobile: string | null }
}

interface Course {
  id: string
  name: string
  enrollment_type: string
}

interface Enrollment {
  id: string
  user_id: string
  course_id: string
  subscription_price: number | null
  users: { full_name: string; email: string | null }
  courses: { name: string; enrollment_type: string }
}

export default function ManageOrgPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [form, setForm] = useState({ name: '', name_ar: '', email: '', phone: '', mobile: '', category: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [adminSaving, setAdminSaving] = useState(false)
  const [adminMessage, setAdminMessage] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('coach')
  const [memberSaving, setMemberSaving] = useState(false)
  const [memberMessage, setMemberMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [enrollForm, setEnrollForm] = useState({ user_id: '', course_id: '', subscription_price: '' })
  const [enrollSaving, setEnrollSaving] = useState(false)
  const [enrollMessage, setEnrollMessage] = useState('')

  useEffect(() => { if (id) { loadOrg(); loadMembers(); loadCourses(); loadEnrollments() } }, [id])

  async function loadOrg() {
    const res = await fetch(`/api/organizations/${id}`)
    const data = await res.json()
    setOrg(data)
    setForm({
      name: data.name || '', name_ar: data.name_ar || '',
      email: data.email || '', phone: data.phone || '',
      mobile: data.mobile || '', category: data.category || '',
    })
    setLoading(false)
  }

  async function loadMembers() {
    const res = await fetch(`/api/organizations/${id}/members`)
    const data = await res.json()
    setMembers(data || [])
  }

  async function loadCourses() {
    const res = await fetch(`/api/courses?org_id=${id}`)
    const data = await res.json()
    setCourses(data || [])
  }

  async function loadEnrollments() {
    const res = await fetch(`/api/organizations/${id}/enrollments`)
    const data = await res.json()
    setEnrollments(data || [])
  }

  async function handleSave() {
    if (!form.name) { setMessage('Name is required'); return }
    setSaving(true)
    const res = await fetch(`/api/organizations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) { setMessage('Saved successfully!'); loadOrg() }
    else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  async function handleAssignAdmin() {
    if (!newAdminEmail) { setAdminMessage('Please enter an email'); return }
    setAdminSaving(true)
    const res = await fetch(`/api/organizations/${id}/admin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newAdminEmail })
    })
    const data = await res.json()
    if (res.ok) { setAdminMessage('Admin assigned!'); setNewAdminEmail(''); loadOrg(); loadMembers() }
    else setAdminMessage(data.error || 'Error')
    setAdminSaving(false)
  }

  async function handleAddMember() {
    if (!newMemberEmail) { setMemberMessage('Please enter an email'); return }
    setMemberSaving(true)
    const res = await fetch(`/api/organizations/${id}/members`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newMemberEmail, role: newMemberRole })
    })
    const data = await res.json()
    if (res.ok) { setMemberMessage('Member added!'); setNewMemberEmail(''); loadMembers() }
    else setMemberMessage(data.error || 'Error')
    setMemberSaving(false)
  }

  async function handleRemoveMember(user_id: string) {
    await fetch(`/api/organizations/${id}/members`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    })
    setDeleteConfirm(null)
    loadMembers()
  }

  async function handleEnroll() {
    if (!enrollForm.user_id || !enrollForm.course_id) {
      setEnrollMessage('Please select user and course')
      return
    }
    setEnrollSaving(true)
    const res = await fetch(`/api/organizations/${id}/enrollments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: enrollForm.user_id,
        course_id: enrollForm.course_id,
        subscription_price: enrollForm.subscription_price ? parseFloat(enrollForm.subscription_price) : null
      })
    })
    const data = await res.json()
    if (res.ok) { setEnrollMessage('Enrolled successfully!'); setEnrollForm({ user_id: '', course_id: '', subscription_price: '' }); loadEnrollments() }
    else setEnrollMessage(data.error || 'Error')
    setEnrollSaving(false)
  }

  async function toggleStatus() {
    const newStatus = org?.status === 'active' ? 'inactive' : 'active'
    await fetch(`/api/organizations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    loadOrg()
  }

  const roleColor: Record<string, string> = {
    admin: 'bg-red-50 text-red-600', coach: 'bg-blue-50 text-blue-600',
    receptionist: 'bg-purple-50 text-purple-600', trainee: 'bg-green-50 text-green-600',
    parent: 'bg-amber-50 text-amber-600',
  }

  const trainees = members.filter(m => m.role === 'trainee')

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
          <Link href={`/organizations/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Manage</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">{org.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
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
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Organization Details */}
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
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-right" dir="rtl" />
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

        {/* Admin */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Admin</h2>
          {org.admin ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-4">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">
                {org.admin.full_name?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{org.admin.full_name}</p>
                <p className="text-xs text-gray-500">{org.admin.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">No admin assigned</p>
          )}
          {adminMessage && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${adminMessage.includes('success') || adminMessage.includes('assigned') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {adminMessage}
            </div>
          )}
          <div className="flex gap-3">
            <input value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="admin@club.com" type="email" />
            <button onClick={handleAssignAdmin} disabled={adminSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {adminSaving ? 'Saving...' : 'Assign'}
            </button>
          </div>
        </div>

        {/* Members */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Members ({members.length})</h2>
            <a href={`/organizations/${id}/customers`}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
              👥 Customers
            </a>
          </div>
          {memberMessage && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${memberMessage.includes('added') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {memberMessage}
            </div>
          )}
          <div className="flex gap-3 mb-4">
            <input value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              placeholder="member@club.com" type="email" />
            <select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button onClick={handleAddMember} disabled={memberSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {memberSaving ? 'Adding...' : '+ Add'}
            </button>
          </div>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold text-sm">
                      {m.user?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{m.user?.full_name || '—'}</p>
                      <p className="text-xs text-gray-400">{m.user?.email || m.user?.mobile || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[m.role] || 'bg-gray-100 text-gray-600'}`}>{m.role}</span>
                    {deleteConfirm === m.user_id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleRemoveMember(m.user_id)}
                          className="text-xs px-2 py-1 rounded-lg bg-red-600 text-white font-semibold">Confirm</button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(m.user_id)}
                        className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enrollments */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Enrollments ({enrollments.length})</h2>
          {enrollMessage && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${enrollMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {enrollMessage}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <select value={enrollForm.user_id} onChange={e => setEnrollForm({...enrollForm, user_id: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Select trainee...</option>
              {trainees.map(m => <option key={m.user_id} value={m.user_id}>{m.user?.full_name}</option>)}
            </select>
            <select value={enrollForm.course_id} onChange={e => setEnrollForm({...enrollForm, course_id: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              <option value="">Select course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={enrollForm.subscription_price} onChange={e => setEnrollForm({...enrollForm, subscription_price: e.target.value})}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Price (QAR)" type="number" />
              <button onClick={handleEnroll} disabled={enrollSaving}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                {enrollSaving ? '...' : '+ Enroll'}
              </button>
            </div>
          </div>
          {enrollments.length === 0 ? (
            <p className="text-sm text-gray-400">No enrollments yet</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{e.users?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{e.courses?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.subscription_price && (
                      <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                        {e.subscription_price} QAR
                      </span>
                    )}
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {e.courses?.enrollment_type}
                    </span>
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
