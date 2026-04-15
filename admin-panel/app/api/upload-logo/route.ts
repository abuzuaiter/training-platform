import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const org_id = formData.get('org_id') as string

  if (!file || !org_id) {
    return NextResponse.json({ error: 'File and org_id required' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name.split('.').pop()
  const fileName = `logos/${org_id}.${ext}`

  const { error } = await supabaseAdmin.storage
    .from('org-assets')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from('org-assets').getPublicUrl(fileName)

  // Update organization logo_url
  await supabaseAdmin.from('organizations')
    .update({ logo_url: data.publicUrl })
    .eq('id', org_id)

  return NextResponse.json({ url: data.publicUrl })
}
