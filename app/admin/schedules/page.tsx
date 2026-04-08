import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { redirect } from 'next/navigation'
import ScheduleManager from '@/components/admin/ScheduleManager'
import BlockedDateManager from '@/components/admin/BlockedDateManager'

export default async function AdminSchedulesPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const supabase = await createAdminClient()

  // farm_programs + schedules 조회
  let fpQuery = supabase
    .from('farm_programs')
    .select(`
      id,
      farms:farm_id (id, name),
      programs:program_id (id, title),
      farm_schedules (id, farm_program_id, day_of_week, start_time, end_time, max_capacity, recommended_capacity, available_months, is_active)
    `)
    .eq('is_active', true)

  if (session.role === 'farm_admin' && session.farmId) {
    fpQuery = fpQuery.eq('farm_id', session.farmId)
  }

  const { data: rawFp } = await fpQuery

  type FarmRow = { id: string; name: string }
  type ProgramRow = { id: string; title: string }
  type ScheduleRow = {
    id: string
    farm_program_id: string
    day_of_week: number
    start_time: string
    end_time: string
    max_capacity: number
    recommended_capacity: number
    available_months: number[]
    is_active: boolean
  }
  type FpRow = {
    id: string
    farms: FarmRow | null
    programs: ProgramRow | null
    farm_schedules: ScheduleRow[]
  }

  const fpRows = (rawFp ?? []) as unknown as FpRow[]

  const groups = fpRows.map((fp) => ({
    id: fp.id,
    farmName: fp.farms?.name ?? '-',
    programTitle: fp.programs?.title ?? '-',
    schedules: fp.farm_schedules ?? [],
  }))

  // 차단 날짜 조회
  let blockedQuery = supabase
    .from('farm_blocked_dates')
    .select(`
      id, farm_schedule_id, farm_program_id, blocked_date, reason, created_at,
      farm_schedules(day_of_week, start_time, end_time)
    `)
    .order('blocked_date', { ascending: false })

  // 농장관리자는 본인 농장 프로그램에 속한 차단만 조회
  if (session.role === 'farm_admin' && session.farmId) {
    const farmProgramIds = fpRows.map((fp) => fp.id)
    if (farmProgramIds.length > 0) {
      blockedQuery = blockedQuery.in('farm_program_id', farmProgramIds)
    }
  }

  const { data: rawBlocked } = await blockedQuery

  type BlockedRow = {
    id: string
    farm_schedule_id: string | null
    farm_program_id: string | null
    blocked_date: string
    reason: string | null
    farm_schedules: { day_of_week: number; start_time: string; end_time: string } | null
  }

  const blockedRows = (rawBlocked ?? []) as unknown as BlockedRow[]

  // BlockedDateManager에 넘길 farmPrograms 옵션 (스케줄 리스트 포함)
  const farmProgramOptions = groups.map((g) => ({
    id: g.id,
    farmName: g.farmName,
    programTitle: g.programTitle,
    schedules: g.schedules.map((s) => ({
      id: s.id,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
    })),
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">스케줄 관리</h1>
        <p className="text-sm text-gray-500 mt-1">월별 운영 회차 설정 및 예약 차단 날짜를 관리합니다.</p>
      </div>

      {/* 운영 스케줄 */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-4">운영 회차 설정</h2>
        <p className="text-xs text-gray-400 mb-4">
          각 회차에서 운영 가능한 월을 클릭하여 토글하세요. 변경 사항은 즉시 저장됩니다.
        </p>
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
            등록된 프로그램이 없습니다.
          </div>
        ) : (
          <ScheduleManager groups={groups} />
        )}
      </div>

      {/* 예약 차단 */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-4">예약 차단 날짜</h2>
        <p className="text-xs text-gray-400 mb-4">
          특정 날짜에 예약을 차단합니다. 회차를 선택하면 해당 회차만, 미선택 시 해당 날짜 전체 회차가 차단됩니다.
        </p>
        <BlockedDateManager
          initialBlocked={blockedRows}
          farmPrograms={farmProgramOptions}
        />
      </div>
    </div>
  )
}
