import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id, memberId } = await params
  const { data: member } = await supabaseAdmin.from('organization_members').select('email, role').eq('id', memberId).single()
  const { error } = await supabaseAdmin
    .from('organization_members')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({ action: 'delete', entity_type: 'member', entity_id: memberId, organization_id: id, details: { email: member?.email ?? null, role: member?.role ?? null } })
  return NextResponse.json({ success: true })
}
