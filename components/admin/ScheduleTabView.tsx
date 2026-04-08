'use client'

import { useState } from 'react'
import ScheduleManager from './ScheduleManager'
import BlockedDateManager from './BlockedDateManager'

interface Schedule {
  id: string
  farm_program_id: string
  year: number
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
  recommended_capacity: number
  available_months: number[]
  is_active: boolean
}

interface FarmProgramGroup {
  id: string
  farmName: string
  programTitle: string
  schedules: Schedule[]
}

interface BlockedRow {
  id: string
  farm_schedule_id: string | null
  farm_program_id: string | null
  blocked_date: string
  reason: string | null
  farm_schedules: { day_of_week: number; start_time: string; end_time: string } | null
}

interface FarmProgramOption {
  id: string
  farmName: string
  programTitle: string
  schedules: { id: string; day_of_week: number; start_time: string; end_time: string }[]
}

interface Props {
  groups: FarmProgramGroup[]
  initialBlocked: BlockedRow[]
  farmPrograms: FarmProgramOption[]
}

type Tab = 'schedule' | 'blocked'

export default function ScheduleTabView({ groups, initialBlocked, farmPrograms }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('schedule')

  return (
    <div>
      {/* 탭 버튼 */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'schedule'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          운영 회차 설정
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'blocked'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          예약 차단 날짜
        </button>
      </div>

      {activeTab === 'schedule' && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            추가하기를 눌러 연도·월을 선택한 후 요일·시간·인원을 설정하세요. 운영 월은 카드에서 직접 토글할 수 있습니다.
          </p>
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
              등록된 프로그램이 없습니다.
            </div>
          ) : (
            <ScheduleManager groups={groups} />
          )}
        </>
      )}

      {activeTab === 'blocked' && (
        <>
          <p className="text-xs text-gray-400 mb-4">
            특정 날짜에 예약을 차단합니다. 회차를 선택하면 해당 회차만, 미선택 시 해당 날짜 전체 회차가 차단됩니다.
          </p>
          <BlockedDateManager
            initialBlocked={initialBlocked}
            farmPrograms={farmPrograms}
          />
        </>
      )}
    </div>
  )
}
