import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
async function logAction(supabase: any, action: string, entity_type: string, entity_id?: string, details?: any) {
  try {
    await supabase.from('audit_logs').insert({
      user_email: 'admin', action, entity_type,
      entity_id: entity_id || null, details: details || null
    })
  } catch (e) {}
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')

  let query = supabaseAdmin
    .from('activities')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false })

  if (org_id) query = query.eq('organization_id', org_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction(supabaseAdmin, 'create', 'activity', data.id, { name: data.name })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, organization_id, start_date, end_date } = body

  if (!name || !organization_id || !start_date || !end_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('activities')
    .insert({ name, description, organization_id, start_date, end_date })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction(supabaseAdmin, 'create', 'activity', data.id, { name: data.name })
  return NextResponse.json(data)
}
