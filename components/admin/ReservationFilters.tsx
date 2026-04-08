'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

interface Props {
  farms: { id: string; name: string }[]
  currentStatus?: string
  currentDate?: string
  currentFarm?: string
  currentSearch?: string
}

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '신청' },
  { value: 'confirmed', label: '확정' },
  { value: 'rejected', label: '거절' },
  { value: 'cancelled', label: '취소' },
]

export default function ReservationFilters({ farms, currentStatus, currentDate, currentFarm, currentSearch }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/reservations?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3">
      {/* 상태 필터 */}
      <div className="flex gap-1.5">
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

      {/* 날짜 필터 */}
      <input
        type="date"
        value={currentDate ?? ''}
        onChange={(e) => updateParam('date', e.target.value)}
        className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300"
      />

      {/* 농장 필터 (슈퍼관리자만) */}
      {farms.length > 0 && (
        <select
          value={currentFarm ?? ''}
          onChange={(e) => updateParam('farm', e.target.value)}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-300"
        >
          <option value="">전체 농장</option>
          {farms.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
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
    </div>
  )
}
