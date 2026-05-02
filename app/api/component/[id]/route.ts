import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Context) {
  const { id } = await params

  const { data, error } = await getSupabase()
    .from('components')
    .select('id, code, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Component not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params
  const body = await request.json()
  const code: string = body?.code

  if (!code || !code.trim()) {
    return NextResponse.json({ error: 'code is required' }, { status: 400 })
  }

  const { data, error } = await getSupabase()
    .from('components')
    .update({ code, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, code, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Component not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
