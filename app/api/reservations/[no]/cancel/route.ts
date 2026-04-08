import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // 예약 조회
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, reservation_date, status, applicant_phone, farms:farm_id (id)')
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

    // 7일 이내 예약 취소 불가
    const reservationDate = new Date(reservation.reservation_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((reservationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 7) {
      return NextResponse.json({ error: '예약일 7일 이내의 예약은 농장으로 직접 연락해 주세요.' }, { status: 400 })
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

    const farm = reservation.farms as { id: string } | null

    return NextResponse.json({ success: true, farmId: farm?.id })
  } catch (err) {
    console.error('reservation cancel error:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
