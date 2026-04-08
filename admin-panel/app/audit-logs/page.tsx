'use client'
import AdminLayout from '../admin-layout'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AuditLog {
  id: string
  user_email: string
  action: string
  entity_type: string
  entity_id: string | null
  details: any
  created_at: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEntity, setFilterEntity] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/audit-logs?limit=200')
    const data = await res.json()
    setLogs(data || [])
    setLoading(false)
  }

  const entityTypes = [...new Set(logs.map(l => l.entity_type))]

  const actionColors: Record<string, string> = {
    create: 'bg-green-50 text-green-600',
    update: 'bg-blue-50 text-blue-600',
    delete: 'bg-red-50 text-red-600',
    assign: 'bg-purple-50 text-purple-600',
    paid: 'bg-teal-50 text-teal-600',
    login: 'bg-gray-100 text-gray-600',
  }

  const filtered = logs.filter(l => {
    const matchSearch = l.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type?.toLowerCase().includes(search.toLowerCase())
    const matchEntity = filterEntity === 'all' || l.entity_type === filterEntity
    return matchSearch && matchEntity
  })

  function exportCSV() {
    const headers = ['time','user','action','entity_type','entity_id','details']
    const rows = filtered.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.user_email, l.action, l.entity_type,
      l.entity_id || '', JSON.stringify(l.details || {})
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'audit_logs.csv'
    a.click()
  }

  return (
    <AdminLayout>
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Audit Logs</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} events</p>
          </div>
          <button onClick={exportCSV}
            className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400"
            placeholder="Search user, action, entity..." />
          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
            <option value="all">All Types</option>
            {entityTypes.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No logs yet</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">TIME</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">USER</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ACTION</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">ENTITY</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => (
                  <tr key={log.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                    <td className="px-6 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600">{log.user_email}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
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