import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { full_name, mobile, email, password } = await req.json()

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
    email, password,
    options: { data: { full_name } }
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Signup failed' }, { status: 400 })
  }

  const userId = authData.user.id

  // Save to users table
  await supabaseAdmin.from('users').upsert({
    id: userId,
    email,
    full_name,
    mobile: mobile ? `+974${mobile.replace(/\s/g, '')}` : null,
  })

  // Check if email exists in organization_members (pending)
  const { data: pendingMember } = await supabaseAdmin
    .from('organization_members')
    .select('id, organization_id, role, status')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  let role = 'user'
  let organization_id = null
  let member_role = null

  if (pendingMember) {
    // Activate member
    await supabaseAdmin
      .from('organization_members')
      .update({ user_id: userId, status: 'active' })
      .eq('id', pendingMember.id)

    role = pendingMember.role === 'admin' ? 'org_admin' : 'org_member'
    organization_id = pendingMember.organization_id
    member_role = pendingMember.role
  }

  // Set session cookie
  const sessionData = JSON.stringify({ role, organization_id, email, permissions: { member_role } })
  const res = NextResponse.json({ role, organization_id, member_role })
  res.cookies.set('admin_session', sessionData, {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })

  return res
}
