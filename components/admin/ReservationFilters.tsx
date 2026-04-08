'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'

interface Props {
  farms: { id: string; name: string }[]
  currentStatus?: string
  currentDate?: string
  currentDateType?: string
  currentFarms?: string[]
  currentSearch?: string
}

const STATUS_OPTIONS = [
  { value: 'all',       label: '전체' },
  { value: 'pending',   label: '신청' },
  { value: 'confirmed', label: '확정' },
  { value: 'rejected',  label: '거절' },
  { value: 'cancelled', label: '취소' },
]

export default function ReservationFilters({
  farms,
  currentStatus,
  currentDate,
  currentDateType,
  currentFarms = [],
  currentSearch,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [farmOpen, setFarmOpen] = useState(false)

  const isCreatedDate = currentDateType === 'created'

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    router.push(`/admin/reservations?${params.toString()}`)
  }

  const toggleFarm = (id: string) => {
    const next = currentFarms.includes(id)
      ? currentFarms.filter((f) => f !== id)
      : [...currentFarms, id]
    const params = new URLSearchParams(searchParams.toString())
    if (next.length > 0) params.set('farms', next.join(','))
    else params.delete('farms')
    router.push(`/admin/reservations?${params.toString()}`)
  }

  const clearDate = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('date')
    router.push(`/admin/reservations?${params.toString()}`)
  }

  const farmLabel =
    currentFarms.length === 0 || currentFarms.length === farms.length
      ? '전체 농장'
      : `${currentFarms.length}개 농장`

  const farmActive = currentFarms.length > 0 && currentFarms.length < farms.length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* 상태 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-400 w-10 shrink-0">상태</span>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParam('status', opt.value)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                (currentStatus ?? 'all') === opt.value
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-gray-100" />

      {/* 날짜 · 농장 · 검색 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 날짜 기준 토글 */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          <button
            onClick={() => updateParam('dateType', 'reservation')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              !isCreatedDate ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            예약일
          </button>
          <button
            onClick={() => updateParam('dateType', 'created')}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-200 ${
              isCreatedDate ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            신청일
          </button>
        </div>

        {/* 날짜 인풋 */}
        <div className="relative flex items-center">
          <input
            type="date"
            value={currentDate ?? ''}
            onChange={(e) => updateParam('date', e.target.value)}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300 pr-7"
          />
          {currentDate && (
            <button
              onClick={clearDate}
              className="absolute right-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 농장 드롭다운 (슈퍼관리자만) */}
        {farms.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setFarmOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 border rounded-lg transition-colors min-w-28 ${
                farmActive
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <span className="flex-1 text-left">{farmLabel}</span>
              {farmOpen
                ? <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
            </button>

            {farmOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setFarmOpen(false)} />
                <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 max-h-72 overflow-y-auto">
                  <label className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 mb-1">
                    <input
                      type="checkbox"
                      checked={currentFarms.length === 0 || currentFarms.length === farms.length}
                      onChange={() => {
                        const params = new URLSearchParams(searchParams.toString())
                        params.delete('farms')
                        router.push(`/admin/reservations?${params.toString()}`)
                        setFarmOpen(false)
                      }}
                      className="rounded accent-green-700"
                    />
                    <span className="text-xs font-medium text-gray-700">전체 농장</span>
                  </label>
                  {farms.map((f) => (
                    <label key={f.id} className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentFarms.includes(f.id)}
                        onChange={() => toggleFarm(f.id)}
                        className="rounded accent-green-700"
                      />
                      <span className="text-xs text-gray-700">{f.name}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* 검색 */}
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="이름 또는 전화번호"
            defaultValue={currentSearch ?? ''}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateParam('search', (e.target as HTMLInputElement).value)
            }}
            className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300"
          />
        </div>
      </div>
    </div>
  )
}
