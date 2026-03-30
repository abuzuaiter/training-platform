import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { data, error } = await supabaseAdmin
    .from('bookings').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: booking } = await supabaseAdmin.from('bookings').select('session_id').eq('id', id).single()
  const { error } = await supabaseAdmin.from('bookings').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (booking?.session_id) {
    const { data: session } = await supabaseAdmin.from('sessions').select('booked_count').eq('id', booking.session_id).single()
    await supabaseAdmin.from('sessions').update({ booked_count: Math.max(0, (session?.booked_count || 1) - 1) }).eq('id', booking.session_id)
  }
  return NextResponse.json({ success: true })
}
