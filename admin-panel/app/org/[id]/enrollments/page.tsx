'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const DAY_NAMES = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الاثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
  { key: 'saturday', label: 'السبت' },
]

export default function OrgEnrollmentsPage() {
  const params = useParams()
  const id = params.id as string
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    customer_id: '', package_id: '', session_id: '',
    start_date: '', payment_status: 'pending'
  })

  useEffect(() => { if (id) loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [enrRes, custRes, pkgRes, sessRes] = await Promise.all([
      fetch(`/api/enrollments?org_id=${id}`),
      fetch(`/api/organizations/${id}/customers`),
      fetch(`/api/packages?org_id=${id}`),
      fetch(`/api/session-templates?org_id=${id}`)
    ])
    setEnrollments(enrRes.ok ? await enrRes.json() : [])
    setCustomers(custRes.ok ? await custRes.json() : [])
    setPackages(pkgRes.ok ? await pkgRes.json() : [])
    setSessions(sessRes.ok ? await sessRes.json() : [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!form.customer_id || !form.package_id || !form.session_id || !form.start_date) {
      setMessage('All fields are required'); return
    }

    // Check capacity
    const pkg = packages.find(p => p.id === form.package_id)
    if (pkg?.capacity) {
      const enrolled = enrollments.filter(e => e.package_id === form.package_id && e.status === 'active').length
      if (enrolled >= pkg.capacity) {
        setMessage(`Package is full! Max capacity: ${pkg.capacity}`); return
      }
    }

    setSaving(true)
    const res = await fetch('/api/enrollments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: form.customer_id,
        package_id: form.package_id,
        session_id: form.session_id,
        organization_id: id,
        start_date: form.start_date,
        payment_status: form.payment_status,
        paid_at: form.payment_status === 'paid' ? new Date().toISOString() : null,
        sessions_remaining: pkg?.sessions_count || pkg?.total_sessions || 0,
        sessions_attended: 0,
        status: 'active'
      })
    })

    if (!template || !pkg) { console.log('EARLY RETURN - template or pkg missing'); return }

    const totalSessions = pkg.sessions_count || pkg.total_sessions || 0
    if (totalSessions === 0) return

    const QATAR_OFFSET = 3 * 60 * 60 * 1000
    const dayOrder = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
    const [sh, sm] = template.start_time.slice(0,5).split(':').map(Number)
    const [eh, em] = template.end_time.slice(0,5).split(':').map(Number)
    const selectedDayNums = (template.recurrence_days || []).map((d: string) => dayOrder.indexOf(d)).sort((a: number, b: number) => a - b)

    // Parse date in local time to avoid UTC offset issue
    const [year, month, day] = startDate.split('-').map(Number)
    let current = new Date(year, month - 1, day)
    let count = 0

    while (count < totalSessions) {
      const currentDayNum = current.getDay()
      if (selectedDayNums.includes(currentDayNum)) {
        const startDt = new Date(current)
        startDt.setHours(sh, sm, 0, 0)
        const endDt = new Date(current)
        endDt.setHours(eh, em, 0, 0)

        const sessRes = await fetch('/api/calendar-sessions', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: id,
            title: template.title,
            start_time: new Date(startDt.getTime() - QATAR_OFFSET).toISOString(),
            end_time: new Date(endDt.getTime() - QATAR_OFFSET).toISOString(),
            capacity: template.capacity,
          })
        })
        if (sessRes.ok) {
          const sess = await sessRes.json()
          await fetch('/api/calendar-bookings', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sess.id, customer_id: customerId, organization_id: id, enrollment_id: enrollmentId })
          })
          count++
        } else {
          const errData = await sessRes.json()
    }
