import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

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

  const { is_active } = await request.json()
  const { error } = await supabase
    .from('farm_programs')
    .update({ is_active })
    .eq('id', farmProgramId)

  if (error) {
    console.error('farm_program patch error:', error)
    return NextResponse.json({ error: '변경에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
