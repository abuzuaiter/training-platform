'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function OrgDashboard() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  useEffect(() => {
    if (id) router.replace(`/org/${id}/calendar`)
  }, [id])

  return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>
}
