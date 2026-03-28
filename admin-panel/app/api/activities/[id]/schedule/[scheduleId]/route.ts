import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await params
  const { error } = await supabaseAdmin.from('activity_schedule').delete().eq('id', scheduleId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
