'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Activity {
  id: string
  name: string
  description: string | null
  organization_id: string
  start_date: string
  end_date: string
  enrollment_type: string
  organizations: { name: string }
  activity_schedule: Schedule[]
}

interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  coach_id: string | null
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function ManageActivityPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '', enrollment_type: 'fixed' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [scheduleForm, setScheduleForm] = useState({ day_of_week: '0', start_time: '08:00', end_time: '09:00' })
  const [scheduleSaving, setScheduleSaving] = useState(false)

  useEffect(() => { if (id) loadActivity() }, [id])

  async function loadActivity() {
    const res = await fetch(`/api/activities/${id}`)
    const data = await res.json()
    setActivity(data)
    setForm({
      name: data.name || '',
      description: data.description || '',
      start_date: data.start_date || '',
      end_date: data.end_date || '',
      enrollment_type: data.enrollment_type || 'fixed',
    })
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch(`/api/activities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) { setMessage('Saved successfully!'); loadActivity() }
    else { const d = await res.json(); setMessage(d.error || 'Error') }
    setSaving(false)
  }

  async function handleAddSchedule() {
    setScheduleSaving(true)
    const res = await fetch(`/api/activities/${id}/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        day_of_week: parseInt(scheduleForm.day_of_week),
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
        activity_id: id
      })
    })
    if (res.ok) { loadActivity() }
    setScheduleSaving(false)
  }

  async function handleDeleteSchedule(scheduleId: string) {
    await fetch(`/api/activities/${id}/schedule/${scheduleId}`, { method: 'DELETE' })
    loadActivity()
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
  if (!activity) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/activities" className="text-gray-400 hover:text-gray-600 text-sm">Activities</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">{activity.name}</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">{activity.name}</h1>
        <p className="text-sm text-gray-500">{activity.organizations?.name}</p>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">COURSE NAME *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">ENROLLMENT TYPE</label>
              <select value={form.enrollment_type} onChange={e => setForm({...form, enrollment_type: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                <option value="fixed">Fixed — محدد بتاريخ</option>
                <option value="open">Open — مفتوح</option>
                <option value="private">Private — خاص</option>
                <option value="session">Session — حصة واحدة</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">START DATE</label>
              <input value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                type="date" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">END DATE</label>
              <input value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                type="date" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">DESCRIPTION</label>
              <textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                rows={3} />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => router.push('/activities')}
              className="border border-gray-200 text-gray-600 px-6 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition">
              Back
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Weekly Schedule</h2>
          <div className="flex gap-3 mb-4 flex-wrap">
            <select value={scheduleForm.day_of_week} onChange={e => setScheduleForm({...scheduleForm, day_of_week: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
              {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <input value={scheduleForm.start_time} onChange={e => setScheduleForm({...scheduleForm, start_time: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              type="time" />
            <input value={scheduleForm.end_time} onChange={e => setScheduleForm({...scheduleForm, end_time: e.target.value})}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              type="time" />
            <button onClick={handleAddSchedule} disabled={scheduleSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50">
              {scheduleSaving ? 'Adding...' : '+ Add'}
            </button>
          </div>

          {activity.activity_schedule?.length === 0 ? (
            <p className="text-sm text-gray-400">No schedule yet</p>
          ) : (
            <div className="space-y-2">
              {activity.activity_schedule?.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex gap-4">
                    <span className="text-sm font-medium text-gray-900">{days[s.day_of_week]}</span>
                    <span className="text-sm text-gray-500">{s.start_time} — {s.end_time}</span>
                  </div>
                  <button onClick={() => handleDeleteSchedule(s.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
