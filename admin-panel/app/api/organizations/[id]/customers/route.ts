import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'


async function logAction(supabase: any, action: string, entity_type: string, entity_id?: string, details?: any, organization_id?: string) {
  try {
    await supabase.from('audit_logs').insert({
      user_email: 'admin',
      action,
      entity_type,
      entity_id: entity_id || null,
      details: details || null,
      organization_id: organization_id || null,
    })
  } catch (e) {
    console.error('Audit log error:', e)
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('customer_organizations')
    .select('customers(*)')
    .eq('organization_id', id)
  if (error) return NextResponse.json([], { status: 200 })
  const customers = (data || []).map((d: any) => d.customers).filter(Boolean)

  // Attach avatar_url from profiles via auth user lookup
  try {
    const emails = customers.map((c: any) => c.email).filter(Boolean) as string[]
    if (emails.length > 0) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const emailToId: Record<string, string> = {}
      users.forEach(u => { if (u.email) emailToId[u.email.toLowerCase()] = u.id })

      const userIds = emails
        .map(e => emailToId[e.toLowerCase()])
        .filter(Boolean) as string[]

      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, avatar_url')
          .in('id', userIds)

        const idToAvatar: Record<string, string> = {}
        ;(profiles || []).forEach((p: any) => { if (p.avatar_url) idToAvatar[p.id] = p.avatar_url })

        return NextResponse.json(customers.map((c: any) => ({
          ...c,
          avatar_url: c.email ? (idToAvatar[emailToId[c.email.toLowerCase()]] ?? null) : null
        })))
      }
    }
  } catch (_) {}

  return NextResponse.json(customers)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { full_name, email, mobile, has_guardian, guardian_email, guardian_mobile, notes } = body
  if (!full_name) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })

  // Check plan limit
  const { count: customerCount } = await supabaseAdmin
    .from('customer_organizations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)

  const { data: activePlan } = await supabaseAdmin
    .from('organization_plans')
    .select('*, plans(max_customers, name)')
    .eq('organization_id', id)
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activePlan?.plans) {
    const limit = activePlan.plans.max_customers
    const current = customerCount || 0
    if (current >= limit) {
      return NextResponse.json({
        error: `Plan limit reached (${current}/${limit} customers). Please upgrade your plan "${activePlan.plans.name}".`
      }, { status: 400 })
    }
  }

  const { data: customer, error } = await supabaseAdmin
    .from('customers')
    .insert({
      full_name, email: email || null, mobile: mobile || null,
      has_guardian: has_guardian || false,
      guardian_email: guardian_email || null,
      guardian_mobile: guardian_mobile || null,
      notes: notes || null, status: 'active'
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('customer_organizations').insert({
    customer_id: customer.id, organization_id: id
  })

  await logAction(supabaseAdmin, 'create', 'customer', customer.id, { name: customer.full_name }, id)
  return NextResponse.json(customer)
}
