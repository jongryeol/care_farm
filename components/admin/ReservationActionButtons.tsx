'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

interface Props {
  reservationId: string
}

export default function ReservationActionButtons({ reservationId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'confirm' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleAction = async (action: 'confirm' | 'reject') => {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectReason: action === 'reject' ? rejectReason : undefined,
        }),
      })

      if (res.ok) {
        router.refresh()
        setShowRejectForm(false)
      } else {
        const data = await res.json()
        alert(data.error || '처리 중 오류가 발생했습니다.')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      {!showRejectForm ? (
        <div className="flex gap-1.5">
          <button
            onClick={() => handleAction('confirm')}
            disabled={loading !== null}
            className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {loading === 'confirm' ? '처리중' : '확정'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading !== null}
            className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            <XCircle className="w-3.5 h-3.5" />
            거절
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="거절 사유 (선택)"
            className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-300"
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => handleAction('reject')}
              disabled={loading !== null}
              className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 font-medium"
            >
              {loading === 'reject' ? '처리중' : '거절 확인'}
            </button>
            <button
              onClick={() => { setShowRejectForm(false); setRejectReason('') }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
