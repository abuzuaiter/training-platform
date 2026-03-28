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
    .from('invoices')
    .select('*, organizations(id, name, email, mobile), organization_plans(*, plans(*))')
    .eq('id', id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updateData: any = { ...body }
  if (body.status === 'paid') updateData.paid_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin
    .from('invoices').update(updateData).eq('id', id)
    .select('*, organizations(id, name, email), organization_plans(*, plans(*))').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send receipt email when marked as paid
  if (body.status === 'paid' && data.organizations?.email) {
    try {
      await resend.emails.send({
        from: 'Mawid <onboarding@resend.dev>',
        to: data.organizations.email,
        subject: `Payment Receipt - ${data.invoice_number}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #185FA5; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0;">موعد — Mawid</h1>
              <p style="color: #93c5fd; margin: 8px 0 0;">Payment Receipt</p>
            </div>
            <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <h2 style="color: #16a34a;">✅ Payment Confirmed</h2>
              <p>Dear <strong>${data.organizations.name}</strong>,</p>
              <p>We confirm receipt of your payment.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                <tr style="background: #f9fafb;">
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">Receipt Number</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>${data.invoice_number}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">Plan</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${data.organization_plans?.plans?.name || 'N/A'}</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">Amount Paid</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>${data.amount} QAR</strong></td>
                </tr>
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">Date</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${new Date().toLocaleDateString()}</td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 13px;">Thank you for your business!</p>
            </div>
          </div>
        `
      })
    } catch (e) {
      console.error('Email error:', e)
    }
  }

  return NextResponse.json(data)
}
