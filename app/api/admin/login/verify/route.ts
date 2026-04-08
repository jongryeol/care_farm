import { createAdminClient } from '@/lib/supabase/server'
import { createSessionToken, sessionCookieOptions } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()
    const digits = (phone as string)?.replace(/-/g, '')

    if (!digits || !code) {
      return NextResponse.json({ error: '전화번호와 인증번호를 입력해 주세요.' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // OTP 검증
    const { data: verification } = await supabase
      .from('phone_verifications')
      .select('id, expires_at')
      .eq('phone', digits)
      .eq('code', String(code))
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!verification) {
      return NextResponse.json({ error: '인증번호가 올바르지 않습니다.' }, { status: 400 })
    }

    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json({ error: '인증번호가 만료되었습니다. 다시 발송해 주세요.' }, { status: 400 })
    }

    // 인증 완료 처리
    await supabase
      .from('phone_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)

    // 관리자 정보 조회
    const { data: admin } = await supabase
      .from('admin_profiles')
      .select('id, name, role, farm_id')
      .eq('phone', digits)
      .maybeSingle()

    if (!admin) {
      return NextResponse.json({ error: '관리자 정보를 찾을 수 없습니다.' }, { status: 403 })
    }

    // 세션 쿠키 발급
    const token = createSessionToken({
      adminId: admin.id,
      name: admin.name,
      role: admin.role as 'super_admin' | 'farm_admin',
      farmId: admin.farm_id,
    })

    const response = NextResponse.json({ success: true })
    response.cookies.set(sessionCookieOptions(token))
    return response
  } catch (err) {
    console.error('admin login verify error:', err)
    return NextResponse.json({ error: '인증 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
