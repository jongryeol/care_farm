import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'
import type { Reservation } from '@/lib/types'

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

  if (!['confirm', 'reject'].includes(action)) {
    return NextResponse.json({ error: '올바르지 않은 action입니다.' }, { status: 400 })
  }

  // 예약 조회
  const { data: reservationData } = await supabase
    .from('reservations')
    .select('id, farm_id, status, applicant_phone, applicant_name, reservation_date, start_time, head_count, reservation_no')
    .eq('id', id)
    .maybeSingle()

  if (!reservationData) {
    return NextResponse.json({ error: '예약을 찾을 수 없습니다.' }, { status: 404 })
  }
  const reservation = reservationData as unknown as Pick<
    Reservation,
    'id' | 'farm_id' | 'status' | 'applicant_phone' | 'applicant_name' | 'reservation_date' | 'start_time' | 'head_count' | 'reservation_no'
  >

  // 농장관리자는 본인 농장만 처리 가능
  if (adminProfile.role === 'farm_admin' && reservation.farm_id !== adminProfile.farm_id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // pending 상태인지 확인
  if (reservation.status !== 'pending') {
    return NextResponse.json({ error: '신청 상태인 예약만 처리할 수 있습니다.' }, { status: 400 })
  }

  const newStatus = action === 'confirm' ? 'confirmed' : 'rejected'
  const now = new Date().toISOString()

  const updatePayload =
    action === 'confirm'
      ? { status: newStatus as Reservation['status'], confirmed_at: now }
      : { status: newStatus as Reservation['status'], rejected_at: now, reject_reason: rejectReason ?? null }

  const { error: updateError } = await supabase
    .from('reservations')
    .update(updatePayload)
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // 로그 기록
  const logAction = action === 'confirm' ? 'confirmed' : 'rejected'
  await supabase.from('reservation_logs').insert({
    reservation_id: id,
    action: logAction as 'confirmed' | 'rejected',
    actor_type: 'admin' as const,
    actor_id: session.adminId,
    memo: rejectReason ?? null,
  })

  // SMS 발송 (Edge Function 호출)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: action === 'confirm' ? 'reservation_confirmed' : 'reservation_rejected',
          reservationId: id,
          rejectReason,
        }),
      })
    }
  } catch (smsErr) {
    console.error('SMS send failed:', smsErr)
  }

  return NextResponse.json({ success: true, status: newStatus })
}
