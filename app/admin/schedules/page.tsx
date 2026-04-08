import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { redirect } from 'next/navigation'
import ScheduleTabView from '@/components/admin/ScheduleTabView'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ farmId?: string }>
}

export default async function AdminSchedulesPage({ searchParams }: Props) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const { farmId: qFarmId } = await searchParams
  const supabase = await createAdminClient()

  // farm_programs + schedules 조회
  let fpQuery = supabase
    .from('farm_programs')
    .select(`
      id,
      farms:farm_id (id, name),
      programs:program_id (id, title),
      farm_schedules (id, farm_program_id, year, day_of_week, start_time, end_time, max_capacity, recommended_capacity, available_months, is_active)
    `)
    .eq('is_active', true)

  if (session.role === 'farm_admin' && session.farmId) {
    fpQuery = fpQuery.eq('farm_id', session.farmId)
  } else if (session.role === 'super_admin' && qFarmId) {
    fpQuery = fpQuery.eq('farm_id', qFarmId)
  }

  const { data: rawFp } = await fpQuery

  type FarmRow = { id: string; name: string }
  type ProgramRow = { id: string; title: string }
  type ScheduleRow = {
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

  if (session.role === 'farm_admin' && session.farmId) {
    const farmProgramIds = fpRows.map((fp) => fp.id)
    if (farmProgramIds.length > 0) {
      blockedQuery = blockedQuery.in('farm_program_id', farmProgramIds)
    }
  } else if (session.role === 'super_admin' && qFarmId) {
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

  const filterLabel = session.role === 'super_admin' && qFarmId
    ? groups[0]?.farmName ?? '선택된 농장'
    : session.role === 'super_admin'
    ? '전체 농장'
    : '내 농장'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">스케줄 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          {filterLabel} · 월별 운영 회차 설정 및 예약 차단 날짜를 관리합니다.
        </p>
      </div>

      <ScheduleTabView
        groups={groups}
        initialBlocked={blockedRows}
        farmPrograms={farmProgramOptions}
      />
    </div>
  )
}
