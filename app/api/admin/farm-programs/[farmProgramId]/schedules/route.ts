import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

interface Params { params: Promise<{ farmProgramId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { farmProgramId } = await params
  const supabase = await createAdminClient()

  // 농장관리자: 해당 farm_program이 본인 농장인지 확인
  if (session.role === 'farm_admin') {
    const { data: fp } = await supabase
      .from('farm_programs')
      .select('farm_id')
      .eq('id', farmProgramId)
      .maybeSingle()
    if (!fp || fp.farm_id !== session.farmId) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
    }
  }

  const { data } = await supabase
    .from('farm_schedules')
    .select('id, day_of_week, start_time, end_time, max_capacity')
    .eq('farm_program_id', farmProgramId)
    .eq('is_active', true)
    .order('day_of_week')
    .order('start_time')

  return NextResponse.json({ schedules: data ?? [] })
}
