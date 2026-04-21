import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendSms, msgCancelled } from '@/lib/sms'

// POST /api/reservations/[no]/cancel
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ no: string }> }
) {
  try {
    const { no } = await params
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ error: '전화번호를 입력해 주세요.' }, { status: 400 })
    }

    const digits = (phone as string).replace(/-/g, '')
    const supabase = await createAdminClient()

    // 예약 조회 (SMS에 필요한 필드 포함)
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, reservation_no, reservation_date, start_time, end_time, status, applicant_phone, applicant_name, head_count, farms:farm_id (id, name, main_phone)')
      .eq('reservation_no', no)
      .maybeSingle()

    if (!reservation) {
      return NextResponse.json({ error: '예약 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 본인 확인
    if (reservation.applicant_phone !== digits) {
      return NextResponse.json({ error: '예약자 전화번호가 일치하지 않습니다.' }, { status: 403 })
    }

    // 취소 가능 상태 확인
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      return NextResponse.json({ error: '취소할 수 없는 예약 상태입니다.' }, { status: 400 })
    }

    // 체험일 3일 전 이후 취소 불가
    const reservationDate = new Date(reservation.reservation_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 3) {
      return NextResponse.json({ error: '체험일 3일 전 이후에는 온라인 취소가 불가합니다. 농장으로 직접 연락해 주세요.' }, { status: 400 })
    }

    // 취소 처리
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservation.id)

    if (updateError) {
      console.error('cancel update error:', updateError)
      return NextResponse.json({ error: '취소 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 로그 기록
    await supabase.from('reservation_logs').insert({
      reservation_id: reservation.id,
      action: 'cancelled',
      actor_type: 'user',
    })

    const farm = reservation.farms as { id: string; name: string; main_phone: string | null } | null

    // SMS 발송
    try {
      const msg = msgCancelled({
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
      console.error('cancel sms error:', smsErr)
    }

    return NextResponse.json({ success: true, farmId: farm?.id })
  } catch (err) {
    console.error('reservation cancel error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
