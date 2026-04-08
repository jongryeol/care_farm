import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/reservations/lookup
// 예약번호 + 전화번호로 예약 조회 (전화번호 인증 완료 확인 포함)
export async function POST(request: NextRequest) {
  try {
    const { no, phone } = await request.json()

    if (!no || !phone) {
      return NextResponse.json({ error: '예약번호와 전화번호를 입력해 주세요.' }, { status: 400 })
    }

    const digits = (phone as string).replace(/-/g, '')

    const supabase = await createAdminClient()

    // 예약 조회
    const { data: reservation } = await supabase
      .from('reservations')
      .select(`
        id, reservation_no, reservation_date, head_count, status,
        start_time, end_time, request_memo, applicant_name, applicant_phone,
        reject_reason,
        farms:farm_id (id, name, address, phone),
        farm_schedules:schedule_id (start_time, end_time)
      `)
      .eq('reservation_no', no)
      .maybeSingle()

    if (!reservation) {
      return NextResponse.json({ error: '예약 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 전화번호 일치 확인 (본인 예약인지 검증)
    if (reservation.applicant_phone !== digits) {
      return NextResponse.json({ error: '예약자 전화번호가 일치하지 않습니다.' }, { status: 403 })
    }

    return NextResponse.json({ reservation })
  } catch (err) {
    console.error('reservation lookup error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
