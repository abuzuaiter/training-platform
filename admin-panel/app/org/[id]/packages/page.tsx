'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Package, Plus, Download, Upload, FileText, Calendar, BookOpen } from 'lucide-react'

const inp: React.CSSProperties = {
  width: '100%', border: '1px solid var(--border)', borderRadius: 12,
  padding: '8px 12px', fontSize: 14, background: 'var(--bg)',
  color: 'var(--ink)', outline: 'none',
}
const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-ter)', marginBottom: 4, letterSpacing: '0.5px' }}>
    {children}
  </p>
)

const EMPTY_FORM = {
  name: '', price: '', type: 'sessions',
  total_sessions: '', duration_days: '', duration_unit: 'days',
  capacity: '', absence_policy: 'deduct',
  notify_before_end: false, is_active: true
}

export default function OrgPackagesPage() {
  const params = useParams()
  const id = params.id as string
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [msgType, setMsgType] = useState<'ok' | 'err'>('ok')
  const [editPkg, setEditPkg] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/packages?org_id=${id}`)
    setPackages(res.ok ? await res.json() : [])
    setLoading(false)
  }

  function showMsg(text: string, type: 'ok' | 'err' = 'ok') {
    setMessage(text); setMsgType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  function buildPayload(f: typeof form, orgId: string) {
    const isDuration = f.type === 'duration'
    const durationDays = isDuration
      ? f.duration_unit === 'months'
        ? (parseInt(f.duration_days) || 0) * 30
        : parseInt(f.duration_days) || null
      : null
    return {
      name: f.name,
      price: parseFloat(f.price),
      type: f.type,
      sessions_count:  isDuration ? null : (parseInt(f.total_sessions) || null),
      duration_days:   isDuration ? durationDays : null,
      capacity:        f.capacity ? parseInt(f.capacity) : null,
      absence_policy:  isDuration ? null : f.absence_policy,
      notify_before_end: isDuration ? false : f.notify_before_end,
      is_active: f.is_active,
      organization_id: orgId,
    }
  }

  async function handleCreate() {
    if (!form.name || !form.price) { showMsg('Name and price are required', 'err'); return }
    if (form.type === 'sessions' && !form.total_sessions) { showMsg('Total sessions are required', 'err'); return }
    if (form.type === 'duration' && !form.duration_days) { showMsg('Duration is required', 'err'); return }
    setSaving(true)
    const res = await fetch('/api/packages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(form, id))
    })
    if (res.ok) {
      showMsg('Package created!')
      setShowForm(false)
      setForm({ ...EMPTY_FORM })
      load()
    } else { const d = await res.json(); showMsg(d.error || 'Error', 'err') }
    setSaving(false)
  }

  function handleEdit(pkg: any) {
    const isDuration = pkg.type === 'duration'
    const rawDays = pkg.duration_days || 0
    const unit = rawDays > 0 && rawDays % 30 === 0 ? 'months' : 'days'
    setEditPkg(pkg)
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      type: pkg.type || 'sessions',
      total_sessions: String(pkg.total_sessions || pkg.sessions_count || ''),
      duration_days: isDuration ? String(unit === 'months' ? rawDays / 30 : rawDays) : '',
      duration_unit: unit,
      capacity: String(pkg.capacity || ''),
      absence_policy: pkg.absence_policy || 'deduct',
      notify_before_end: pkg.notify_before_end || pkg.enable_notification || false,
      is_active: pkg.is_active,
    })
  }

  async function handleSaveEdit() {
    if (!editPkg) return
    setSaving(true)
    const res = await fetch(`/api/packages/${editPkg.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(form, id))
    })
    if (res.ok) { showMsg('Updated!'); setEditPkg(null); load() }
    setSaving(false)
  }

  async function toggleActive(pkg: any) {
    await fetch(`/api/packages/${pkg.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pkg.is_active })
    })
    load()
  }

  function exportCSV() {
    const headers = ['name','type','price','sessions_count','duration_days','capacity','absence_policy','enable_notification']
    const rows = packages.map(p => [p.name, p.type||'sessions', p.price, p.sessions_count||'', p.duration_days||'', p.capacity||'', p.absence_policy||'deduct', p.enable_notification?'true':'false'])
    const csv = ['\uFEFFsep=,', headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='packages.csv'; a.click()
  }

  function downloadTemplate() {
    const csv = `\uFEFFsep=,
name,type,price,sessions_count,duration_days,capacity,absence_policy,enable_notification
Beginners Swimming - 8 Sessions,sessions,350,8,,10,deduct,true
Online Training - 1 Month,duration,200,,30,,,false
Renewal - 3 Months,duration,500,,90,,,false`
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='packages-template.csv'; a.click()
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(l => { const t = l.trim(); return t && !t.startsWith('#') && !t.toLowerCase().startsWith('sep=') })
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    let success = 0, failed = 0
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const row: any = {}
      headers.forEach((h, idx) => { row[h] = values[idx] || '' })
      if (!row.name || !row.price) { failed++; continue }
      const isDuration = row.type === 'duration'
      const res = await fetch('/api/packages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: id,
          name: row.name, price: parseFloat(row.price),
          type: row.type || 'sessions',
          sessions_count: isDuration ? null : (parseInt(row.sessions_count) || null),
          duration_days:  isDuration ? (parseInt(row.duration_days) || null) : null,
          capacity: parseInt(row.capacity) || null,
          absence_policy: row.absence_policy || 'deduct',
          enable_notification: row.enable_notification === 'true',
          is_active: true
        })
      })
      if (res.ok) success++; else failed++
    }
    alert(`Imported: ${success} success, ${failed} failed`)
    e.target.value = ''; load()
  }

  // ── FormFields ─────────────────────────────────────────────
  const FormFields = () => {
    const isDuration = form.type === 'duration'
    return (
      <div className="space-y-3">
        {/* Type selector */}
        <div>
          <Label>PACKAGE TYPE</Label>
          <div className="flex gap-2">
            {[
              { value: 'sessions', label: 'Sessions', icon: BookOpen, desc: 'Fixed number of sessions' },
              { value: 'duration', label: 'Duration', icon: Calendar, desc: 'Time-based (e.g. 1 month)' },
            ].map(({ value, label, icon: Icon, desc }) => {
              const active = form.type === value
              return (
                <button key={value} type="button" onClick={() => setForm({ ...form, type: value })}
                  className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{
                    border: `2px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    background: active ? 'var(--primary-dim)' : 'var(--bg)',
                  }}>
                  <Icon size={18} style={{ color: active ? 'var(--primary)' : 'var(--text-ter)', flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: active ? 'var(--primary)' : 'var(--ink)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-ter)' }}>{desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div style={{ gridColumn: '1 / -1' }}>
            <Label>NAME *</Label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inp} placeholder={isDuration ? 'Online Training - 1 Month' : 'Beginners Swimming - 8 Sessions'} />
          </div>
          <div>
            <Label>PRICE (QAR) *</Label>
            <input value={form.price} onChange={e => setForm({...form, price: e.target.value})} style={inp} type="number" placeholder="350" />
          </div>

          {isDuration ? (
            <div>
              <Label>DURATION *</Label>
              <div className="flex gap-2">
                <input value={form.duration_days} onChange={e => setForm({...form, duration_days: e.target.value})}
                  style={{ ...inp, width: '60%' }} type="number" placeholder="1" />
                <select value={form.duration_unit} onChange={e => setForm({...form, duration_unit: e.target.value})}
                  style={{ ...inp, width: '40%', cursor: 'pointer' }}>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <Label>TOTAL SESSIONS *</Label>
              <input value={form.total_sessions} onChange={e => setForm({...form, total_sessions: e.target.value})} style={inp} type="number" placeholder="8" />
            </div>
          )}

          <div>
            <Label>CAPACITY</Label>
            <input value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} style={inp} type="number" placeholder="Optional" />
          </div>

          {!isDuration && (
            <div>
              <Label>ABSENCE POLICY</Label>
              <select value={form.absence_policy} onChange={e => setForm({...form, absence_policy: e.target.value})}
                style={{ ...inp, cursor: 'pointer' }}>
                <option value="deduct">Deduct — الغياب يُحسب حصة</option>
                <option value="postpone">Postpone — يحق التعويض</option>
              </select>
            </div>
          )}

          {!isDuration && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="notify_cb" checked={form.notify_before_end}
                onChange={e => setForm({...form, notify_before_end: e.target.checked})}
                style={{ width: 15, height: 15, accentColor: 'var(--primary)', cursor: 'pointer' }} />
              <label htmlFor="notify_cb" style={{ fontSize: 13, color: 'var(--text-sec)', cursor: 'pointer' }}>
                إشعار عند اقتراب نهاية الحصص
              </label>
            </div>
          )}
        </div>
      </div>
    )
  }

  function pkgDurationLabel(pkg: any) {
    const d = pkg.duration_days
    if (!d) return null
    if (d % 30 === 0) return `${d / 30} month${d / 30 > 1 ? 's' : ''}`
    return `${d} days`
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.5px' }}>Packages</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-ter)' }}>{packages.length} packages</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <FileText size={14} /> Template
          </button>
          <label className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <Upload size={14} /> Import
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
            <Download size={14} /> Export
          </button>
          <button onClick={() => { setShowForm(!showForm); setEditPkg(null); setForm({...EMPTY_FORM}) }}
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white"
            style={{ background: 'var(--primary)' }}>
            <Plus size={15} /> New Package
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-semibold" style={{
          background: msgType === 'ok' ? 'var(--green-dim)' : 'var(--danger-dim)',
          color: msgType === 'ok' ? 'var(--green)' : 'var(--danger)',
        }}>{message}</div>
      )}

      {/* New Package Form */}
      {showForm && !editPkg && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--ink)' }}>New Package</h2>
          <FormFields />
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} disabled={saving}
              className="text-sm font-semibold px-5 py-2 rounded-xl text-white disabled:opacity-50"
              style={{ background: 'var(--primary)' }}>
              {saving ? 'Saving...' : 'Create Package'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="text-sm font-semibold px-5 py-2 rounded-xl"
              style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--bg)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--text-ter)' }}>Loading...</div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20">
          <Package size={36} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-ter)' }}>No packages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => {
            const isDuration = pkg.type === 'duration'
            const durationLabel = pkgDurationLabel(pkg)
            return (
              <div key={pkg.id} className="rounded-2xl overflow-hidden" style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                opacity: pkg.is_active ? 1 : 0.55
              }}>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isDuration
                        ? <Calendar size={14} style={{ color: 'var(--teal)', flexShrink: 0 }} />
                        : <BookOpen size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />}
                      <p className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{pkg.name}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                        background: isDuration ? 'var(--teal-dim)' : 'var(--primary-dim)',
                        color: isDuration ? 'var(--teal)' : 'var(--primary)',
                      }}>
                        {isDuration ? 'Duration' : 'Sessions'}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-sec)' }}>{pkg.price} QAR</span>
                      <span className="text-xs" style={{ color: 'var(--text-ter)' }}>·</span>
                      {isDuration
                        ? <span className="text-xs" style={{ color: 'var(--text-sec)' }}>{durationLabel}</span>
                        : <span className="text-xs" style={{ color: 'var(--text-sec)' }}>{pkg.total_sessions || pkg.sessions_count} sessions</span>
                      }
                      {pkg.capacity && <>
                        <span className="text-xs" style={{ color: 'var(--text-ter)' }}>·</span>
                        <span className="text-xs" style={{ color: 'var(--text-sec)' }}>Cap: {pkg.capacity}</span>
                      </>}
                      {!isDuration && pkg.absence_policy && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                          background: pkg.absence_policy === 'deduct' ? 'var(--danger-dim)' : 'var(--primary-dim)',
                          color: pkg.absence_policy === 'deduct' ? 'var(--danger)' : 'var(--primary)',
                        }}>
                          {pkg.absence_policy === 'deduct' ? 'Deduct' : 'Postpone'}
                        </span>
                      )}
                      {(pkg.notify_before_end || pkg.enable_notification) && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--warn-dim)', color: 'var(--warn)' }}>إشعار مفعّل</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => editPkg?.id === pkg.id ? setEditPkg(null) : handleEdit(pkg)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}>
                      {editPkg?.id === pkg.id ? 'Close' : 'Edit'}
                    </button>
                    <button onClick={() => toggleActive(pkg)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{
                        background: pkg.is_active ? 'var(--danger-dim)' : 'var(--green-dim)',
                        color: pkg.is_active ? 'var(--danger)' : 'var(--green)',
                      }}>
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>

                {editPkg?.id === pkg.id && (
                  <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--divider)', background: 'var(--bg)' }}>
                    <FormFields />
                    <div className="flex gap-2 mt-4">
                      <button onClick={handleSaveEdit} disabled={saving}
                        className="text-xs font-semibold px-4 py-1.5 rounded-lg text-white disabled:opacity-50"
                        style={{ background: 'var(--primary)' }}>
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditPkg(null)}
                        className="text-xs font-semibold px-4 py-1.5 rounded-lg"
                        style={{ border: '1px solid var(--border)', color: 'var(--text-sec)', background: 'var(--surface)' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
