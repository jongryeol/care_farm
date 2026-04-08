import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

type ProgramUpdate = Database['public']['Tables']['programs']['Update']

// PATCH /api/admin/programs/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const supabase = await createAdminClient()

  // 농장관리자는 본인 농장에 연결된 프로그램만 수정 가능
  if (session.role === 'farm_admin') {
    const { data: fp } = await supabase
      .from('farm_programs')
      .select('id')
      .eq('program_id', id)
      .eq('farm_id', session.farmId ?? '')
      .maybeSingle()
    if (!fp) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const body = await request.json()
  const { title, description, target_audience, process_description, duration_minutes, notice } = body

  const updates: ProgramUpdate = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (target_audience !== undefined) updates.target_audience = target_audience
  if (process_description !== undefined) updates.process_description = process_description
  if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes
  if (notice !== undefined) updates.notice = notice
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('programs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('program patch error:', error)
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ program: data })
}
