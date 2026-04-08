import { createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function makeSignature(method: string, urlPath: string, timestamp: string): string {
  const accessKey = process.env.NAVER_SENS_ACCESS_KEY!
  const secretKey = process.env.NAVER_SENS_SECRET_KEY!
  const message = `${method} ${urlPath}\n${timestamp}\n${accessKey}`
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64')
}

async function sendSms(to: string, content: string): Promise<void> {
  const serviceId = process.env.NAVER_SENS_SERVICE_ID!
  const from = process.env.NAVER_SENS_SENDER_PHONE!
  const timestamp = Date.now().toString()
  const urlPath = `/sms/v2/services/${serviceId}/messages`

  const res = await fetch(`https://sens.apigw.ntruss.com${urlPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-iam-access-key': process.env.NAVER_SENS_ACCESS_KEY!,
      'x-ncp-apigw-signature-v2': makeSignature('POST', urlPath, timestamp),
    },
    body: JSON.stringify({
      type: 'SMS',
      from,
      content,
      messages: [{ to }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SENS error: ${res.status} ${text}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    const digits = (phone as string)?.replace(/-/g, '')
    if (!digits || !/^01[0-9]\d{7,8}$/.test(digits)) {
      return NextResponse.json({ error: '전화번호 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    const supabase = await createAdminClient()
    await supabase.from('phone_verifications').insert({ phone: digits, code, expires_at: expiresAt })

    await sendSms(digits, `[치유농장] 인증번호 [${code}]를 입력해 주세요. (5분 이내)`)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('phone send error:', err)
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다.' }, { status: 500 })
  }
}
