'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Props {
  reservationId: string
}

function RejectDialog({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (reason: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 다이얼로그 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-1">예약 거절</h2>
        <p className="text-sm text-gray-500 mb-5">거절 사유를 입력해 주세요. 신청자에게 문자로 발송됩니다.</p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="예) 해당 날짜 정원 초과로 인해 예약이 어렵습니다."
          rows={4}
          autoFocus
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300 transition"
        />
        <p className="text-xs text-gray-400 mt-1.5 mb-5">사유를 입력하지 않아도 거절 처리됩니다.</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            거절 확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function ReservationActionButtons({ reservationId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  const handleAction = async (action: 'confirm' | 'reject', rejectReason?: string) => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason }),
      })

      if (res.ok) {
        router.refresh()
        setShowDialog(false)
      } else {
        const data = await res.json()
        alert(data.error || '처리 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <div className="flex gap-1.5">
        <button
          onClick={() => handleAction('confirm')}
          disabled={loading !== null}
          className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {loading === 'confirm' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
          {loading === 'confirm' ? '처리중' : '확정'}
        </button>
        <button
          onClick={() => setShowDialog(true)}
          disabled={loading !== null}
          className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          <XCircle className="w-3.5 h-3.5" />
          거절
        </button>
      </div>

      {showDialog && (
        <RejectDialog
          loading={loading === 'reject'}
          onConfirm={(reason) => handleAction('reject', reason)}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  )
}
