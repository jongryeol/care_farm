'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Search, XCircle, Clock, Calendar, Users, AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type ReservationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'

interface ReservationData {
  id: string
  reservation_no: string
  reservation_date: string
  head_count: number
  status: ReservationStatus
  start_time: string
  end_time: string
  request_memo: string | null
  applicant_name: string
  applicant_phone: string
  reject_reason: string | null
  farms: { id: string; name: string; address: string; phone: string | null } | null
  farm_schedules: { start_time: string; end_time: string } | null
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: '예약 신청',
  confirmed: '예약 확정',
  rejected: '예약 거절',
  cancelled: '예약 취소',
  completed: '체험 완료',
}

const STATUS_COLOR: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
}

export default function ReservationLookupForm() {
  const [reservationNo, setReservationNo] = useState('')
  const [phone, setPhone] = useState('')

  const [reservation, setReservation] = useState<ReservationData | null>(null)
  const [lookupError, setLookupError] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)

  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)

  function formatPhone(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  }

  async function handleLookup() {
    setLookupError('')
    setLookupLoading(true)
    try {
      const res = await fetch('/api/reservations/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ no: reservationNo.trim().toUpperCase(), phone }),
      })
      const data = await res.json()
      if (!res.ok) { setLookupError(data.error || '예약 조회에 실패했습니다.'); return }
      setReservation(data.reservation)
    } finally {
      setLookupLoading(false)
    }
  }

  async function handleCancel() {
    setCancelError('')
    setCancelLoading(true)
    try {
      const res = await fetch(`/api/reservations/${reservation!.reservation_no}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCancelError(data.error || '취소 처리에 실패했습니다.')
        setCancelConfirm(false)
        return
      }
      setReservation((prev) => prev ? { ...prev, status: 'cancelled' } : prev)
      setCancelConfirm(false)
      toast.success('예약이 취소되었습니다')
    } finally {
      setCancelLoading(false)
    }
  }

  function isWithin7Days(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 7
  }

  const canSearch = reservationNo.trim().length > 0 && phone.replace(/\D/g, '').length >= 10

  // ── 예약 상세 뷰 ──────────────────────────────────────
  if (reservation) {
    const farm = reservation.farms
    const schedule = reservation.farm_schedules
    const isModifiable = ['pending', 'confirmed'].includes(reservation.status)
    const within7Days = isWithin7Days(reservation.reservation_date)
    const canCancel = isModifiable && !within7Days

    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <button
          onClick={() => { setReservation(null); setCancelConfirm(false); setCancelError('') }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          다시 조회하기
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">예약 확인</h1>
        <p className="text-sm text-gray-500 mb-6">
          예약번호 <span className="font-mono font-semibold text-green-700">{reservation.reservation_no}</span>
        </p>

        {/* 예약 상세 카드 */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-50 mb-5">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">상태</div>
              <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLOR[reservation.status]}`}>
                {STATUS_LABEL[reservation.status]}
              </span>
            </div>
            {reservation.status === 'rejected' && reservation.reject_reason && (
              <div className="text-xs text-red-500 text-right max-w-[60%]">
                거절 사유: {reservation.reject_reason}
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <div className="text-xs text-gray-400 mb-0.5">농장</div>
            <div className="font-semibold text-gray-900">{farm?.name}</div>
            {farm?.address && <div className="text-xs text-gray-500 mt-0.5">{farm.address}</div>}
            {farm?.phone && <div className="text-xs text-gray-400 mt-0.5">농장 연락처: {farm.phone}</div>}
          </div>

          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                <Calendar className="w-3.5 h-3.5" />날짜
              </div>
              <div className="font-medium text-gray-800 text-sm">
                {format(new Date(reservation.reservation_date + 'T00:00:00'), 'yyyy년 M월 d일 (E)', { locale: ko })}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
                <Clock className="w-3.5 h-3.5" />회차
              </div>
              <div className="font-medium text-gray-800 text-sm">
                {(schedule?.start_time ?? reservation.start_time).slice(0, 5)} ~{' '}
                {(schedule?.end_time ?? reservation.end_time).slice(0, 5)}
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
              <Users className="w-3.5 h-3.5" />신청 인원
            </div>
            <div className="font-medium text-gray-800 text-sm">{reservation.head_count}명</div>
          </div>

          <div className="px-6 py-4">
            <div className="text-xs text-gray-400 mb-0.5">신청자</div>
            <div className="font-medium text-gray-800 text-sm">{reservation.applicant_name}</div>
          </div>

          {reservation.request_memo && (
            <div className="px-6 py-4">
              <div className="text-xs text-gray-400 mb-0.5">요청사항</div>
              <div className="text-sm text-gray-700">{reservation.request_memo}</div>
            </div>
          )}
        </div>

        {/* 7일 이내 안내 */}
        {isModifiable && within7Days && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong className="block mb-0.5">직접 연락이 필요합니다</strong>
              예약일 7일 이내의 예약건은 농장으로 직접 연락해 주세요.
              {farm?.phone && (
                <a href={`tel:${farm.phone}`} className="block mt-1 font-semibold text-amber-700 hover:underline">
                  {farm.phone}
                </a>
              )}
            </div>
          </div>
        )}

        {cancelError && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{cancelError}</div>
        )}

        {cancelConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-4">
            <p className="text-sm font-semibold text-red-800 mb-1">예약을 취소하시겠습니까?</p>
            <p className="text-xs text-red-600 mb-4">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                돌아가기
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                취소 확인
              </button>
            </div>
          </div>
        )}

        {canCancel && !cancelConfirm && (
          <div className="mb-4">
            <button
              onClick={() => { setCancelConfirm(true); setCancelError('') }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-300 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              예약 취소
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              ※ 예약 변경을 원하시면 취소 후 재예약 해주세요.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/farms" className="flex-1 text-center py-3 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
            농장 둘러보기
          </Link>
          <Link href="/" className="flex-1 text-center py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200">
            메인으로
          </Link>
        </div>
      </div>
    )
  }

  // ── 조회 폼 ──────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">예약 확인</h1>
      <p className="text-sm text-gray-500 mb-8">예약번호와 예약 시 사용한 전화번호를 입력해 주세요.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">예약번호</label>
          <input
            type="text"
            value={reservationNo}
            onChange={(e) => setReservationNo(e.target.value.toUpperCase())}
            placeholder="CF202504010001"
            onKeyDown={(e) => { if (e.key === 'Enter' && canSearch) handleLookup() }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">전화번호</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-0000-0000"
            onKeyDown={(e) => { if (e.key === 'Enter' && canSearch) handleLookup() }}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {lookupError && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{lookupError}</div>
        )}

        <button
          onClick={handleLookup}
          disabled={!canSearch || lookupLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-700 text-white font-semibold disabled:opacity-40 hover:bg-green-800 transition-colors"
        >
          {lookupLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          예약 조회하기
        </button>
      </div>
    </div>
  )
}
