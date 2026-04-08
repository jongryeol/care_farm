'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { DAY_OF_WEEK_LABELS } from '@/lib/types'

interface Farm { id: string; name: string }
interface Program { id: string; title: string }
interface FarmProgram { id: string; programs: Program }
interface Schedule {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
}

interface Props {
  farms: Farm[]
  defaultFarmId?: string  // 농장관리자는 본인 농장 고정
  onClose: () => void
}

export default function AdminReservationCreateModal({ farms, defaultFarmId, onClose }: Props) {
  const router = useRouter()

  const [farmId, setFarmId] = useState(defaultFarmId ?? '')
  const [farmPrograms, setFarmPrograms] = useState<FarmProgram[]>([])
  const [farmProgramId, setFarmProgramId] = useState('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [scheduleId, setScheduleId] = useState('')
  const [reservationDate, setReservationDate] = useState('')
  const [headCount, setHeadCount] = useState(1)
  const [applicantName, setApplicantName] = useState('')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 농장 변경 시 프로그램 목록 로드
  useEffect(() => {
    if (!farmId) { setFarmPrograms([]); setFarmProgramId(''); setSchedules([]); setScheduleId(''); return }
    fetch(`/api/admin/farms/${farmId}/programs`)
      .then((r) => r.json())
      .then((d) => {
        setFarmPrograms(d.farmPrograms ?? [])
        setFarmProgramId('')
        setSchedules([])
        setScheduleId('')
      })
      .catch(() => setFarmPrograms([]))
  }, [farmId])

  // 프로그램 변경 시 스케줄 목록 로드
  useEffect(() => {
    if (!farmProgramId) { setSchedules([]); setScheduleId(''); return }
    fetch(`/api/admin/farm-programs/${farmProgramId}/schedules`)
      .then((r) => r.json())
      .then((d) => {
        setSchedules(d.schedules ?? [])
        setScheduleId('')
      })
      .catch(() => setSchedules([]))
  }, [farmProgramId])

  const selectedSchedule = schedules.find((s) => s.id === scheduleId)

  // 선택된 스케줄의 운영 요일만 허용
  const isDateAllowed = (dateStr: string) => {
    if (!selectedSchedule || !dateStr) return true
    const day = new Date(dateStr + 'T00:00:00').getDay()
    return day === selectedSchedule.day_of_week
  }

  function formatPhone(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!farmId || !scheduleId || !reservationDate || !headCount || !applicantName || !applicantPhone) {
      setError('모든 항목을 입력해 주세요.')
      return
    }
    if (!isDateAllowed(reservationDate)) {
      setError(`선택한 날짜는 운영 요일(${selectedSchedule ? DAY_OF_WEEK_LABELS[selectedSchedule.day_of_week] + '요일' : ''})이 아닙니다.`)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId, scheduleId, reservationDate, headCount, applicantName, applicantPhone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '등록 중 오류가 발생했습니다.'); return }
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">예약 직접 등록</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 농장 선택 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">농장 <span className="text-red-400">*</span></label>
            {defaultFarmId ? (
              <div className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-700">
                {farms.find((f) => f.id === defaultFarmId)?.name ?? '-'}
              </div>
            ) : (
              <select
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="">농장을 선택하세요</option>
                {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
          </div>

          {/* 프로그램 선택 */}
          {farmPrograms.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">프로그램 <span className="text-red-400">*</span></label>
              <select
                value={farmProgramId}
                onChange={(e) => setFarmProgramId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="">프로그램을 선택하세요</option>
                {farmPrograms.map((fp) => <option key={fp.id} value={fp.id}>{fp.programs.title}</option>)}
              </select>
            </div>
          )}

          {/* 회차 선택 */}
          {schedules.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">회차 <span className="text-red-400">*</span></label>
              <select
                value={scheduleId}
                onChange={(e) => { setScheduleId(e.target.value); setReservationDate('') }}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="">회차를 선택하세요</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {DAY_OF_WEEK_LABELS[s.day_of_week]}요일 {s.start_time.slice(0, 5)}~{s.end_time.slice(0, 5)} (최대 {s.max_capacity}명)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 예약 날짜 */}
          {scheduleId && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                예약 날짜 <span className="text-red-400">*</span>
                {selectedSchedule && (
                  <span className="ml-1 text-gray-400 font-normal">
                    ({DAY_OF_WEEK_LABELS[selectedSchedule.day_of_week]}요일만 선택 가능)
                  </span>
                )}
              </label>
              <input
                type="date"
                value={reservationDate}
                onChange={(e) => setReservationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
              />
              {reservationDate && !isDateAllowed(reservationDate) && (
                <p className="text-xs text-red-500 mt-1">
                  운영 요일({selectedSchedule ? DAY_OF_WEEK_LABELS[selectedSchedule.day_of_week] + '요일' : ''})을 선택해 주세요.
                </p>
              )}
            </div>
          )}

          {/* 인원 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">인원 <span className="text-red-400">*</span></label>
            <input
              type="number"
              min={1}
              max={selectedSchedule?.max_capacity ?? 50}
              value={headCount}
              onChange={(e) => setHeadCount(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          {/* 예약자 이름 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">예약자 이름 <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">전화번호 <span className="text-red-400">*</span></label>
            <input
              type="tel"
              value={applicantPhone}
              onChange={(e) => setApplicantPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              등록 확정
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
