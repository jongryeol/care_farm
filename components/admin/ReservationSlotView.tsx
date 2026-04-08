'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { Reservation, ReservationStatus } from '@/lib/types'
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '@/lib/types'
import ReservationActionButtons from './ReservationActionButtons'

type ReservationRow = Reservation & {
  farms: { id: string; name: string; region: string } | null
  farm_schedules: { start_time: string; end_time: string } | null
}

interface Props {
  reservations: ReservationRow[]
}

interface SlotGroup {
  key: string
  farmName: string
  date: string
  startTime: string
  endTime: string
  items: ReservationRow[]
  totalHead: number
  pendingHead: number
  confirmedHead: number
}

export default function ReservationSlotView({ reservations }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  // 날짜 + 농장 + 회차별 그룹핑
  const groupMap = new Map<string, SlotGroup>()
  for (const r of reservations) {
    const date = r.reservation_date
    const farmName = r.farms?.name ?? '-'
    const startTime = (r.farm_schedules?.start_time ?? r.start_time).slice(0, 5)
    const endTime = (r.farm_schedules?.end_time ?? r.end_time).slice(0, 5)
    const key = `${date}__${r.farm_id}__${r.schedule_id}`

    if (!groupMap.has(key)) {
      groupMap.set(key, { key, farmName, date, startTime, endTime, items: [], totalHead: 0, pendingHead: 0, confirmedHead: 0 })
    }
    const g = groupMap.get(key)!
    g.items.push(r)
    if (['pending', 'confirmed'].includes(r.status)) g.totalHead += r.head_count
    if (r.status === 'pending') g.pendingHead += r.head_count
    if (r.status === 'confirmed') g.confirmedHead += r.head_count
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    if (a.farmName !== b.farmName) return a.farmName < b.farmName ? -1 : 1
    return a.startTime < b.startTime ? -1 : 1
  })

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>예약 내역이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isOpen = expanded[g.key] ?? false
        const dateLabel = format(new Date(g.date + 'T00:00:00'), 'yyyy년 M월 d일 (E)', { locale: ko })

        return (
          <div key={g.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* 슬롯 헤더 */}
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [g.key]: !isOpen }))}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <span className="text-sm font-semibold text-gray-900">{dateLabel}</span>
                  <span className="ml-2 text-sm text-gray-500">{g.startTime}~{g.endTime}</span>
                </div>
                <span className="text-sm text-gray-600 font-medium">{g.farmName}</span>

                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    <Users className="w-3.5 h-3.5" />
                    총 {g.totalHead}명
                  </span>
                  {g.confirmedHead > 0 && (
                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      확정 {g.confirmedHead}명
                    </span>
                  )}
                  {g.pendingHead > 0 && (
                    <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                      신청 {g.pendingHead}명
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">{g.items.length}건</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {/* 예약 목록 */}
            {isOpen && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {g.items.map((r) => {
                  const statusKey = r.status as ReservationStatus
                  return (
                    <div key={r.id} className="px-5 py-3 flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-40">
                        <div className="font-medium text-gray-800 text-sm">{r.applicant_name}</div>
                        <div className="text-xs text-gray-400">
                          {r.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')}
                        </div>
                      </div>
                      <div className="text-sm text-gray-700">{r.head_count}명</div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${RESERVATION_STATUS_COLORS[statusKey]}`}>
                        {RESERVATION_STATUS_LABELS[statusKey]}
                      </span>
                      <div className="text-xs text-gray-400 font-mono">{r.reservation_no}</div>
                      {r.status === 'pending' && <ReservationActionButtons reservationId={r.id} />}
                      {r.reject_reason && (
                        <div className="text-xs text-red-400 max-w-xs truncate" title={r.reject_reason}>
                          사유: {r.reject_reason}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
