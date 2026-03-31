'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function OrgDashboard() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [org, setOrg] = useState<any>(null)
  const [stats, setStats] = useState({ members: 0, customers: 0, activities: 0 })
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    try {
      const [orgRes, membersRes, customersRes, plansRes] = await Promise.all([
        fetch(`/api/organizations/${id}`),
        fetch(`/api/organizations/${id}/members`),
        fetch(`/api/organizations/${id}/customers`),
        fetch(`/api/organizations/${id}/plans`),
      ])
      const [orgData, membersData, customersData, plansData] = await Promise.all([
        orgRes.json(), membersRes.json(), customersRes.json(), plansRes.json()
      ])
      setOrg(orgData)
      setPlan(plansData?.[0] || null)
      setStats({
        members: (membersData || []).length,
        customers: (customersData || []).length,
        activities: 0,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>

  const planExpiringSoon = plan && new Date(plan.end_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{org?.name || 'Organization'}</h1>
            <p className="text-sm text-gray-500">{org?.category || 'Admin Portal'}</p>
          </div>
          <div className="flex items-center gap-3">
            {plan && (
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${plan.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {plan.plans?.name} — {plan.payment_status}
              </span>
            )}
            <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">Org Admin</span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-500 font-medium transition">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {planExpiringSoon && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-amber-500 text-xl">⚠️</span>
            <p className="text-amber-700 text-sm font-medium">Your plan expires on {new Date(plan.end_date).toLocaleDateString()} — please contact us to renew.</p>
          </div>
        )}

        {!plan && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-red-500 text-xl">🚫</span>
            <p className="text-red-700 text-sm font-medium">No active plan — please contact us to activate your account.</p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">MEMBERS</p>
            <p className="text-3xl font-bold text-blue-600">{stats.members}</p>
            {plan && <p className="text-xs text-gray-400 mt-1">Max: {plan.plans?.max_staff || '—'}</p>}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">CUSTOMERS</p>
            <p className="text-3xl font-bold text-purple-600">{stats.customers}</p>
            {plan && <p className="text-xs text-gray-400 mt-1">Max: {plan.plans?.max_customers || '—'}</p>}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">ACTIVITIES</p>
            <p className="text-3xl font-bold text-green-600">{stats.activities}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 mb-1">PLAN</p>
            {plan ? (
              <>
                <p className="text-sm font-bold text-gray-900 mt-1">{plan.plans?.name}</p>
                <p className="text-xs text-gray-400">Until {new Date(plan.end_date).toLocaleDateString()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.payment_status === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {plan.payment_status}
                </span>
              </>
            ) : (
              <p className="text-sm text-red-500 font-medium mt-1">No Plan</p>
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href={`/org/${id}/calendar`}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">📅</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Calendar</h3>
              <p className="text-xs text-gray-400 mt-0.5">Sessions & bookings</p>
            </div>
          </Link>
          <Link href={`/org/${id}/customers`}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">🧑‍🤝‍🧑</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Customers</h3>
              <p className="text-xs text-gray-400 mt-0.5">{stats.customers} / {plan?.plans?.max_customers || '—'} customers</p>
            </div>
          </Link>
          <Link href={`/org/${id}/subscriptions`}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">💳</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Subscriptions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Track customer subscriptions</p>
            </div>
          </Link>
          <Link href={`/org/${id}/members`}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">👥</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Members</h3>
              <p className="text-xs text-gray-400 mt-0.5">{stats.members} / {plan?.plans?.max_staff || '—'} staff</p>
            </div>
          </Link>
          <Link href={`/org/${id}/activities`}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">📋</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Activities</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage activities</p>
            </div>
          </Link>
          <Link href={`/org/${id}/invitations`}>
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">✉️</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Invitations</h3>
              <p className="text-xs text-gray-400 mt-0.5">Invite members</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
