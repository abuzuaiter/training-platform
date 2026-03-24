import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, name_ar, email, phone, mobile, admin_email, category } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  let adminUserId = null
  if (admin_email) {
    const { data: adminUser } = await supabaseAdmin
      .from('users').select('id').eq('email', admin_email).single()
    if (!adminUser) return NextResponse.json({ error: 'Admin email not found' }, { status: 404 })
    adminUserId = adminUser.id
  }
  const { data: org, error } = await supabaseAdmin.from('organizations').insert({
    name, name_ar: name_ar || null, email: email || null,
    phone: phone || null, mobile: mobile || null,
    category: category || null, status: 'active',
    created_by: adminUserId,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (adminUserId) {
    await supabaseAdmin.from('organization_members').insert({
      organization_id: org.id, user_id: adminUserId,
      role: 'admin', status: 'active', joined_at: new Date().toISOString(),
    })
  }
  return NextResponse.json(org)
}
