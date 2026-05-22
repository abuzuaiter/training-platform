'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users, TrendingUp, Clock, Sparkles } from 'lucide-react'

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

  const statCards = [
    {
      label: 'ORGANIZATIONS',
      value: stats?.totalOrgs ?? 0,
      icon: Building2,
      color: 'var(--primary)',
      bg: 'var(--primary-dim)',
    },
    {
      label: 'CUSTOMERS',
      value: stats?.totalCustomers ?? 0,
      icon: Users,
      color: 'var(--teal)',
      bg: 'var(--teal-dim)',
    },
    {
      label: 'REVENUE',
      value: `${stats?.totalRevenue ?? 0}`,
      suffix: 'QAR',
      icon: TrendingUp,
      color: 'var(--green)',
      bg: 'var(--green-dim)',
    },
    {
      label: 'PENDING',
      value: `${stats?.pendingRevenue ?? 0}`,
      suffix: 'QAR',
      icon: Clock,
      color: 'var(--warn)',
      bg: 'var(--warn-dim)',
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="px-6 py-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Dashboard</h1>
        <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Welcome to AlMawid</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isSuperAdmin && !loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statCards.map(card => {
              const Icon = card.icon
              return (
                <div key={card.label} className="rounded-2xl p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-ter)' }}>{card.label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: card.bg }}>
                      <Icon size={14} style={{ color: card.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: card.color }}>
                    {card.value}
                    {card.suffix && <span className="text-sm ml-1" style={{ color: 'var(--text-ter)' }}>{card.suffix}</span>}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {/* Renewal Reports */}
        {isSuperAdmin && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--ink)' }}>Organizations This Month</h2>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--green)' }}>{stats.renewedOrgs?.length || 0}</p>
                  <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Renewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>{stats.notRenewedOrgs?.length || 0}</p>
                  <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Not Renewed</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--ink)' }}>Customers This Month</h2>
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--green)' }}>{stats.renewedCustomers?.length || 0}</p>
                  <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Renewed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>{stats.notRenewedCustomers?.length || 0}</p>
                  <p className="text-xs" style={{ color: 'var(--text-ter)' }}>Not Renewed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        {isSuperAdmin && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                <h2 className="text-sm font-bold" style={{ color: 'var(--ink)' }}>AI Insights</h2>
              </div>
              <button onClick={loadAI} disabled={aiLoading}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition disabled:opacity-50"
                style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b8d4e5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--primary-dim)')}
              >
                {aiLoading ? 'Loading...' : 'Generate Insights'}
              </button>
            </div>
            {aiInsight ? (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>{aiInsight}</p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-ter)' }}>Click "Generate Insights" to get AI-powered recommendations.</p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
