import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'
import { sendSms, msgConfirmed } from '@/lib/sms'

// POST /api/admin/reservations — 관리자 직접 예약 등록
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const body = await request.json()
  const { farmId, scheduleId, reservationDate, headCount, applicantName, applicantPhone } = body

  if (!farmId || !scheduleId || !reservationDate || !headCount || !applicantName || !applicantPhone) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
  }

  const phoneDigits = (applicantPhone as string).replace(/-/g, '')

  // 농장관리자는 본인 농장만 등록 가능
  if (session.role === 'farm_admin' && session.farmId !== farmId) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // 스케줄 조회 (farm_programs를 통해 농장 소유 확인)
  const { data: schedule } = await supabase
    .from('farm_schedules')
    .select('id, day_of_week, start_time, end_time, max_capacity, is_active, farm_programs(farm_id)')
    .eq('id', scheduleId)
    .eq('is_active', true)
    .maybeSingle()

  if (!schedule || (schedule.farm_programs as { farm_id: string } | null)?.farm_id !== farmId) {
    return NextResponse.json({ error: '해당 회차를 찾을 수 없습니다.' }, { status: 400 })
  }

  // 요일 확인
  const date = new Date(reservationDate + 'T00:00:00')
  if (date.getDay() !== schedule.day_of_week) {
    return NextResponse.json({ error: '선택한 날짜는 해당 회차의 운영 요일이 아닙니다.' }, { status: 400 })
  }

  // 정원 초과 확인
  const { data: existing } = await supabase
    .from('reservations')
    .select('head_count')
    .eq('schedule_id', scheduleId)
    .eq('reservation_date', reservationDate)
    .in('status', ['pending', 'confirmed'])

  const currentTotal = (existing ?? []).reduce((sum, r) => sum + r.head_count, 0)
  if (currentTotal + headCount > schedule.max_capacity) {
    return NextResponse.json(
      { error: `최대 정원(${schedule.max_capacity}명)을 초과합니다. 현재 잔여: ${schedule.max_capacity - currentTotal}명` },
      { status: 400 }
    )
  }

  // 예약 생성 (관리자 직접 등록 → 즉시 confirmed)
  const { data: reservation, error } = await supabase
    .from('reservations')
    .insert({
      farm_id: farmId,
      schedule_id: scheduleId,
      reservation_date: reservationDate,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      head_count: headCount,
      applicant_name: applicantName.trim(),
      applicant_phone: phoneDigits,
      phone_verified: true,
      status: 'confirmed',
    })
    .select()
    .single()

  if (error) {
    console.error('admin reservation insert error:', error)
    return NextResponse.json({ error: '예약 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 로그 기록
  await supabase.from('reservation_logs').insert([
    { reservation_id: reservation.id, action: 'created', actor_type: 'admin', actor_id: session.adminId },
    { reservation_id: reservation.id, action: 'confirmed', actor_type: 'admin', actor_id: session.adminId, memo: '관리자 직접 등록' },
  ])

  // 농장명 조회 후 확정 SMS 발송
  try {
    const { data: farm } = await supabase.from('farms').select('name, main_phone').eq('id', farmId).maybeSingle()
    const msg = msgConfirmed({
      reservationNo: reservation.reservation_no,
      applicantName: reservation.applicant_name,
      headCount: reservation.head_count,
      farmName: farm?.name ?? '',
      farmPhone: farm?.main_phone,
      reservationDate: reservation.reservation_date,
      startTime: reservation.start_time,
      endTime: reservation.end_time,
    })
    await sendSms(reservation.applicant_phone, msg)
  } catch (smsErr) {
    console.error('admin reservation sms error:', smsErr)
  }

  return NextResponse.json({ reservation }, { status: 201 })
}
