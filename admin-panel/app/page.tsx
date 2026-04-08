'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [aiInsight, setAiInsight] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push('/login'); return }
      setIsSuperAdmin(d.role === 'super_admin')
      loadStats()
    })
  }, [])

  async function loadStats() {
    setLoading(true)
    const res = await fetch('/api/stats')
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }

  async function loadAI() {
    setAiLoading(true)
    const res = await fetch('/api/ai-insights')
    if (res.ok) { const d = await res.json(); setAiInsight(d.insight || '') }
    setAiLoading(false)
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <p className="text-xs text-gray-400">Welcome to MawedQo Admin</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isSuperAdmin && !loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 mb-1">ORGANIZATIONS</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalOrgs || 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 mb-1">CUSTOMERS</p>
              <p className="text-3xl font-bold text-purple-600">{stats.totalCustomers || 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 mb-1">REVENUE</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalRevenue || 0} <span className="text-sm">QAR</span></p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-400 mb-1">PENDING</p>
              <p className="text-3xl font-bold text-amber-500">{stats.pendingRevenue || 0} <span className="text-sm">QAR</span></p>
            </div>
          </div>
        )}

        {/* Renewal Reports */}
        {isSuperAdmin && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Organizations This Month</h2>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.renewedOrgs?.length || 0}</p>
                  <p className="text-xs text-gray-400">Renewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.notRenewedOrgs?.length || 0}</p>
                  <p className="text-xs text-gray-400">Not Renewed</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h2 className="text-sm font-bold text-gray-900 mb-3">Customers This Month</h2>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.renewedCustomers?.length || 0}</p>
                  <p className="text-xs text-gray-400">Renewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-500">{stats.notRenewedCustomers?.length || 0}</p>
                  <p className="text-xs text-gray-400">Not Renewed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        {isSuperAdmin && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-900">AI Insights</h2>
              <button onClick={loadAI} disabled={aiLoading}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 disabled:opacity-50 transition">
                {aiLoading ? 'Loading...' : 'Generate Insights'}
              </button>
            </div>
            {aiInsight ? (
              <p className="text-sm text-gray-700 leading-relaxed">{aiInsight}</p>
            ) : (
              <p className="text-sm text-gray-400">Click "Generate Insights" to get AI-powered recommendations.</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
