import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/blocked-dates?farmProgramId=xxx
export async function GET(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const farmProgramId = searchParams.get('farmProgramId')

  const supabase = await createAdminClient()
  let query = supabase
    .from('farm_blocked_dates')
    .select(`
      id, farm_schedule_id, farm_program_id, blocked_date, reason, created_at,
      farm_schedules(day_of_week, start_time, end_time)
    `)
    .order('blocked_date', { ascending: false })

  if (farmProgramId) {
    query = query.eq('farm_program_id', farmProgramId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 })
  return NextResponse.json({ blocked: data })
}

// POST /api/admin/blocked-dates — 예약 차단 추가
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const body = await request.json()
  const { farm_program_id, farm_schedule_id, blocked_date, reason } = body

  if (!farm_program_id || !blocked_date) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // 농장관리자 권한 확인
  if (session.role === 'farm_admin') {
    const { data: fp } = await supabase
      .from('farm_programs')
      .select('farm_id')
      .eq('id', farm_program_id)
      .maybeSingle()
    if (!fp || fp.farm_id !== session.farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('farm_blocked_dates')
    .insert({
      farm_program_id,
      farm_schedule_id: farm_schedule_id || null,
      blocked_date,
      reason: reason || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: '이미 차단된 날짜/회차입니다.' }, { status: 409 })
    }
    console.error('blocked date create error:', error)
    return NextResponse.json({ error: '추가에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ blocked: data }, { status: 201 })
}
