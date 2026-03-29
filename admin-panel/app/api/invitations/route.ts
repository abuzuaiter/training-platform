import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { cookies } from 'next/headers'

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


const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const org_id = searchParams.get('org_id')
  let query = supabaseAdmin.from('invitations').select('*').order('created_at', { ascending: false })
  if (org_id) query = query.eq('organization_id', org_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAction(supabaseAdmin, 'create', 'invitation', data.id, { email: data.email, role: data.role })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { organization_id, email, role } = await req.json()

  if (!organization_id || !email || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value
  let invitedByUserId = null

  if (session) {
    const sessionData = JSON.parse(session)
    const { data: user } = await supabaseAdmin
      .from('users').select('id').eq('email', sessionData.email).single()
    if (user) invitedByUserId = user.id
  }

  if (!invitedByUserId) {
    return NextResponse.json({ error: 'Could not identify the inviting user' }, { status: 401 })
  }

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')

  const { data: org } = await supabaseAdmin
    .from('organizations').select('name').eq('id', organization_id).single()

  const { data: invitation, error } = await supabaseAdmin
    .from('invitations')
    .insert({
      organization_id, email, role,
      invited_by: invitedByUserId,
      token, status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`

  try {
    await resend.emails.send({
      from: 'Training Platform <onboarding@resend.dev>',
      to: email,
      subject: `You're invited to join ${org?.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #185FA5; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Training Platform</h1>
          </div>
          <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a1a1a;">You're invited! 🎉</h2>
            <p style="color: #6b7280;">You have been invited to join <strong>${org?.name}</strong> as a <strong>${role}</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${inviteUrl}" style="background: #185FA5; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px;">This invitation expires in 7 days.</p>
          </div>
        </div>
      `
    })
  } catch (e) {
    console.error('Email error:', e)
  }

  return NextResponse.json(invitation)
}
