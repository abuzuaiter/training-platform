import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function logAudit({
  action,
  entity_type,
  entity_id,
  organization_id,
  details,
}: {
  action: string
  entity_type: string
  entity_id?: string | null
  organization_id?: string | null
  details?: Record<string, any> | null
}) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')?.value
    const user_email = session ? (JSON.parse(session).email ?? 'admin') : 'admin'
    await supabaseAdmin.from('audit_logs').insert({
      user_email,
      action,
      entity_type,
      entity_id:       entity_id       ?? null,
      organization_id: organization_id ?? null,
      details:         details         ?? null,
    })
  } catch (_) {}
}
