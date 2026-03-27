import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ subId: string }> }) {
  const { subId } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('customer_subscriptions').update(body).eq('id', subId).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ subId: string }> }) {
  const { subId } = await params
  const { error } = await supabaseAdmin.from('customer_subscriptions').delete().eq('id', subId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}