import crypto from 'crypto'

function makeSignature(method: string, urlPath: string, timestamp: string): string {
  const accessKey = process.env.NAVER_SENS_ACCESS_KEY!
  const secretKey = process.env.NAVER_SENS_SECRET_KEY!
  const message = `${method} ${urlPath}\n${timestamp}\n${accessKey}`
  return crypto.createHmac('sha256', secretKey).update(message).digest('base64')
}

export async function sendSms(to: string, content: string): Promise<void> {
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
