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
      type: 'LMS',
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

// ── 메시지 템플릿 ──────────────────────────────────────────

interface ReservationInfo {
  reservationNo: string
  applicantName: string
  headCount: number
  farmName: string
  farmPhone?: string | null   // main_phone
  reservationDate: string     // 'yyyy-MM-dd'
  startTime: string           // 'HH:mm:ss'
  endTime: string             // 'HH:mm:ss'
}

function dateTimeStr(info: ReservationInfo) {
  const d = info.reservationDate.replace(/-/g, '.')
  const t = `${info.startTime.slice(0, 5)}~${info.endTime.slice(0, 5)}`
  return `${d} ${t}`
}

export function msgPending(info: ReservationInfo & { farmAddress?: string }) {
  return (
    `[치유농장] 예약이 신청되었습니다.\n` +
    `예약번호: ${info.reservationNo}\n` +
    `이름: ${info.applicantName} / ${info.headCount}명\n` +
    `농장: ${info.farmName}\n` +
    (info.farmAddress ? `주소: ${info.farmAddress}\n` : '') +
    `일시: ${dateTimeStr(info)}\n` +
    `관리자 확인 후 예약이 확정됩니다.`
  )
}

export function msgConfirmed(info: ReservationInfo) {
  return (
    `[치유농장] 예약이 확정되었습니다.\n` +
    `예약번호: ${info.reservationNo}\n` +
    `이름: ${info.applicantName} / ${info.headCount}명\n` +
    `농장: ${info.farmName}\n` +
    `일시: ${dateTimeStr(info)}\n` +
    (info.farmPhone ? `농장 문의: ${info.farmPhone}\n` : '') +
    `당일 안전하게 방문해 주세요.`
  )
}

export function msgRejected(info: Pick<ReservationInfo, 'reservationNo' | 'farmName' | 'farmPhone'> & { reason?: string | null }) {
  return (
    `[치유농장] 예약이 거절되었습니다.\n` +
    `예약번호: ${info.reservationNo}\n` +
    `농장: ${info.farmName}\n` +
    (info.reason ? `사유: ${info.reason}\n` : '') +
    (info.farmPhone ? `농장 문의: ${info.farmPhone}` : `문의 사항은 농장으로 연락해 주세요.`)
  )
}

export function msgAdminNewReservation(
  info: ReservationInfo & { applicantPhone: string; confirmUrl: string }
) {
  return (
    `[치유농장] 새 예약 신청이 접수되었습니다.\n` +
    `예약번호: ${info.reservationNo}\n` +
    `날짜: ${info.reservationDate.replace(/-/g, '.')}\n` +
    `회차: ${info.startTime.slice(0, 5)}~${info.endTime.slice(0, 5)}\n` +
    `이름: ${info.applicantName}\n` +
    `전화: ${info.applicantPhone}\n` +
    `인원: ${info.headCount}명\n` +
    `확정: ${info.confirmUrl}`
  )
}

export function msgCancelled(info: ReservationInfo) {
  return (
    `[치유농장] 예약이 취소되었습니다.\n` +
    `예약번호: ${info.reservationNo}\n` +
    `이름: ${info.applicantName}\n` +
    `농장: ${info.farmName}\n` +
    `일시: ${dateTimeStr(info)}\n` +
    (info.farmPhone ? `농장 문의: ${info.farmPhone}` : '')
  )
}
