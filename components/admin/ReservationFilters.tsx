'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface Props {
  farms: { id: string; name: string }[]
  currentStatus?: string
  currentDate?: string
  currentDateType?: string
  currentView?: string
  currentFarms?: string[]
  currentSearch?: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '신청' },
  { value: 'confirmed', label: '확정' },
  { value: 'rejected', label: '거절' },
  { value: 'cancelled', label: '취소' },
]

export default function ReservationFilters({ farms, currentStatus, currentDate, currentDateType, currentView, currentFarms = [], currentSearch }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [farmOpen, setFarmOpen] = useState(false)
  const isCreatedDate = currentDateType === 'created'
  const isSlotView = currentView === 'slots'

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/reservations?${params.toString()}`)
  }

  const toggleFarm = (id: string) => {
    const next = currentFarms.includes(id)
      ? currentFarms.filter((f) => f !== id)
      : [...currentFarms, id]

    const params = new URLSearchParams(searchParams.toString())
    if (next.length > 0) {
      params.set('farms', next.join(','))
    } else {
      params.delete('farms')
    }
    router.push(`/admin/reservations?${params.toString()}`)
  }

  const farmLabel =
    currentFarms.length === 0
      ? '전체 농장'
      : currentFarms.length === farms.length
      ? '전체 농장'
      : `${currentFarms.length}개 농장 선택`

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
      {/* 상태 필터 */}
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

      {/* 날짜 타입 + 날짜 필터 */}
      <div className="flex items-center gap-1.5">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
          <button
            onClick={() => updateParam('dateType', 'reservation')}
            className={`px-3 py-1.5 font-medium transition-colors ${!isCreatedDate ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            예약일
          </button>
          <button
            onClick={() => updateParam('dateType', 'created')}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-200 ${isCreatedDate ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            신청일
          </button>
        </div>
        <input
          type="date"
          value={currentDate ?? ''}
          onChange={(e) => updateParam('date', e.target.value)}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300"
        />
      </div>

      {/* 농장 체크박스 필터 (슈퍼관리자만) */}
      {farms.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setFarmOpen((v) => !v)}
            className="flex items-center gap-2 text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-w-32"
          >
            <span className={currentFarms.length > 0 && currentFarms.length < farms.length ? 'text-green-700 font-medium' : 'text-gray-600'}>
              {farmLabel}
            </span>
            {farmOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />}
          </button>

          {farmOpen && (
            <>
              {/* 바깥 클릭 닫기 */}
              <div className="fixed inset-0 z-10" onClick={() => setFarmOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 max-h-72 overflow-y-auto">
                {/* 전체 선택/해제 */}
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
                    <span className="text-xs text-gray-700 leading-snug">{f.name}</span>
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
          placeholder="이름 또는 전화번호 검색"
          defaultValue={currentSearch ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParam('search', (e.target as HTMLInputElement).value)
            }
          }}
          className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300"
        />
      </div>

      {/* 뷰 전환 */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs ml-auto">
        <button
          onClick={() => updateParam('view', 'list')}
          className={`px-3 py-1.5 font-medium transition-colors ${!isSlotView ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          title="목록 보기"
        >
          목록
        </button>
        <button
          onClick={() => updateParam('view', 'slots')}
          className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-200 ${isSlotView ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          title="회차별 보기"
        >
          회차별
        </button>
      </div>
    </div>
  )
}
