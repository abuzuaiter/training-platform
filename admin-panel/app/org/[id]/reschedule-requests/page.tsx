'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { RefreshCw, Check, X, Calendar } from 'lucide-react'

type Request = {
  id: string
  session_date: string
  session_title: string | null
  preferred_date: string | null
  note: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  created_at: string
  customers: { id: string; full_name: string; email: string } | null
  enrollments: { id: string; packages: { name: string } | null } | null
}

function fmt(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const
type Filter = typeof FILTERS[number]

export default function RescheduleRequestsPage() {
  const params = useParams()
  const id = params.id as string
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<Filter>('all')
  const [selected, setSelected] = useState<Request | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')
  const [msgType, setMsgType]   = useState<'ok' | 'err' | 'warn'>('ok')

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/reschedule-requests?org_id=${id}`)
    setRequests(res.ok ? await res.json() : [])
    setLoading(false)
  }

  async function handleAction(status: 'approved' | 'rejected') {
    if (!selected) return
    setSaving(true)
    const res = await fetch(`/api/reschedule-requests/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_note: adminNote.trim() || null }),
    })
    if (res.ok) {
      setMsg(status === 'approved' ? 'Request approved!' : 'Request rejected.')
      setMsgType(status === 'approved' ? 'ok' : 'warn')
      setSelected(null); setAdminNote('')
      load()
      window.dispatchEvent(new Event('reschedule-updated'))
    } else {
      const d = await res.json()
      setMsg(d.error || 'Error'); setMsgType('err')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
  const counts: Record<Filter, number> = {
    all:      requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  const statusStyle = (s: string) => {
    if (s === 'pending')  return { background: 'var(--warn-dim)',    color: 'var(--warn)'    }
    if (s === 'approved') return { background: 'var(--green-dim)',   color: 'var(--green)'   }
    return                       { background: 'var(--danger-dim)',  color: 'var(--danger)'  }
  }

  const msgStyle = () => {
    if (msgType === 'ok')   return { background: 'var(--green-dim)',   color: 'var(--green)'   }
    if (msgType === 'warn') return { background: 'var(--warn-dim)',    color: 'var(--warn)'    }
    return                         { background: 'var(--danger-dim)',  color: 'var(--danger)'  }
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Reschedule Requests</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>Review and respond to customer reschedule requests</p>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={msgStyle()}>{msg}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map(f => {
          const active = filter === f
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? 'var(--primary)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-sec)',
                border: active ? 'none' : '1px solid var(--border)',
              }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{
                background: active ? 'rgba(255,255,255,0.25)' : 'var(--bg)',
                color: active ? '#fff' : 'var(--text-ter)',
              }}>
                {counts[f]}
              </span>
            </button>
          )
        })}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20" style={{ color: 'var(--text-ter)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <RefreshCw size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm" style={{ color: 'var(--text-ter)' }}>No {filter !== 'all' ? filter : ''} requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-2xl p-5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                      {r.customers?.full_name || 'Unknown Customer'}
                    </p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={statusStyle(r.status)}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-ter)' }}>{r.customers?.email}</p>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-3">
                    {[
                      { label: 'Session',         value: r.session_title || 'Session' },
                      { label: 'Package',         value: r.enrollments?.packages?.name || '—' },
                      { label: 'Session Date',    value: fmt(r.session_date) },
                      { label: 'Preferred Date',  value: fmt(r.preferred_date) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-xs mb-0.5" style={{ color: 'var(--text-ter)' }}>{label}</p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {r.note && (
                    <div className="rounded-xl px-3 py-2 mb-2" style={{ background: 'var(--bg)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--text-ter)' }}>Customer note</p>
                      <p className="text-sm" style={{ color: 'var(--text-sec)' }}>{r.note}</p>
                    </div>
                  )}

                  {r.admin_note && r.status !== 'pending' && (
                    <div className="rounded-xl px-3 py-2 mb-2" style={{ background: 'var(--primary-dim)' }}>
                      <p className="text-xs mb-0.5" style={{ color: 'var(--primary)' }}>Admin note</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--primary)' }}>{r.admin_note}</p>
                    </div>
                  )}

                  <p className="text-xs mt-1" style={{ color: 'var(--text-ter)' }}>
                    Submitted {new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                {r.status === 'pending' && (
                  <button onClick={() => { setSelected(r); setAdminNote('') }}
                    className="shrink-0 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
                    style={{ background: 'var(--primary)' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl" style={{ background: 'var(--surface)' }}>
            <div className="p-6">
              <h2 className="text-base font-bold mb-1" style={{ color: 'var(--ink)' }}>Review Request</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-ter)' }}>
                {selected.customers?.full_name} · {selected.session_title} · {fmt(selected.session_date)}
              </p>

              {selected.note && (
                <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--bg)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-ter)' }}>Customer note</p>
                  <p className="text-sm" style={{ color: 'var(--text-sec)' }}>{selected.note}</p>
                </div>
              )}

              {selected.preferred_date && (
                <div className="rounded-xl p-3 mb-4 flex items-center gap-2" style={{ background: 'var(--warn-dim)' }}>
                  <Calendar size={14} style={{ color: 'var(--warn)', flexShrink: 0 }} />
                  <div>
                    <p className="text-xs" style={{ color: 'var(--warn)' }}>Preferred new date</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--warn)' }}>{fmt(selected.preferred_date)}</p>
                  </div>
                </div>
              )}

              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-ter)' }}>
                ADMIN NOTE <span style={{ fontWeight: 400, color: 'var(--text-ter)' }}>(optional)</span>
              </p>
              <textarea rows={3} value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder="Add a message to the customer..."
                style={{
                  width: '100%', border: '1px solid var(--border)', borderRadius: 12,
                  padding: '10px 12px', fontSize: 14, background: 'var(--bg)',
                  color: 'var(--ink)', outline: 'none', resize: 'none', fontFamily: 'inherit',
                }} />

              <div className="flex gap-3 mt-4">
                <button onClick={() => handleAction('approved')} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'var(--green)' }}>
                  <Check size={15} /> Approve
                </button>
                <button onClick={() => handleAction('rejected')} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
                  style={{ background: 'var(--danger)' }}>
                  <X size={15} /> Reject
                </button>
              </div>

              <button onClick={() => { setSelected(null); setAdminNote('') }}
                className="w-full mt-3 py-2 text-sm font-semibold transition-all"
                style={{ color: 'var(--text-ter)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-sec)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-ter)')}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
