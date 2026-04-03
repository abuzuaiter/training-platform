import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')
  let query = supabaseAdmin.from('packages').select('*').order('created_at', { ascending: false })
  if (org_id) query = query.eq('organization_id', org_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { organization_id, name, description, type, sessions_count, price, absence_policy, enable_notification } = body
  if (!organization_id || !name || !price) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('packages').insert({
    organization_id, name, description: description || null,
    type: type || 'sessions',
    sessions_count: type === 'sessions' ? sessions_count : null,
    price, absence_policy: absence_policy || 'deduct',
    enable_notification: type !== 'single' ? enable_notification : false,
    is_active: true
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
