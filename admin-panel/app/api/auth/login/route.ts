import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SUPER_ADMIN_EMAILS = ['mohd.abuzuaiter@live.com']

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const { data, error } = await createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ).auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  let role = ''
  let organization_id = null
  let permissions: Record<string, string[]> = {}

  if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
    role = 'super_admin'
  } else {
    // Check if org admin
    const { data: adminMembership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (adminMembership) {
      role = 'org_admin'
      organization_id = adminMembership.organization_id
    } else {
      // Link email to organization_members if pending
      const { data: pendingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id, organization_id, role')
        .eq('email', email.toLowerCase())
        .eq('status', 'pending')
        .maybeSingle()

      if (pendingMember) {
        // Activate and link user_id
        await supabaseAdmin
          .from('organization_members')
          .update({ user_id: data.user.id, status: 'active' })
          .eq('id', pendingMember.id)

        // Also update users table
        await supabaseAdmin
          .from('users')
          .upsert({ id: data.user.id, email: data.user.email, full_name: data.user.email })

        role = 'org_member'
        organization_id = pendingMember.organization_id
        const { data: pendingFull } = await supabaseAdmin
          .from('organization_members')
          .select('role, allowed_pages')
          .eq('id', pendingMember.id).single()
        permissions = { member_role: pendingMember.role, allowed_pages: pendingFull?.allowed_pages || ['dashboard','calendar'] }
      } else {
        // Check if already active member
        const { data: activeMember } = await supabaseAdmin
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', data.user.id)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle()

        if (activeMember) {
          role = 'org_member'
          organization_id = activeMember.organization_id
          const { data: activeFull } = await supabaseAdmin
            .from('organization_members')
            .select('role, allowed_pages')
            .eq('user_id', data.user.id)
            .eq('status', 'active')
            .limit(1).maybeSingle()
          permissions = { member_role: activeFull?.role || activeMember.role, allowed_pages: activeFull?.allowed_pages || ['dashboard','calendar'] }
        } else {
          // Check custom role
          const { data: userRole } = await supabaseAdmin
            .from('user_roles')
            .select('roles(name, permissions)')
            .eq('user_id', data.user.id)
            .limit(1)
            .maybeSingle()

          if (userRole?.roles) {
            role = 'custom'
            permissions = (userRole.roles as any).permissions || {}
          } else {
            return NextResponse.json({ error: 'You do not have access to this portal' }, { status: 403 })
          }
        }
      }
    }
  }

  // Log login
  try {
    await supabaseAdmin.from('audit_logs').insert({
      user_email: email, action: 'login', entity_type: 'auth',
      entity_id: data.user.id, details: { role }
    })
  } catch (e) {}

  const sessionData = JSON.stringify({ role, organization_id, email, permissions })
  const res = NextResponse.json({ role, organization_id })
  res.cookies.set('admin_session', sessionData, {
    httpOnly: true, secure: true, sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })
  return res
}
