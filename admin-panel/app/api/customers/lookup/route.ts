import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mobile = searchParams.get('mobile')
  const email = searchParams.get('email')

  let query = supabaseAdmin.from('customers').select('id, full_name, mobile, email')

  if (mobile) query = query.eq('mobile', mobile)
  else if (email) query = query.eq('email', email)
  else return NextResponse.json(null)

  const { data } = await query.maybeSingle()
  return NextResponse.json(data || null)
}
