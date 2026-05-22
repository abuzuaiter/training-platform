'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface AuditLog {
  id: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string | null
  details: any
  created_at: string
  organization_id: string | null
}

const ACTION_COLORS: Record<string, string> = {
  create:               'bg-green-50 text-green-600',
  update:               'bg-blue-50 text-blue-600',
  delete:               'bg-red-50 text-red-600',
  login:                'bg-gray-100 text-gray-500',
  paid:                 'bg-teal-50 text-teal-600',
  approve_reschedule:   'bg-green-50 text-green-600',
  reject_reschedule:    'bg-red-50 text-red-600',
  assign:               'bg-purple-50 text-purple-600',
}

function fmtDetails(details: any): string {
  if (!details) return '—'
  const parts: string[] = []
  if (details.customer_name)  parts.push(details.customer_name)
  if (details.name)           parts.push(details.name)
  if (details.session_title)  parts.push(details.session_title)
  if (details.session_date)   parts.push(details.session_date)
  if (details.admin_note)     parts.push(`"${details.admin_note}"`)
  if (details.role)           parts.push(`role: ${details.role}`)
  return parts.length > 0 ? parts.join(' · ') : JSON.stringify(details)
}

export default function OrgAuditLogsPage() {
  const params = useParams()
  const id = params.id as string
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('all')

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/audit-logs?org_id=${id}&limit=500`)
    setLogs(res.ok ? await res.json() : [])
    setLoading(false)
  }

  const actionTypes = [...new Set(logs.map(l => l.action))]

  const filtered = logs.filter(l => {
    const matchSearch =
      l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(search.toLowerCase())
    const matchAction = filterAction === 'all' || l.action === filterAction
    return matchSearch && matchAction
  })

  function exportCSV() {
    const headers = ['time', 'user', 'action', 'entity_type', 'entity_id', 'details']
    const rows = filtered.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.user_email, l.action, l.entity_type,
      l.entity_id || '', JSON.stringify(l.details || {})
    ].map(v => `"${String(v).replace(/"/g, '')}"`))
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} events recorded for this organization</p>
        </div>
        <button onClick={exportCSV}
          className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by user, action, details..."
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
        />
        <select
          value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option value="all">All Actions</option>
          {actionTypes.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No logs found</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">TIME</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">USER</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">ACTION</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">TYPE</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id}
                  className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                  <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-700 font-medium">{log.user_email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                      {log.entity_type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 max-w-xs truncate" title={JSON.stringify(log.details)}>
                    {fmtDetails(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
