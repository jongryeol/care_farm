import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendSms, msgPending, msgAdminNewReservation } from '@/lib/sms'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      farmId,
      scheduleId,
      reservationDate,
      headCount,
      applicantName,
      applicantPhone,
      requestMemo,
    } = body

    // 필수 필드 검증
    if (!farmId || !scheduleId || !reservationDate || !headCount || !applicantName || !applicantPhone) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
    }

    // 인원 수 검증
    if (headCount < 1 || headCount > 50) {
      return NextResponse.json({ error: '신청 인원이 올바르지 않습니다.' }, { status: 400 })
    }

    // 이름 검증
    if (applicantName.trim().length < 2) {
      return NextResponse.json({ error: '이름이 올바르지 않습니다.' }, { status: 400 })
    }

    // 전화번호 형식 검증 (한국 휴대폰)
    const phoneDigits = applicantPhone.replace(/-/g, '')
    if (!/^01[0-9]\d{7,8}$/.test(phoneDigits)) {
      return NextResponse.json({ error: '전화번호 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    // service_role 클라이언트 사용 (RLS 우회 — 서버 사이드 전용)
    const supabase = await createAdminClient()

    // 스케줄 조회 (farm_programs를 통해 농장 소유 확인)
    const { data: schedule } = await supabase
      .from('farm_schedules')
      .select('id, farm_program_id, day_of_week, start_time, end_time, max_capacity, recommended_capacity, available_months, is_active, farm_programs(farm_id)')
      .eq('id', scheduleId)
      .eq('is_active', true)
      .maybeSingle()

    if (!schedule || (schedule.farm_programs as { farm_id: string } | null)?.farm_id !== farmId) {
      return NextResponse.json({ error: '해당 회차를 찾을 수 없습니다.' }, { status: 400 })
    }

    // 예약 날짜의 요일 및 월 확인
    const date = new Date(reservationDate + 'T00:00:00')
    const dayOfWeek = date.getDay()
    const month = date.getMonth() + 1

    if (dayOfWeek !== schedule.day_of_week) {
      return NextResponse.json({ error: '선택한 날짜는 해당 회차의 운영 요일이 아닙니다.' }, { status: 400 })
    }
    if (!(schedule.available_months as number[]).includes(month)) {
      return NextResponse.json({ error: '선택한 날짜는 해당 회차의 운영 월이 아닙니다.' }, { status: 400 })
    }

    // 예약 날짜가 오늘 이후인지 확인
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) {
      return NextResponse.json({ error: '과거 날짜는 예약할 수 없습니다.' }, { status: 400 })
    }

    // 차단된 날짜 확인 (특정 회차 차단 OR 프로그램 전체 차단)
    const { data: blocked } = await supabase
      .from('farm_blocked_dates')
      .select('id')
      .eq('blocked_date', reservationDate)
      .or(`farm_schedule_id.eq.${scheduleId},farm_program_id.eq.${schedule.farm_program_id}`)
      .limit(1)

    if (blocked && blocked.length > 0) {
      return NextResponse.json({ error: '해당 날짜는 예약이 차단되어 있습니다. 농장으로 직접 문의해 주세요.' }, { status: 400 })
    }

    // 현재 예약 현황 조회 (정원 초과 여부)
    const { data: existing } = await supabase
      .from('reservations')
      .select('head_count, status')
      .eq('schedule_id', scheduleId)
      .eq('reservation_date', reservationDate)
      .in('status', ['pending', 'confirmed'])

    const currentTotal = (existing ?? []).reduce(
      (sum: number, r: { head_count: number }) => sum + r.head_count,
      0
    )

    if (currentTotal + headCount > schedule.max_capacity) {
      return NextResponse.json(
        {
          error: `신청 인원이 최대 정원(${schedule.max_capacity}명)을 초과합니다. 현재 잔여: ${schedule.max_capacity - currentTotal}명`,
        },
        { status: 400 }
      )
    }

    // 예약 생성
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
        request_memo: requestMemo?.trim() || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('reservation insert error:', error)
      return NextResponse.json({ error: '예약 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 예약 로그 생성
    await supabase.from('reservation_logs').insert({
      reservation_id: reservation.id,
      action: 'created',
      actor_type: 'user',
    })

    // 농장명 조회
    const { data: farm } = await supabase
      .from('farms')
      .select('name, address, main_phone, phone')
      .eq('id', farmId)
      .maybeSingle()

    // 신청 완료 문자 발송 (실패해도 예약은 정상 처리)
    try {
      const msg = msgPending({
        reservationNo: reservation.reservation_no,
        applicantName: applicantName.trim(),
        headCount,
        farmName: farm?.name ?? '',
        farmPhone: farm?.main_phone,
        farmAddress: farm?.address,
        reservationDate,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
      })
      await sendSms(phoneDigits, msg)
    } catch (smsErr) {
      console.error('reservation sms error:', smsErr)
    }

    // 농장 대표 전화로 새 예약 알림 문자 발송
    try {
      if (farm?.phone) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
        const confirmUrl = `${siteUrl}/admin/reservations?no=${reservation.reservation_no}`
        const adminMsg = msgAdminNewReservation({
          reservationNo: reservation.reservation_no,
          applicantName: applicantName.trim(),
          applicantPhone: phoneDigits,
          headCount,
          farmName: farm.name ?? '',
          reservationDate,
          startTime: schedule.start_time,
          endTime: schedule.end_time,
          confirmUrl,
        })
        await sendSms(farm.phone, adminMsg)
      }
    } catch (smsErr) {
      console.error('admin notification sms error:', smsErr)
    }

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (err) {
    console.error('reservation api error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
