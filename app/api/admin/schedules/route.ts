import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/schedules — 새 회차 추가
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const body = await request.json()
  const { farm_program_id, year, day_of_week, start_time, end_time, max_capacity, recommended_capacity, available_months } = body

  if (!farm_program_id || !year || day_of_week === undefined || !start_time || !end_time) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // 농장관리자 권한 확인
  if (session.role === 'farm_admin') {
    const { data: fp } = await supabase
      .from('farm_programs')
      .select('farm_id')
      .eq('id', farm_program_id)
      .maybeSingle()
    if (!fp || fp.farm_id !== session.farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('farm_schedules')
    .insert({
      farm_program_id,
      year: Number(year),
      day_of_week,
      start_time,
      end_time,
      max_capacity: max_capacity ?? 12,
      recommended_capacity: recommended_capacity ?? 8,
      available_months: available_months ?? [],
    })
    .select()
    .single()

  if (error) {
    console.error('schedule create error:', error)
    return NextResponse.json({ error: '추가에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ schedule: data }, { status: 201 })
}
