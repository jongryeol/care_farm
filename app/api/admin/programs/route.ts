import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/admin/programs — 프로그램 + farm_program 신규 생성 (super_admin 전용)
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: '슈퍼 관리자만 프로그램을 추가할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json()
  const { farmId, title, description, target_audience, process_description, duration_minutes, notice, confirmation_sms } = body

  if (!farmId) return NextResponse.json({ error: 'farmId가 필요합니다.' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: '프로그램명이 필요합니다.' }, { status: 400 })

  const supabase = await createAdminClient()

  // 1. programs 테이블에 신규 프로그램 생성
  const { data: program, error: programError } = await supabase
    .from('programs')
    .insert({
      title: title.trim(),
      description: description ?? null,
      target_audience: target_audience ?? null,
      process_description: process_description ?? null,
      duration_minutes: duration_minutes ?? null,
      notice: notice ?? null,
      confirmation_sms: confirmation_sms ?? null,
      is_active: true,
    })
    .select()
    .single()

  if (programError || !program) {
    console.error('program insert error:', programError)
    return NextResponse.json({ error: '프로그램 생성에 실패했습니다.' }, { status: 500 })
  }

  // 2. farm_programs 연결 생성
  const { data: farmProgram, error: fpError } = await supabase
    .from('farm_programs')
    .insert({ farm_id: farmId, program_id: program.id, is_active: true })
    .select()
    .single()

  if (fpError || !farmProgram) {
    console.error('farm_program insert error:', fpError)
    // 프로그램은 이미 생성됐으므로 롤백
    await supabase.from('programs').delete().eq('id', program.id)
    return NextResponse.json({ error: '농장-프로그램 연결에 실패했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ program, farmProgramId: farmProgram.id }, { status: 201 })
}
