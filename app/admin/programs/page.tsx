import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { redirect } from 'next/navigation'
import ProgramManager from '@/components/admin/ProgramManager'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ farmId?: string }>
}

export default async function AdminProgramsPage({ searchParams }: Props) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const { farmId: qFarmId } = await searchParams
  const supabase = await createAdminClient()

  // super_admin용 전체 농장 목록
  let farms: { id: string; name: string }[] = []
  if (session.role === 'super_admin') {
    const { data } = await supabase
      .from('farms')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    farms = data ?? []
  }

  let fpQuery = supabase
    .from('farm_programs')
    .select(`
      id,
      is_active,
      farm_id,
      farms:farm_id (id, name),
      programs (
        id, title, description, target_audience, process_description,
        duration_minutes, notice, image_url, is_active
      )
    `)

  if (session.role === 'farm_admin' && session.farmId) {
    fpQuery = fpQuery.eq('farm_id', session.farmId)
  } else if (session.role === 'super_admin' && qFarmId) {
    fpQuery = fpQuery.eq('farm_id', qFarmId)
  }

  const { data: rawFp } = await fpQuery

  type ProgramRow = {
    id: string
    title: string
    description: string | null
    target_audience: string | null
    process_description: string | null
    duration_minutes: number | null
    notice: string | null
    image_url: string | null
    is_active: boolean
  }
  type FarmRow = { id: string; name: string }
  type FpRow = {
    id: string
    is_active: boolean
    farm_id: string
    farms: FarmRow | null
    programs: ProgramRow | null
  }

  const fpRows = (rawFp ?? []) as unknown as FpRow[]

  const items = fpRows
    .filter((fp) => fp.programs !== null)
    .map((fp) => ({
      farmProgramId: fp.id,
      farmProgramActive: fp.is_active,
      farmId: fp.farm_id,
      farmName: fp.farms?.name ?? null,
      program: fp.programs!,
    }))

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">프로그램 관리</h1>
        <p className="text-sm text-gray-500 mt-1">농장 체험 프로그램의 상세 내용을 관리합니다.</p>
      </div>

      <ProgramManager
        items={items}
        isSuperAdmin={session.role === 'super_admin'}
        farms={farms}
        defaultFarmId={qFarmId ?? null}
      />
    </div>
  )
}
