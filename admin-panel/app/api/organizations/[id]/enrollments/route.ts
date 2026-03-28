import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('activity_enrollments')
    .select('*, activities(id, name, enrollment_type, start_date, end_date), users(id, full_name, email, mobile)')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user_id, activity_id, subscription_price } = await req.json()

  if (!user_id || !activity_id) {
    return NextResponse.json({ error: 'User and activity are required' }, { status: 400 })
  }

  const { data: enrollment, error } = await supabaseAdmin
    .from('activity_enrollments')
    .insert({
      organization_id: id,
      activity_id,
      user_id,
      subscription_price: subscription_price || null,
      enrolled_by: user_id,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (subscription_price) {
    const { data: activity } = await supabaseAdmin
      .from('activities').select('start_date, end_date').eq('id', activity_id).single()

    await supabaseAdmin.from('subscriptions').insert({
      organization_id: id,
      activity_id,
      user_id,
      price: subscription_price,
      start_date: activity?.start_date || new Date().toISOString().split('T')[0],
      end_date: activity?.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
    })
  }

  return NextResponse.json(enrollment)
}
