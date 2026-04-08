'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, CheckCircle, Loader2 } from 'lucide-react'

export default function AdminLoginForm() {
  const router = useRouter()

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sendLoading, setSendLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [error, setError] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function formatPhone(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  }

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current)
    setCountdown(300)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  function formatCountdown(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  async function handleSend() {
    setError('')
    setSendLoading(true)
    try {
      const res = await fetch('/api/admin/login/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setCodeSent(true)
      setCode('')
      startCountdown()
    } finally {
      setSendLoading(false)
    }
  }

  async function handleVerify() {
    setError('')
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/admin/login/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      setVerified(true)
      router.push('/admin/reservations')
      router.refresh()
    } finally {
      setVerifyLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
      {/* 전화번호 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">전화번호</label>
        <div className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(formatPhone(e.target.value))
              setCodeSent(false)
              setCode('')
              setError('')
            }}
            placeholder="010-0000-0000"
            disabled={verified}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition disabled:bg-gray-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sendLoading || verified || phone.replace(/\D/g, '').length < 10}
            className="px-4 py-3 rounded-xl bg-green-700 text-white text-sm font-medium disabled:opacity-40 hover:bg-green-800 transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            {sendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
            {codeSent ? '재발송' : '인증번호'}
          </button>
        </div>
      </div>

      {/* 인증번호 입력 */}
      {codeSent && !verified && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">인증번호</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6자리 입력"
                maxLength={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 transition pr-16"
              />
              {countdown > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-orange-500 font-mono">
                  {formatCountdown(countdown)}
                </span>
              )}
              {countdown === 0 && codeSent && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-400">만료</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifyLoading || code.length < 6 || countdown === 0}
              className="px-5 py-3 rounded-xl bg-green-700 text-white text-sm font-medium disabled:opacity-40 hover:bg-green-800 transition-colors flex items-center gap-1.5"
            >
              {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '확인'}
            </button>
          </div>
        </div>
      )}

      {/* 인증 완료 */}
      {verified && (
        <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          인증 완료. 이동 중입니다...
        </div>
      )}

      {/* 오류 */}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
    </div>
  )
}
