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


export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select(`
      *,
      customer_organizations (
        organization_id,
        organizations (
          id,
          name,
          org_code
        )
      )
    `)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { full_name, email, mobile, has_guardian, guardian_email, guardian_mobile, notes, organization_id } = body
  if (!full_name) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })

  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .insert({
      full_name, email: email || null, mobile: mobile || null,
      has_guardian: has_guardian || false,
      guardian_email: guardian_email || null,
      guardian_mobile: guardian_mobile || null,
      notes: notes || null, status: 'active'
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (organization_id) {
    await supabaseAdmin.from('customer_organizations').insert({
      customer_id: customer.id, organization_id
    })
  }

  await logAction(supabaseAdmin, 'create', 'customer', customer.id, { name: customer.full_name })
  return NextResponse.json(customer)
}