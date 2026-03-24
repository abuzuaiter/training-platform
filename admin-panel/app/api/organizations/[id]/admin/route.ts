import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { email } = await req.json()

  if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  const { data: user } = await supabaseAdmin
    .from('users').select('id').eq('email', email).single()

  if (!user) return NextResponse.json({ error: 'User not found — must register first' }, { status: 404 })

  await supabaseAdmin.from('organization_members').upsert({
    organization_id: id,
    user_id: user.id,
    role: 'admin',
    status: 'active',
    joined_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,user_id' })

  return NextResponse.json({ success: true })
}
