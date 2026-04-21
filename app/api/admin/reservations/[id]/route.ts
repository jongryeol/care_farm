import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'
import type { Reservation } from '@/lib/types'
import type { Database } from '@/lib/types/database'

type ReservationUpdate = Database['public']['Tables']['reservations']['Update']
import { sendSms, msgConfirmed, msgRejected, msgCancelled } from '@/lib/sms'

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params

  // 인증 확인
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const adminProfile = {
    id: session.adminId,
    name: session.name,
    role: session.role,
    farm_id: session.farmId,
  }

  const body = await request.json()
  const { action, rejectReason } = body as { action: string; rejectReason?: string }

  if (!['confirm', 'reject', 'cancel'].includes(action)) {
    return NextResponse.json({ error: '올바르지 않은 action입니다.' }, { status: 400 })
  }

  // 예약 조회 (농장명 포함)
  const { data: reservationData } = await supabase
    .from('reservations')
    .select('id, farm_id, status, applicant_phone, applicant_name, reservation_date, start_time, end_time, head_count, reservation_no, farms:farm_id(name, main_phone), farm_schedules:schedule_id(farm_programs(programs(confirmation_sms)))')
    .eq('id', id)
    .maybeSingle()

  if (!reservationData) {
    return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
  }
  const reservation = reservationData as unknown as Pick<
    Reservation,
    'id' | 'farm_id' | 'status' | 'applicant_phone' | 'applicant_name' | 'reservation_date' | 'start_time' | 'end_time' | 'head_count' | 'reservation_no'
  > & {
    farms: { name: string; main_phone: string | null } | null
    farm_schedules: { farm_programs: { programs: { confirmation_sms: string | null } | null } | null } | null
  }

  // 농장관리자는 본인 농장만 처리 가능
  if (adminProfile.role === 'farm_admin' && reservation.farm_id !== adminProfile.farm_id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // 상태 유효성 확인
  if (action === 'cancel' && reservation.status !== 'confirmed') {
    return NextResponse.json({ error: '확정된 예약만 취소할 수 있습니다.' }, { status: 400 })
  }
  if ((action === 'confirm' || action === 'reject') && reservation.status !== 'pending') {
    return NextResponse.json({ error: '신청 상태인 예약만 처리할 수 있습니다.' }, { status: 400 })
  }

  const newStatus = action === 'confirm' ? 'confirmed' : action === 'reject' ? 'rejected' : 'cancelled'
  const now = new Date().toISOString()

  const updatePayload: ReservationUpdate =
    action === 'confirm'
      ? { status: newStatus, confirmed_at: now }
      : action === 'reject'
      ? { status: newStatus, rejected_at: now, reject_reason: rejectReason ?? null }
      : { status: newStatus }

  const { error: updateError } = await supabase
    .from('reservations')
    .update(updatePayload)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 로그 기록
  const logAction = newStatus as 'confirmed' | 'rejected' | 'cancelled'
  await supabase.from('reservation_logs').insert({
    reservation_id: id,
    action: logAction,
    actor_type: 'admin' as const,
    actor_id: session.adminId,
    memo: action === 'reject' ? (rejectReason ?? null) : null,
  })

  // SMS 발송
  try {
    const farmNotice = reservation.farm_schedules?.farm_programs?.programs?.confirmation_sms?.trim() || undefined
    const info = {
      reservationNo: reservation.reservation_no,
      applicantName: reservation.applicant_name,
      headCount: reservation.head_count,
      farmName: reservation.farms?.name ?? '',
      farmPhone: reservation.farms?.main_phone,
      reservationDate: reservation.reservation_date,
      startTime: reservation.start_time,
      endTime: reservation.end_time,
      farmNotice,
    }
    const msg =
      action === 'confirm'
        ? msgConfirmed(info)
        : action === 'reject'
        ? msgRejected({ reservationNo: info.reservationNo, farmName: info.farmName, farmPhone: info.farmPhone, reason: rejectReason })
        : msgCancelled(info)
    await sendSms(reservation.applicant_phone, msg)
  } catch (smsErr) {
    console.error('SMS send failed:', smsErr)
  }

  return NextResponse.json({ success: true, status: newStatus })
}
