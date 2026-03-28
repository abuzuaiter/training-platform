import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('plans').select('*').order('price', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, max_customers, price, discount_percentage } = body
  if (!name || !max_customers || !price) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('plans').insert({
    name, description: description || null,
    max_customers: parseInt(max_customers),
    price: parseFloat(price),
    discount_percentage: discount_percentage ? parseFloat(discount_percentage) : 0
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
