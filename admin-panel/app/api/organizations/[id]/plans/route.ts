import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('organization_plans')
    .select('*, plans(*)')
    .eq('organization_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json([], { status: 200 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { plan_id, billing_cycle, start_date, payment_status, notes } = await req.json()

  if (!plan_id) return NextResponse.json({ error: 'Plan is required' }, { status: 400 })

  const { data: plan } = await supabaseAdmin.from('plans').select('*').eq('id', plan_id).single()
  if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  const { count } = await supabaseAdmin
    .from('customer_organizations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', id)

  if ((count || 0) > plan.max_customers) {
    return NextResponse.json({
      error: `This organization has ${count} customers which exceeds the plan limit of ${plan.max_customers}`
    }, { status: 400 })
  }

  const cycle = billing_cycle || plan.billing_cycle || 'monthly'
  const start = start_date ? new Date(start_date) : new Date()
  const end = new Date(start)

  if (cycle === 'monthly') end.setMonth(end.getMonth() + 1)
  else if (cycle === 'quarterly') end.setMonth(end.getMonth() + 3)
  else if (cycle === 'annual') end.setFullYear(end.getFullYear() + 1)

  const { data: orgPlan, error } = await supabaseAdmin.from('organization_plans').insert({
    organization_id: id, plan_id,
    start_date: start.toISOString().split('T')[0],
    end_date: end.toISOString().split('T')[0],
    billing_cycle: cycle,
    payment_status: payment_status || 'unpaid',
    notes: notes || null
  }).select('*, plans(*)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const discount = plan.discount_percentage || 0
  const amount = plan.price * (1 - discount / 100)
  const invoiceNumber = 'INV-' + Date.now().toString().slice(-6)

  const { data: org } = await supabaseAdmin
    .from('organizations').select('name, email').eq('id', id).single()

  const { data: invoice } = await supabaseAdmin.from('invoices').insert({
    invoice_number: invoiceNumber,
    organization_id: id,
    organization_plan_id: orgPlan.id,
    amount: amount,
    type: 'invoice',
    status: 'pending',
    notes: 'Plan: ' + plan.name + ' - Cycle: ' + cycle
  }).select().single()

  if (org?.email) {
    try {
      await resend.emails.send({
        from: 'Mawid <onboarding@resend.dev>',
        to: org.email,
        subject: 'Invoice ' + invoiceNumber + ' - ' + plan.name,
        html: '<div style="font-family:Arial;max-width:600px;margin:0 auto"><div style="background:#185FA5;padding:32px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:white;margin:0">موعد — Mawid</h1><p style="color:#93c5fd;margin:8px 0 0">Invoice</p></div><div style="background:white;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px"><h2>' + invoiceNumber + '</h2><p>Dear <strong>' + org.name + '</strong>,</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><tr style="background:#f9fafb"><td style="padding:12px;border:1px solid #e5e7eb">Plan</td><td style="padding:12px;border:1px solid #e5e7eb"><strong>' + plan.name + '</strong></td></tr><tr><td style="padding:12px;border:1px solid #e5e7eb">Amount Due</td><td style="padding:12px;border:1px solid #e5e7eb"><strong style="color:#185FA5">' + amount.toFixed(2) + ' QAR</strong></td></tr></table></div></div>'
      })
    } catch (e) {
      console.error('Email error:', e)
    }
  }

  return NextResponse.json(orgPlan)
}
