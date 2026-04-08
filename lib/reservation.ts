import { createClient } from '@/lib/supabase/server'
import type { ScheduleCapacity } from '@/lib/types'

/**
 * 특정 날짜+회차의 예약 현황 조회
 */
export async function getScheduleCapacity(
  scheduleId: string,
  reservationDate: string
): Promise<ScheduleCapacity | null> {
  const supabase = await createClient()

  const { data: schedule } = await supabase
    .from('farm_schedules')
    .select('id, max_capacity, recommended_capacity')
    .eq('id', scheduleId)
    .single()

  if (!schedule) return null

  const { data: counts } = await supabase
    .from('reservations')
    .select('status, head_count')
    .eq('schedule_id', scheduleId)
    .eq('reservation_date', reservationDate)
    .in('status', ['pending', 'confirmed'])

  const confirmedCount = counts
    ?.filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + r.head_count, 0) ?? 0

  const pendingCount = counts
    ?.filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.head_count, 0) ?? 0

  const totalBooked = confirmedCount + pendingCount

  return {
    scheduleId,
    date: reservationDate,
    confirmedCount,
    pendingCount,
    maxCapacity: schedule.max_capacity,
    recommendedCapacity: schedule.recommended_capacity,
    isAvailable: totalBooked < schedule.max_capacity,
    isOverRecommended: totalBooked > schedule.recommended_capacity,
  }
}

/**
 * 특정 날짜에 농장이 운영하는지 확인
 */
export function isOperatingDay(dayOfWeek: number, schedules: { day_of_week: number; is_active: boolean }[]): boolean {
  return schedules.some((s) => s.day_of_week === dayOfWeek && s.is_active)
}
