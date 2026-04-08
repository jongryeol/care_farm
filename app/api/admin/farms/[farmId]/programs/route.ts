import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ farmId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { farmId } = await params

  if (session.role === 'farm_admin' && session.farmId !== farmId) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('farm_programs')
    .select('id, programs(id, title)')
    .eq('farm_id', farmId)
    .eq('is_active', true)
    .order('id')

  return NextResponse.json({ farmPrograms: data ?? [] })
}
