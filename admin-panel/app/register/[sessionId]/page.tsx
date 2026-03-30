'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function RegisterPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ full_name: '', mobile: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => { loadSession() }, [])

  async function loadSession() {
    const res = await fetch(`/api/calendar-sessions/${sessionId}/register`)
    const data = await res.json()
    setSession(data)
    setLoading(false)
  }

  async function handleRegister() {
    if (!form.full_name || !form.mobile) { setMessage('Please fill your name and mobile'); return }
    setSaving(true)

    // Check if customer exists or create new
    const checkRes = await fetch(`/api/customers/lookup?mobile=${form.mobile}`)
    let customerId = null

    if (checkRes.ok) {
      const existing = await checkRes.json()
      customerId = existing?.id
    }

    if (!customerId) {
      const createRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          mobile: form.mobile,
          email: form.email || null,
          organization_id: session.organization_id
        })
      })
      if (createRes.ok) {
        const newCustomer = await createRes.json()
        customerId = newCustomer.id
      }
    }

    if (!customerId) { setMessage('Error creating customer'); setSaving(false); return }

    const res = await fetch('/api/calendar-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        customer_id: customerId,
        organization_id: session.organization_id
      })
    })

    if (res.ok) { setDone(true) }
    else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!session) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Session not found</div>

  if (done) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full shadow-sm border border-gray-200">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Registered!</h1>
        <p className="text-gray-500 text-sm">You have been registered for <strong>{session.title}</strong></p>
        <p className="text-gray-400 text-xs mt-2">{new Date(session.start_time).toLocaleString()}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">موعد — Mawid</h1>
          <p className="text-gray-500 text-sm mt-1">Session Registration</p>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h2 className="font-bold text-gray-900">{session.title}</h2>
          <p className="text-xs text-blue-600 mt-0.5">{session.organizations?.name}</p>
          <p className="text-xs text-gray-500 mt-1">{new Date(session.start_time).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{session.booked_count} / {session.capacity} registered</p>
        </div>

        {session.booked_count >= session.capacity ? (
          <div className="text-center py-4">
            <p className="text-red-500 font-medium">Session is full</p>
          </div>
        ) : (
          <>
            {message && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">{message}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">FULL NAME *</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Your name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">MOBILE *</label>
                <input value={form.mobile} onChange={e => setForm({...form, mobile: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="+97455123456" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">EMAIL</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Optional" type="email" />
              </div>
              <button onClick={handleRegister} disabled={saving}
                className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 mt-2">
                {saving ? 'Registering...' : 'Register Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}