import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts'
import { encodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function makeNaverSensSignature(
  method: string,
  url: string,
  timestamp: string,
  accessKey: string,
  secretKey: string
): Promise<string> {
  const message = `${method} ${url}\n${timestamp}\n${accessKey}`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secretKey)
  const msgData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  return encodeBase64(new Uint8Array(signature))
}

async function sendNaverSms(to: string, content: string) {
  const accessKey = Deno.env.get('NAVER_SENS_ACCESS_KEY')!
  const secretKey = Deno.env.get('NAVER_SENS_SECRET_KEY')!
  const serviceId = Deno.env.get('NAVER_SENS_SERVICE_ID')!
  const from = Deno.env.get('NAVER_SENS_SENDER_PHONE')!

  const timestamp = Date.now().toString()
  const urlPath = `/sms/v2/services/${serviceId}/messages`
  const signature = await makeNaverSensSignature('POST', urlPath, timestamp, accessKey, secretKey)

  const body = {
    type: 'SMS',
    from,
    content,
    messages: [{ to: to.replace(/-/g, '') }],
  }

  const response = await fetch(`https://sens.apigw.ntruss.com${urlPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'x-ncp-apigw-timestamp': timestamp,
      'x-ncp-iam-access-key': accessKey,
      'x-ncp-apigw-signature-v2': signature,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SENS API error: ${response.status} ${text}`)
  }

  return await response.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { type, reservationId, rejectReason, phone, code } = await req.json()

    // 전화번호 인증 발송
    if (type === 'phone_verification') {
      if (!phone || !code) {
        return new Response(JSON.stringify({ error: 'phone, code 필요' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      await sendNaverSms(phone, `[치유농장] 인증번호 [${code}]를 입력해 주세요. (5분 이내)`)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 예약 확정/거절 알림
    if (!reservationId) {
      return new Response(JSON.stringify({ error: 'reservationId 필요' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: reservation } = await supabase
      .from('reservations')
      .select('*, farms(name)')
      .eq('id', reservationId)
      .single()

    if (!reservation) {
      return new Response(JSON.stringify({ error: '예약을 찾을 수 없습니다.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const farm = reservation.farms as { name: string }
    const date = reservation.reservation_date
    const startTime = reservation.start_time?.slice(0, 5)
    const phone = reservation.applicant_phone

    let message = ''
    if (type === 'reservation_confirmed') {
      message = `[치유농장] ${reservation.applicant_name}님의 예약이 확정되었습니다.\n` +
        `농장: ${farm.name}\n날짜: ${date} ${startTime}\n인원: ${reservation.head_count}명\n` +
        `예약번호: ${reservation.reservation_no}`
    } else if (type === 'reservation_rejected') {
      message = `[치유농장] ${reservation.applicant_name}님의 예약 신청이 거절되었습니다.\n` +
        `농장: ${farm.name}\n날짜: ${date} ${startTime}\n` +
        (rejectReason ? `사유: ${rejectReason}\n` : '') +
        `문의: 농장으로 직접 연락해 주세요.`
    } else {
      return new Response(JSON.stringify({ error: '알 수 없는 type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    await sendNaverSms(phone, message)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-sms error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
