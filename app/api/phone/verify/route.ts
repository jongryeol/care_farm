import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json()

    const digits = (phone as string)?.replace(/-/g, '')
    if (!digits || !code) {
      return NextResponse.json({ error: '전화번호와 인증번호를 입력해 주세요.' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data } = await supabase
      .from('phone_verifications')
      .select('id, expires_at, verified_at')
      .eq('phone', digits)
      .eq('code', String(code))
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ error: '인증번호가 올바르지 않습니다.' }, { status: 400 })
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: '인증번호가 만료되었습니다. 다시 발송해 주세요.' }, { status: 400 })
    }

    await supabase
      .from('phone_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', data.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('phone verify error:', err)
    return NextResponse.json({ error: '인증 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
