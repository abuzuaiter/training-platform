import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')
  
  let query = supabaseAdmin
    .from('org_invoices')
    .select('*, customers(full_name, mobile), enrollments(package_id, packages(name, sessions_count))')
    .order('created_at', { ascending: false })
  
  if (org_id) query = query.eq('organization_id', org_id)
  
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { organization_id, enrollment_id, customer_id, amount } = body

  if (!organization_id || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Generate invoice number
  const { count } = await supabaseAdmin
    .from('org_invoices')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organization_id)
  
  const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, '0')}`

  const { data, error } = await supabaseAdmin
    .from('org_invoices')
    .insert({ organization_id, enrollment_id, customer_id, amount, invoice_number: invoiceNumber, status: 'pending' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'create', entity_type: 'invoice', entity_id: data.id, organization_id: data.organization_id, details: { invoice_number: data.invoice_number, amount: data.amount } })
  return NextResponse.json(data)
}
