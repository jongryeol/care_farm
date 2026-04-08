'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, Clock, Users, User, Phone, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import type { FarmSchedule } from '@/lib/types'
import { DAY_OF_WEEK_LABELS } from '@/lib/types'

interface FarmProgramOption {
  id: string
  program_id: string
  is_active: boolean
  programs: { id: string; title: string; description: string | null }
  farm_schedules: FarmSchedule[]
}

interface ReservationFormProps {
  farmId: string
  farmName: string
  farmPrograms: FarmProgramOption[]
}

interface AvailabilityInfo {
  remaining: number
  isAvailable: boolean
  isOverRecommended: boolean
  confirmedCount: number
  pendingCount: number
  maxCapacity: number
}

export default function ReservationForm({ farmId, farmName, farmPrograms }: ReservationFormProps) {
  const router = useRouter()

  // 프로그램 선택 (1개면 자동 선택)
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    farmPrograms.length === 1 ? farmPrograms[0].id : ''
  )
  const selectedProgram = farmPrograms.find((fp) => fp.id === selectedProgramId) ?? null
  const schedules: FarmSchedule[] = selectedProgram?.farm_schedules ?? []

  // 달력 상태
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<FarmSchedule | null>(null)
  const [availability, setAvailability] = useState<AvailabilityInfo | null>(null)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  // 폼 상태
  const [headCount, setHeadCount] = useState(1)
  const [applicantName, setApplicantName] = useState('')
  const [applicantPhone, setApplicantPhone] = useState('')
  const [requestMemo, setRequestMemo] = useState('')
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  // 전화번호 인증 상태
  const [verificationCode, setVerificationCode] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [verificationError, setVerificationError] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  // 전화번호 변경 시 인증 상태 초기화
  const handlePhoneChange = (value: string) => {
    setApplicantPhone(formatPhone(value))
    setPhoneVerified(false)
    setCodeSent(false)
    setVerificationCode('')
    setVerificationError('')
  }

  // 현재 캘린더 월(1~12)
  const currentMonthNum = currentMonth.getMonth() + 1

  // 현재 보고 있는 달에서 활성화된 요일 집합
  const activeDays = new Set(
    schedules
      .filter((s) => s.is_active && s.available_months.includes(currentMonthNum))
      .map((s) => s.day_of_week)
  )

  // 선택된 날짜의 회차 목록 (요일 + 월 모두 확인)
  const availableSchedules = selectedDate
    ? (() => {
        const d = new Date(selectedDate + 'T00:00:00')
        const month = d.getMonth() + 1
        const dow = d.getDay()
        return schedules.filter(
          (s) => s.is_active && s.day_of_week === dow && s.available_months.includes(month)
        )
      })()
    : []

  // 가용 인원 조회
  const fetchAvailability = useCallback(async (scheduleId: string, date: string) => {
    setAvailabilityLoading(true)
    try {
      const res = await fetch(`/api/schedules/availability?scheduleId=${scheduleId}&date=${date}`)
      const data = await res.json()
      setAvailability(data)
    } catch {
      setAvailability(null)
    } finally {
      setAvailabilityLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedSchedule && selectedDate) {
      fetchAvailability(selectedSchedule.id, selectedDate)
    } else {
      setAvailability(null)
    }
  }, [selectedSchedule, selectedDate, fetchAvailability])

  // 달력 날짜 생성
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }

  const isDateSelectable = (date: Date) => {
    const today = startOfDay(new Date())
    if (startOfDay(date) < today) return false
    const month = date.getMonth() + 1
    const dow = date.getDay()
    return schedules.some((s) => s.is_active && s.day_of_week === dow && s.available_months.includes(month))
  }

  const handleDateSelect = (date: Date) => {
    if (!isDateSelectable(date)) return
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setSelectedSchedule(null)
    setAvailability(null)
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`
  }

  // 인증번호 발송
  const handleSendCode = async () => {
    const digits = applicantPhone.replace(/-/g, '')
    if (!/^01[0-9]\d{7,8}$/.test(digits)) {
      setVerificationError('전화번호 형식이 올바르지 않습니다.')
      return
    }
    setSendingCode(true)
    setVerificationError('')
    try {
      const res = await fetch('/api/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVerificationError(data.error || '발송에 실패했습니다.')
        return
      }
      setCodeSent(true)
      setCountdown(180) // 3분
    } catch {
      setVerificationError('네트워크 오류가 발생했습니다.')
    } finally {
      setSendingCode(false)
    }
  }

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setVerificationError('6자리 인증번호를 입력해 주세요.')
      return
    }
    setVerifyingCode(true)
    setVerificationError('')
    try {
      const res = await fetch('/api/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: applicantPhone.replace(/-/g, ''), code: verificationCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setVerificationError(data.error || '인증에 실패했습니다.')
        return
      }
      setPhoneVerified(true)
      setVerificationError('')
    } catch {
      setVerificationError('네트워크 오류가 발생했습니다.')
    } finally {
      setVerifyingCode(false)
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!selectedDate) newErrors.date = '날짜를 선택해 주세요.'
    if (!selectedSchedule) newErrors.schedule = '회차를 선택해 주세요.'
    if (headCount < 1) newErrors.headCount = '인원을 입력해 주세요.'
    if (availability && headCount > availability.remaining)
      newErrors.headCount = `잔여 인원(${availability.remaining}명)을 초과했습니다.`
    if (applicantName.trim().length < 2) newErrors.applicantName = '이름을 올바르게 입력해 주세요.'
    const phoneDigits = applicantPhone.replace(/-/g, '')
    if (!/^01[0-9]\d{7,8}$/.test(phoneDigits)) newErrors.applicantPhone = '전화번호 형식이 올바르지 않습니다.'
    if (!phoneVerified) newErrors.applicantPhone = '전화번호 인증을 완료해 주세요.'
    if (!privacyAgreed) newErrors.privacy = '개인정보 수집에 동의해 주세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId,
          scheduleId: selectedSchedule!.id,
          reservationDate: selectedDate,
          headCount,
          applicantName: applicantName.trim(),
          applicantPhone: applicantPhone.replace(/-/g, ''),
          requestMemo,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ submit: data.error || '예약 처리 중 오류가 발생했습니다.' })
        return
      }
      router.push(`/reservation/complete?no=${data.reservation.reservation_no}`)
    } catch {
      setErrors({ submit: '네트워크 오류가 발생했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  const calendarDays = getCalendarDays()
  const today = startOfDay(new Date())

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 프로그램 선택 (2개 이상일 때만 표시) */}
      {farmPrograms.length > 1 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">체험 프로그램 선택</label>
          <div className="grid grid-cols-1 gap-3">
            {farmPrograms.map((fp) => {
              const isSelected = selectedProgramId === fp.id
              return (
                <button
                  key={fp.id}
                  type="button"
                  onClick={() => {
                    setSelectedProgramId(fp.id)
                    setSelectedDate(null)
                    setSelectedSchedule(null)
                    setAvailability(null)
                  }}
                  className={`px-4 py-3 rounded-xl border text-left transition-all ${
                    isSelected ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{fp.programs.title}</div>
                  {fp.programs.description && (
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{fp.programs.description}</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 날짜 선택 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <Calendar className="inline w-4 h-4 mr-1.5 text-green-600" />
          예약 날짜 선택
        </label>
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
            <button type="button" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="font-semibold text-gray-800">{format(currentMonth, 'yyyy년 M월', { locale: ko })}</span>
            <button type="button" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`text-center py-2 text-xs font-medium ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 p-2 gap-1">
            {calendarDays.map((date, i) => {
              if (!date) return <div key={i} />
              const dateStr = format(date, 'yyyy-MM-dd')
              const selectable = isDateSelectable(date)
              const isSelected = selectedDate === dateStr
              const isPast = startOfDay(date) < today
              const isToday = startOfDay(date).getTime() === today.getTime()
              return (
                <button key={dateStr} type="button" onClick={() => handleDateSelect(date)} disabled={!selectable}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all
                    ${isSelected ? 'bg-green-600 text-white font-bold shadow-sm' : ''}
                    ${!isSelected && selectable ? 'hover:bg-green-50 text-gray-800 cursor-pointer' : ''}
                    ${!selectable ? 'text-gray-200 cursor-not-allowed' : ''}
                    ${isPast && !isToday ? 'text-gray-200 cursor-not-allowed' : ''}
                  `}
                >
                  <span>{date.getDate()}</span>
                  {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-green-500" />}
                  {selectable && !isSelected && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-green-300" />}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-300 inline-block" />예약 가능 요일</span>
          <span>운영: {Array.from(activeDays).sort().map((d) => DAY_OF_WEEK_LABELS[d]).join('·')}요일</span>
        </div>
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
      </div>

      {/* 회차 선택 */}
      {selectedDate && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <Clock className="inline w-4 h-4 mr-1.5 text-green-600" />회차 선택
          </label>
          <div className="grid grid-cols-2 gap-3">
            {availableSchedules.map((schedule) => {
              const isSelected = selectedSchedule?.id === schedule.id
              return (
                <button key={schedule.id} type="button" onClick={() => setSelectedSchedule(schedule)}
                  className={`px-4 py-3 rounded-xl border text-sm text-left transition-all ${isSelected ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 hover:border-green-300'}`}
                >
                  <div className="font-semibold">{schedule.start_time.slice(0, 5)} ~ {schedule.end_time.slice(0, 5)}</div>
                  <div className="text-xs text-gray-400 mt-0.5">최대 {schedule.max_capacity}명</div>
                </button>
              )
            })}
          </div>
          {errors.schedule && <p className="text-red-500 text-xs mt-1">{errors.schedule}</p>}
          {selectedSchedule && (
            <div className="mt-3">
              {availabilityLoading ? (
                <div className="text-xs text-gray-400 animate-pulse">정원 현황 확인 중...</div>
              ) : availability ? (
                <div className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full ${!availability.isAvailable ? 'bg-red-100 text-red-700' : availability.isOverRecommended ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {!availability.isAvailable ? '예약이 마감되었습니다' : `잔여 ${availability.remaining}명 (확정 ${availability.confirmedCount}명 + 신청 ${availability.pendingCount}명)`}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* 인원 선택 */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          <Users className="inline w-4 h-4 mr-1.5 text-green-600" />신청 인원
        </label>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => setHeadCount((n) => Math.max(1, n - 1))} className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-bold transition-colors">−</button>
          <span className="text-2xl font-bold text-gray-900 w-10 text-center">{headCount}</span>
          <button type="button" onClick={() => setHeadCount((n) => Math.min(availability?.remaining ?? 50, n + 1))} className="w-10 h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-lg font-bold transition-colors">+</button>
          <span className="text-sm text-gray-400">명</span>
        </div>
        {errors.headCount && <p className="text-red-500 text-xs mt-1">{errors.headCount}</p>}
      </div>

      {/* 신청자 정보 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">
          <User className="inline w-4 h-4 mr-1.5 text-green-600" />신청자 정보
        </h3>

        {/* 이름 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">이름 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            placeholder="홍길동"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition ${errors.applicantName ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName}</p>}
        </div>

        {/* 전화번호 + 인증 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            <Phone className="inline w-3.5 h-3.5 mr-1" />
            전화번호 <span className="text-red-400">*</span>
          </label>

          {/* 전화번호 입력 + 발송 버튼 */}
          <div className="flex gap-2">
            <input
              type="tel"
              value={applicantPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="010-0000-0000"
              maxLength={13}
              disabled={phoneVerified}
              className={`flex-1 px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition
                ${errors.applicantPhone ? 'border-red-300' : 'border-gray-200'}
                ${phoneVerified ? 'bg-gray-50 text-gray-400' : ''}
              `}
            />
            {!phoneVerified && (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || countdown > 0}
                className="shrink-0 px-4 py-3 rounded-xl bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {sendingCode ? '발송 중...' : countdown > 0 ? `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}` : codeSent ? '재발송' : '인증번호 발송'}
              </button>
            )}
            {phoneVerified && (
              <div className="shrink-0 flex items-center gap-1.5 px-4 text-green-600 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                인증 완료
              </div>
            )}
          </div>

          {/* 인증번호 입력 */}
          {codeSent && !phoneVerified && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="인증번호 6자리"
                maxLength={6}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition tracking-widest text-center font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifyingCode || verificationCode.length !== 6}
                className="shrink-0 px-4 py-3 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {verifyingCode ? '확인 중...' : '확인'}
              </button>
            </div>
          )}

          {verificationError && <p className="text-red-500 text-xs mt-1">{verificationError}</p>}
          {errors.applicantPhone && !verificationError && <p className="text-red-500 text-xs mt-1">{errors.applicantPhone}</p>}
          {codeSent && !phoneVerified && countdown > 0 && (
            <p className="text-xs text-gray-400 mt-1">인증번호가 발송되었습니다. {Math.floor(countdown / 60)}분 {countdown % 60}초 안에 입력해 주세요.</p>
          )}
          {countdown === 0 && codeSent && !phoneVerified && (
            <p className="text-xs text-amber-500 mt-1">인증번호가 만료되었습니다. 재발송 버튼을 눌러 주세요.</p>
          )}
        </div>

        {/* 요청사항 */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">요청사항 (선택)</label>
          <textarea
            value={requestMemo}
            onChange={(e) => setRequestMemo(e.target.value)}
            placeholder="특별한 요청사항이 있으시면 입력해 주세요"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition resize-none"
          />
        </div>
      </div>

      {/* 개인정보 동의 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="text-xs text-gray-500 mb-3 leading-relaxed">
          <strong className="text-gray-700">개인정보 수집·이용 동의</strong>
          <br />수집 항목: 이름, 전화번호 / 수집 목적: 예약 확인 및 안내 / 보유 기간: 예약 완료 후 1년
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} className="w-4 h-4 accent-green-600" />
          <span className="text-sm text-gray-700">개인정보 수집·이용에 동의합니다 <span className="text-red-400">*</span></span>
        </label>
        {errors.privacy && <p className="text-red-500 text-xs mt-1">{errors.privacy}</p>}
      </div>

      {/* 예약 요약 */}
      {selectedDate && selectedSchedule && (
        <div className="bg-green-50 rounded-xl p-4 text-sm space-y-1.5">
          <div className="font-semibold text-green-800 mb-2">예약 내용 확인</div>
          <div className="flex justify-between text-gray-600"><span>농장</span><span className="font-medium text-gray-900">{farmName}</span></div>
          <div className="flex justify-between text-gray-600">
            <span>날짜</span>
            <span className="font-medium text-gray-900">{format(new Date(selectedDate + 'T00:00:00'), 'yyyy년 M월 d일 (E)', { locale: ko })}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>회차</span>
            <span className="font-medium text-gray-900">{selectedSchedule.start_time.slice(0, 5)} ~ {selectedSchedule.end_time.slice(0, 5)}</span>
          </div>
          <div className="flex justify-between text-gray-600"><span>인원</span><span className="font-medium text-gray-900">{headCount}명</span></div>
        </div>
      )}

      {errors.submit && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{errors.submit}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !phoneVerified || (availability !== null && !availability.isAvailable)}
        className="w-full bg-green-700 text-white font-semibold py-4 rounded-xl hover:bg-green-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-base"
      >
        {submitting ? '예약 신청 중...' : '예약 신청하기'}
      </button>
    </form>
  )
}
