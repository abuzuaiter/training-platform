import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const entity_type = searchParams.get('entity_type')
  const limit = parseInt(searchParams.get('limit') || '100')

  let query = supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (entity_type) query = query.eq('entity_type', entity_type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { user_email, action, entity_type, entity_id, details } = body

  const { data, error } = await supabaseAdmin.from('audit_logs').insert({
    user_email: user_email || 'system',
    action,
    entity_type,
    entity_id: entity_id || null,
    details: details || null
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
