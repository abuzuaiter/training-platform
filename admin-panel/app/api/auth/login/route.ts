import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
async function logAction(supabase: any, action: string, entity_type: string, entity_id?: string, details?: any) {
  try {
    await supabase.from('audit_logs').insert({
      user_email: 'admin', action, entity_type,
      entity_id: entity_id || null, details: details || null
    })
  } catch (e) {}
}


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

  if (SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
    role = 'super_admin'
  } else {
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    if (membership) {
      role = 'org_admin'
      organization_id = membership.organization_id
    } else {
      return NextResponse.json({ error: 'You do not have access to this portal' }, { status: 403 })
    }
  }

  const sessionData = JSON.stringify({ role, organization_id, email })
  const res = NextResponse.json({ role, organization_id })
  res.cookies.set('admin_session', sessionData, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7
  })

  return res
}
