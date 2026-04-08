import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

// DELETE /api/admin/blocked-dates/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const supabase = await createAdminClient()

  // 농장관리자 권한 확인
  if (session.role === 'farm_admin') {
    const { data: row } = await supabase
      .from('farm_blocked_dates')
      .select('farm_program_id, farm_programs(farm_id)')
      .eq('id', id)
      .maybeSingle()
    const farmId = (row?.farm_programs as { farm_id: string } | null)?.farm_id
    if (!farmId || farmId !== session.farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  const { error } = await supabase.from('farm_blocked_dates').delete().eq('id', id)
  if (error) {
    console.error('blocked date delete error:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
