import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { getSupabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const code: string = body?.code

  if (!code || !code.trim()) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('components')
    .insert({ code })
    .select('id, code, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
