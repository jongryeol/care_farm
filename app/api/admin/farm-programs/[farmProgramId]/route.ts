import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

type FarmProgramUpdate = Database['public']['Tables']['farm_programs']['Update']

interface Params { params: Promise<{ farmProgramId: string }> }

// PATCH /api/admin/farm-programs/[farmProgramId] — is_active 토글
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { farmProgramId } = await params
  const supabase = await createAdminClient()

  if (session.role === 'farm_admin') {
    const { data: fp } = await supabase
      .from('farm_programs')
      .select('farm_id')
      .eq('id', farmProgramId)
      .maybeSingle()
    if (!fp || fp.farm_id !== session.farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  const body = await request.json()
  const updates: FarmProgramUpdate = {}
  if (body.is_active !== undefined) updates.is_active = body.is_active
  if (body.min_advance_days !== undefined) updates.min_advance_days = Number(body.min_advance_days)

  const { error } = await supabase
    .from('farm_programs')
    .update(updates)
    .eq('id', farmProgramId)

  if (error) {
    console.error('farm_program patch error:', error)
    return NextResponse.json({ error: '변경에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/farm-programs/[farmProgramId] — 프로그램 삭제 (super_admin 전용)
export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  if (session.role !== 'super_admin') return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { farmProgramId } = await params
  const supabase = await createAdminClient()

  // 해당 farm_program에 속한 스케줄 ID 조회
  const { data: schedules } = await supabase
    .from('farm_schedules')
    .select('id')
    .eq('farm_program_id', farmProgramId)

  const scheduleIds = (schedules ?? []).map((s) => s.id)

  // 진행 중인 예약(pending/confirmed) 존재 여부 확인
  if (scheduleIds.length > 0) {
    const { count } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .in('schedule_id', scheduleIds)
      .in('status', ['pending', 'confirmed'])

    if (count && count > 0) {
      return NextResponse.json(
        { error: `진행 중인 예약이 ${count}건 있어 삭제할 수 없습니다. 먼저 예약을 처리해 주세요.` },
        { status: 409 }
      )
    }
  }

  // farm_programs의 program_id 조회 (나중에 programs 삭제 여부 판단용)
  const { data: fp } = await supabase
    .from('farm_programs')
    .select('program_id')
    .eq('id', farmProgramId)
    .maybeSingle()

  if (!fp) return NextResponse.json({ error: '프로그램을 찾을 수 없습니다.' }, { status: 404 })

  const programId = fp.program_id

  // 연관 데이터 순서대로 삭제
  if (scheduleIds.length > 0) {
    await supabase.from('farm_blocked_dates').delete().in('farm_schedule_id', scheduleIds)
    await supabase.from('farm_schedules').delete().eq('farm_program_id', farmProgramId)
  }
  await supabase.from('farm_blocked_dates').delete().eq('farm_program_id', farmProgramId)
  await supabase.from('farm_programs').delete().eq('id', farmProgramId)

  // 해당 program을 참조하는 다른 farm_programs가 없으면 program 자체도 삭제
  const { count: remaining } = await supabase
    .from('farm_programs')
    .select('id', { count: 'exact', head: true })
    .eq('program_id', programId)

  if (!remaining || remaining === 0) {
    await supabase.from('programs').delete().eq('id', programId)
  }

  return NextResponse.json({ success: true })
}
