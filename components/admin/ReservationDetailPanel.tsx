'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { X, Phone, User, Calendar, Clock, Users, FileText, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '@/lib/types'
import type { ReservationStatus } from '@/lib/types'

interface SlotStats {
  maxCapacity: number
  confirmedHead: number
  pendingHead: number
  otherRows: { applicantName: string; headCount: number; status: string }[]
}

interface DetailData {
  id: string
  reservation_no: string
  applicant_name: string
  applicant_phone: string
  head_count: number
  status: string
  reject_reason: string | null
  request_memo: string | null
  reservation_date: string
  start_time: string
  end_time: string
  created_at: string
  farms: { name: string; address: string } | null
  slot: SlotStats | null
}

interface Props {
  detail: DetailData
}

export default function ReservationDetailPanel({ detail }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  async function handleAction(action: 'confirm' | 'reject') {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/reservations/${detail.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason: action === 'reject' ? rejectReason : undefined }),
      })
      if (res.ok) {
        setShowRejectDialog(false)
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error || '처리 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(null)
    }
  }

  function close() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('no')
    router.push(`/admin/reservations?${params.toString()}`)
  }

  const statusKey = detail.status as ReservationStatus
  const dateLabel = format(new Date(detail.reservation_date + 'T00:00:00'), 'yyyy년 M월 d일 (EEEE)', { locale: ko })
  const timeLabel = `${detail.start_time.slice(0, 5)} ~ ${detail.end_time.slice(0, 5)}`
  const phoneFormatted = detail.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')

  const slot = detail.slot
  const totalUsed = slot ? slot.confirmedHead + slot.pendingHead : 0
  const remaining = slot ? slot.maxCapacity - totalUsed : null
  const usedPct = slot ? Math.min(100, Math.round((totalUsed / slot.maxCapacity) * 100)) : 0

  return (
    <>
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={close} />

      {/* 패널 */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-mono">{detail.reservation_no}</p>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">예약 상세</h2>
          </div>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* 상태 배지 */}
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${RESERVATION_STATUS_COLORS[statusKey]}`}>
              {RESERVATION_STATUS_LABELS[statusKey]}
            </span>
            <span className="text-xs text-gray-400">
              신청 {format(new Date(detail.created_at), 'M월 d일 HH:mm')}
            </span>
          </div>

          {/* 거절 사유 */}
          {detail.reject_reason && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-600 mb-0.5">거절 사유</p>
                <p className="text-sm text-red-700">{detail.reject_reason}</p>
              </div>
            </div>
          )}

          {/* 예약 정보 */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <Row icon={<Calendar className="w-4 h-4" />} label="예약일" value={dateLabel} />
            <Row icon={<Clock className="w-4 h-4" />} label="회차" value={timeLabel} />
            <Row icon={<User className="w-4 h-4" />} label="신청자" value={detail.applicant_name} />
            <Row icon={<Phone className="w-4 h-4" />} label="전화번호" value={phoneFormatted} />
            <Row icon={<Users className="w-4 h-4" />} label="신청 인원" value={`${detail.head_count}명`} />
            {detail.farms && (
              <Row icon={<FileText className="w-4 h-4" />} label="농장" value={detail.farms.name} />
            )}
          </div>

          {/* 요청사항 */}
          {detail.request_memo && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">요청사항</p>
              <p className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
                {detail.request_memo}
              </p>
            </div>
          )}

          {/* 회차 현황 */}
          {slot && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">이 회차의 예약 현황</p>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
                {/* 인원 게이지 */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500">정원 사용률</span>
                    <span className="font-semibold text-gray-800">
                      {totalUsed} / {slot.maxCapacity}명
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        usedPct >= 100 ? 'bg-red-500' : usedPct >= 80 ? 'bg-amber-500' : 'bg-green-600'
                      }`}
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>
                </div>

                {/* 카운트 */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-green-50 rounded-xl py-2">
                    <p className="text-lg font-bold text-green-700">{slot.confirmedHead}</p>
                    <p className="text-xs text-green-600">확정</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl py-2">
                    <p className="text-lg font-bold text-yellow-700">{slot.pendingHead}</p>
                    <p className="text-xs text-yellow-600">신청</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl py-2">
                    <p className={`text-lg font-bold ${remaining === 0 ? 'text-red-600' : 'text-gray-700'}`}>
                      {remaining}
                    </p>
                    <p className="text-xs text-gray-500">잔여</p>
                  </div>
                </div>

                {/* 같은 회차 다른 신청자 */}
                {slot.otherRows.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1.5">같은 회차 신청자</p>
                    <div className="space-y-1">
                      {slot.otherRows.map((r, i) => {
                        const s = r.status as ReservationStatus
                        return (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{r.applicantName}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{r.headCount}명</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RESERVATION_STATUS_COLORS[s]}`}>
                                {RESERVATION_STATUS_LABELS[s]}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 */}
        {detail.status === 'pending' && (
          <div className="border-t border-gray-100 px-6 py-4 space-y-3">
            {showRejectDialog ? (
              <>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="거절 사유 (선택)"
                  rows={3}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 transition"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRejectDialog(false)}
                    disabled={loading !== null}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={loading !== null}
                    className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    거절 확인
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('confirm')}
                  disabled={loading !== null}
                  className="flex-1 py-3.5 rounded-xl bg-green-700 text-white font-semibold text-sm hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading === 'confirm' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  예약 확정
                </button>
                <button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={loading !== null}
                  className="flex-1 py-3.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  거절
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}
