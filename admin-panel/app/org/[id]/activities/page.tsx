'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function OrgActivitiesPage() {
  const params = useParams()
  const id = params.id as string
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { if (id) load() }, [id])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/activities?org_id=${id}`)
    setActivities(await res.json() || [])
    setLoading(false)
  }

  const typeColors: Record<string, string> = {
    fixed: 'bg-blue-50 text-blue-600', open: 'bg-green-50 text-green-600',
    private: 'bg-purple-50 text-purple-600', session: 'bg-amber-50 text-amber-600',
  }

  const filtered = activities.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href={`/org/${id}`} className="text-gray-400 hover:text-gray-600 text-sm">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900 font-semibold text-sm">Activities</span>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
            <p className="text-gray-500 text-sm mt-1">{filtered.length} activities</p>
          </div>
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 mb-4" placeholder="Search activities..." />
        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No activities yet</div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{a.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[a.enrollment_type] || 'bg-gray-50 text-gray-600'}`}>{a.enrollment_type}</span>
                    </div>
                    {a.description && <p className="text-xs text-gray-400">{a.description}</p>}
                    {a.price && <p className="text-sm font-medium text-green-600 mt-1">{a.price} QAR</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
