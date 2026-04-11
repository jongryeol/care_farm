'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Schedule {
  day_of_week: number
  start_time: string
  end_time: string
  available_months: number[]
}

interface Props {
  schedules: Schedule[]
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // 월~토~일
const DAY_LABELS: Record<number, string> = {
  0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토',
}

function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

export default function FarmScheduleView({ schedules }: Props) {
  const today = new Date()
  const startYear = today.getFullYear()
  const startMonth = today.getMonth() + 1

  const [offset, setOffset] = useState(0) // 0, 1, 2

  const { year, month } = addMonths(startYear, startMonth, offset)

  return (
    <div>
      {/* 월 네비게이터 */}
      <div className="flex items-center w-full mb-4">
        <button
          onClick={() => setOffset(o => o - 1)}
          disabled={offset === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="flex-1 text-sm font-semibold text-gray-800 text-center">
          {year}년 {month}월
        </span>
        <button
          onClick={() => setOffset(o => o + 1)}
          disabled={offset === 2}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-20 disabled:cursor-not-allowed shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 요일별 일정 */}
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {DAY_ORDER.map((dow) => {
          const slots = schedules
            .filter(s => s.day_of_week === dow && s.available_months.includes(month))
            .sort((a, b) => a.start_time.localeCompare(b.start_time))

          return (
            <div key={dow} className="flex items-center gap-4 px-4 py-3 bg-white">
              <span className={`text-sm font-semibold w-4 shrink-0 ${
                dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700'
              }`}>
                {DAY_LABELS[dow]}
              </span>
              {slots.length === 0 ? (
                <span className="text-xs text-gray-300">운영 안함</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full font-medium"
                    >
                      {s.start_time.slice(0, 5)}~{s.end_time.slice(0, 5)}
                    </span>
                  ))}
                  <span className="text-xs text-gray-400 self-center">{slots.length}회차</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
