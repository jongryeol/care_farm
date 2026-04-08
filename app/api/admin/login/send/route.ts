import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendSms } from '@/lib/sms'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()
    const digits = (phone as string)?.replace(/-/g, '')

    if (!digits || !/^01[0-9]\d{7,8}$/.test(digits)) {
      return NextResponse.json({ error: '전화번호 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // 등록된 관리자 전화번호인지 확인
    const { data: admin } = await supabase
      .from('admin_profiles')
      .select('id')
      .eq('phone', digits)
      .maybeSingle()

    if (!admin) {
      return NextResponse.json({ error: '등록되지 않은 전화번호입니다.' }, { status: 403 })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    await supabase
      .from('phone_verifications')
      .insert({ phone: digits, code, expires_at: expiresAt })

    await sendSms(digits, `[치유농장 관리자] 인증번호 [${code}]를 입력해 주세요. (5분 이내)`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('admin login send error:', err)
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다.' }, { status: 500 })
  }
}
