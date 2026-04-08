import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()

    if (!phone) {
      return new Response(JSON.stringify({ error: '전화번호가 필요합니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const phoneDigits = phone.replace(/-/g, '')
    if (!/^01[0-9]\d{7,8}$/.test(phoneDigits)) {
      return new Response(JSON.stringify({ error: '전화번호 형식이 올바르지 않습니다.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const code = generateCode()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5분

    // 기존 인증 기록 만료 처리 (선택적)
    await supabase
      .from('phone_verifications')
      .insert({ phone: phoneDigits, code, expires_at: expiresAt })

    // SMS 발송
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ type: 'phone_verification', phone: phoneDigits, code }),
    })

    return new Response(JSON.stringify({ success: true, message: '인증번호가 발송되었습니다.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-verification error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
