import { createAdminClient as createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const scheduleId = searchParams.get('scheduleId')
  const date = searchParams.get('date')

  if (!scheduleId || !date) {
    return NextResponse.json({ error: 'scheduleId, date 파라미터가 필요합니다.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: schedule } = await supabase
    .from('farm_schedules')
    .select('id, farm_program_id, max_capacity, recommended_capacity')
    .eq('id', scheduleId)
    .single()

  if (!schedule) {
    return NextResponse.json({ error: '회차를 찾을 수 없습니다.' }, { status: 404 })
  }

  // 차단 날짜 확인
  const { data: blocked } = await supabase
    .from('farm_blocked_dates')
    .select('id')
    .eq('blocked_date', date)
    .or(`farm_schedule_id.eq.${scheduleId},farm_program_id.eq.${schedule.farm_program_id}`)
    .limit(1)

  if (blocked && blocked.length > 0) {
    return NextResponse.json({
      scheduleId,
      date,
      confirmedCount: 0,
      pendingCount: 0,
      maxCapacity: schedule.max_capacity,
      recommendedCapacity: schedule.recommended_capacity,
      remaining: 0,
      isAvailable: false,
      isBlocked: true,
    })
  }

  const { data: reservations } = await supabase
    .from('reservations')
    .select('status, head_count')
    .eq('schedule_id', scheduleId)
    .eq('reservation_date', date)
    .in('status', ['pending', 'confirmed'])

  const confirmedCount = reservations
    ?.filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.head_count, 0) ?? 0

  const pendingCount = reservations
    ?.filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.head_count, 0) ?? 0

  const total = confirmedCount + pendingCount

  return NextResponse.json({
    scheduleId,
    date,
    confirmedCount,
    pendingCount,
    maxCapacity: schedule.max_capacity,
    recommendedCapacity: schedule.recommended_capacity,
    remaining: schedule.max_capacity - total,
    isAvailable: total < schedule.max_capacity,
    isOverRecommended: total > schedule.recommended_capacity,
    isBlocked: false,
  })
}
