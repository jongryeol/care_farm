import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

type FarmScheduleUpdate = Database['public']['Tables']['farm_schedules']['Update']

// PATCH /api/admin/schedules/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { year, available_months, is_active, max_capacity, recommended_capacity } = body

  const supabase = await createAdminClient()

  // 농장관리자인 경우 본인 농장 스케줄만 수정 가능
  if (session.role === 'farm_admin') {
    const { data: schedule } = await supabase
      .from('farm_schedules')
      .select('farm_program_id, farm_programs(farm_id)')
      .eq('id', id)
      .maybeSingle()
    const farmId = (schedule?.farm_programs as { farm_id: string } | null)?.farm_id
    if (!farmId || farmId !== session.farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  const updates: FarmScheduleUpdate = {}
  if (year !== undefined) updates.year = Number(year)
  if (available_months !== undefined) updates.available_months = available_months
  if (is_active !== undefined) updates.is_active = is_active
  if (max_capacity !== undefined) updates.max_capacity = max_capacity
  if (recommended_capacity !== undefined) updates.recommended_capacity = recommended_capacity

  const { data, error } = await supabase
    .from('farm_schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('schedule patch error:', error)
    return NextResponse.json({ error: '업데이트에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ schedule: data })
}

// DELETE /api/admin/schedules/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const supabase = await createAdminClient()

  if (session.role === 'farm_admin') {
    const { data: schedule } = await supabase
      .from('farm_schedules')
      .select('farm_program_id, farm_programs(farm_id)')
      .eq('id', id)
      .maybeSingle()
    const farmId = (schedule?.farm_programs as { farm_id: string } | null)?.farm_id
    if (!farmId || farmId !== session.farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('farm_schedules').delete().eq('id', id)
  if (error) {
    console.error('schedule delete error:', error)
    return NextResponse.json({ error: `삭제에 실패했습니다. (${error.message})` }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
