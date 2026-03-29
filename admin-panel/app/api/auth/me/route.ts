import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  if (!session) return NextResponse.json({ role: null })
  const data = JSON.parse(session)
  return NextResponse.json({ role: data.role, email: data.email, permissions: data.permissions || {} })
}
