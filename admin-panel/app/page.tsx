'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Stats {
  totalOrgs: number
  totalCustomers: number
  activeOrgPlans: number
  expiredOrgPlans: number
  expiringOrgPlans: number
  totalRevenue: number
  pendingRevenue: number
  thisMonthRevenue: number
  renewedOrgs: any[]
  notRenewedOrgs: any[]
  renewedCustomers: any[]
  notRenewedCustomers: any[]
}

export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { loadStats() }, [])

  async function loadStats() {
    setLoading(true)
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  async function getAiInsights() {
    if (!stats) return
    setAiLoading(true)
    setAiInsight('')
    try {
      const res = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats })
      })
      const data = await res.json()
      setAiInsight(data.insight || 'No insights available')
    } catch (e) {
      setAiInsight('Error getting insights')
    }
    setAiLoading(false)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">موعد — Mawid</h1>
            <p className="text-sm text-gray-500">Super Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">Super Admin</span>
            <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-500 font-medium transition">Sign out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats Cards */}
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading stats...</div>
        ) : stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 mb-1">ORGANIZATIONS</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalOrgs}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.activeOrgPlans} active plans</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 mb-1">CUSTOMERS</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalCustomers}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.renewedCustomers.length} active subscriptions</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 mb-1">THIS MONTH</p>
                <p className="text-3xl font-bold text-green-600">{stats.thisMonthRevenue.toFixed(0)} QAR</p>
                <p className="text-xs text-gray-400 mt-1">Total: {stats.totalRevenue.toFixed(0)} QAR</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-400 mb-1">PENDING</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pendingRevenue.toFixed(0)} QAR</p>
                <p className="text-xs text-gray-400 mt-1">{stats.expiringOrgPlans} expiring soon</p>
              </div>
            </div>

            {/* Reports Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Orgs Renewed */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">✅ Orgs Renewed This Month</h3>
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">{stats.renewedOrgs.length}</span>
                </div>
                {stats.renewedOrgs.length === 0 ? (
                  <p className="text-xs text-gray-400">No renewals this month</p>
                ) : (
                  <div className="space-y-1">
                    {stats.renewedOrgs.slice(0, 5).map((op: any, i: number) => (
                      <p key={i} className="text-xs text-gray-600">• {op.organizations?.name}</p>
                    ))}
                    {stats.renewedOrgs.length > 5 && <p className="text-xs text-gray-400">+{stats.renewedOrgs.length - 5} more</p>}
                  </div>
                )}
              </div>

              {/* Orgs Not Renewed */}
              <div className="bg-white rounded-2xl border border-red-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">❌ Orgs Not Renewed</h3>
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">{stats.notRenewedOrgs.length}</span>
                </div>
                {stats.notRenewedOrgs.length === 0 ? (
                  <p className="text-xs text-gray-400">All organizations renewed!</p>
                ) : (
                  <div className="space-y-1">
                    {stats.notRenewedOrgs.slice(0, 5).map((op: any, i: number) => (
                      <p key={i} className="text-xs text-red-600">• {op.organizations?.name}</p>
                    ))}
                    {stats.notRenewedOrgs.length > 5 && <p className="text-xs text-gray-400">+{stats.notRenewedOrgs.length - 5} more</p>}
                  </div>
                )}
              </div>

              {/* Customers Active */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">✅ Active Customer Subscriptions</h3>
                  <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">{stats.renewedCustomers.length}</span>
                </div>
                {stats.renewedCustomers.length === 0 ? (
                  <p className="text-xs text-gray-400">No active subscriptions</p>
                ) : (
                  <div className="space-y-1">
                    {stats.renewedCustomers.slice(0, 5).map((cs: any, i: number) => (
                      <p key={i} className="text-xs text-gray-600">• {cs.customers?.full_name}</p>
                    ))}
                    {stats.renewedCustomers.length > 5 && <p className="text-xs text-gray-400">+{stats.renewedCustomers.length - 5} more</p>}
                  </div>
                )}
              </div>

              {/* Customers Expired */}
              <div className="bg-white rounded-2xl border border-red-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">❌ Expired Customer Subscriptions</h3>
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">{stats.notRenewedCustomers.length}</span>
                </div>
                {stats.notRenewedCustomers.length === 0 ? (
                  <p className="text-xs text-gray-400">All subscriptions active!</p>
                ) : (
                  <div className="space-y-1">
                    {stats.notRenewedCustomers.slice(0, 5).map((cs: any, i: number) => (
                      <p key={i} className="text-xs text-red-600">• {cs.customers?.full_name}</p>
                    ))}
                    {stats.notRenewedCustomers.length > 5 && <p className="text-xs text-gray-400">+{stats.notRenewedCustomers.length - 5} more</p>}
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-2xl border border-blue-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">🤖 AI Insights</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Powered by Claude</p>
                </div>
                <button onClick={getAiInsights} disabled={aiLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                  {aiLoading ? 'Analyzing...' : 'Get Insights'}
                </button>
              </div>
              {aiInsight ? (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Click "Get Insights" to analyze your business data with AI</p>
              )}
            </div>
          </>
        )}

        {/* Quick Access */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Access</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Link href="/roles">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">🔐</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Roles</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage permissions</p>
            </div>
          </Link>
          <Link href="/organizations">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">🏢</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Organizations</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage organizations</p>
            </div>
          </Link>
          <Link href="/plans">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">📦</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Plans</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage plans</p>
            </div>
          </Link>
          <Link href="/invoices">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">🧾</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Invoices</h3>
              <p className="text-xs text-gray-400 mt-0.5">Track payments</p>
            </div>
          </Link>
          <Link href="/audit-logs">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">📋</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Audit Logs</h3>
              <p className="text-xs text-gray-400 mt-0.5">Track all actions</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <Link href="/customers">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">🧑‍🤝‍🧑</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">All Customers</h3>
              <p className="text-xs text-gray-400 mt-0.5">View all customers</p>
            </div>
          </Link>
          <Link href="/subscriptions">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">💳</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Subscriptions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Track subscriptions</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/users">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">👥</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Users</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage users</p>
            </div>
          </Link>
          <Link href="/invitations">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">✉️</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Invitations</h3>
              <p className="text-xs text-gray-400 mt-0.5">Send invites</p>
            </div>
          </Link>
          <Link href="/activities">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3"><span className="text-xl">📋</span></div>
              <h3 className="font-semibold text-gray-900 text-sm">Activities</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage activities</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}