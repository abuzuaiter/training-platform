import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('*')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { full_name, email, mobile, has_guardian, guardian_email, guardian_mobile, subscription_price, notes } = body

  if (!full_name) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('customers')
    .insert({
      organization_id: id,
      full_name,
      email: email || null,
      mobile: mobile || null,
      has_guardian: has_guardian || false,
      guardian_email: guardian_email || null,
      guardian_mobile: guardian_mobile || null,
      subscription_price: subscription_price || null,
      notes: notes || null,
      status: 'active'
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
