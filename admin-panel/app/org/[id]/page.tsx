'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Organization {
  id: string
  name: string
  name_ar: string | null
  category: string | null
  status: string
}

interface Member {
  id: string
  user_id: string
  role: string
  status: string
  user: { full_name: string; email: string | null; mobile: string | null }
}

export default function OrgAdminPage() {
  const params = useParams()
  const id = params.id as string
  const [org, setOrg] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) { loadOrg(); loadMembers() } }, [id])

  async function loadOrg() {
    const res = await fetch(`/api/organizations/${id}`)
    const data = await res.json()
    setOrg(data)
    setLoading(false)
  }

  async function loadMembers() {
    const res = await fetch(`/api/organizations/${id}/members`)
    const data = await res.json()
    setMembers(data || [])
  }

  const roleColor: Record<string, string> = {
    admin: 'bg-red-50 text-red-600',
    coach: 'bg-blue-50 text-blue-600',
    receptionist: 'bg-purple-50 text-purple-600',
    trainee: 'bg-green-50 text-green-600',
    parent: 'bg-amber-50 text-amber-600',
  }

  const coaches = members.filter(m => m.role === 'coach')
  const trainees = members.filter(m => m.role === 'trainee')
  const others = members.filter(m => !['coach', 'trainee'].includes(m.role))

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{org?.name}</h1>
            <p className="text-sm text-gray-500">{org?.category || 'Organization'}</p>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
            Org Admin
          </span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">COACHES</p>
            <p className="text-3xl font-bold text-blue-600">{coaches.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">TRAINEES</p>
            <p className="text-3xl font-bold text-green-600">{trainees.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">TOTAL MEMBERS</p>
            <p className="text-3xl font-bold text-gray-900">{members.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">STATUS</p>
            <p className={`text-sm font-bold mt-1 ${org?.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
              {org?.status?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href={`/org/${id}/members`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition cursor-pointer">
              <span className="text-2xl mb-2 block">👥</span>
              <p className="font-semibold text-gray-900 text-sm">Members</p>
              <p className="text-xs text-gray-400">Add & manage</p>
            </div>
          </Link>
          <Link href={`/org/${id}/activities`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition cursor-pointer">
              <span className="text-2xl mb-2 block">📚</span>
              <p className="font-semibold text-gray-900 text-sm">Activities</p>
              <p className="text-xs text-gray-400">Create & schedule</p>
            </div>
          </Link>
          <Link href={`/org/${id}/invitations`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition cursor-pointer">
              <span className="text-2xl mb-2 block">✉️</span>
              <p className="font-semibold text-gray-900 text-sm">Invitations</p>
              <p className="text-xs text-gray-400">Send invites</p>
            </div>
          </Link>
          <Link href={`/org/${id}/subscriptions`}>
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition cursor-pointer">
              <span className="text-2xl mb-2 block">💳</span>
              <p className="font-semibold text-gray-900 text-sm">Subscriptions</p>
              <p className="text-xs text-gray-400">Track payments</p>
            </div>
          </Link>
        </div>

        {/* Recent Members */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Members</h2>
          {members.length === 0 ? (
            <p className="text-sm text-gray-400">No members yet</p>
          ) : (
            <div className="space-y-2">
              {members.slice(0, 5).map(m => (
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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[m.role] || 'bg-gray-100 text-gray-600'}`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
