import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { redirect } from 'next/navigation'
import FarmManager from '@/components/admin/FarmManager'
import FarmList from '@/components/admin/FarmList'

export const dynamic = 'force-dynamic'

export default async function AdminFarmPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const supabase = await createAdminClient()

  // farm_admin: 본인 농장 바로 편집
  if (session.role === 'farm_admin') {
    if (!session.farmId) {
      return <div className="p-8 text-gray-500">관리할 농장이 없습니다.</div>
    }
    const { data: farm } = await supabase
      .from('farms')
      .select('*')
      .eq('id', session.farmId)
      .single()

    if (!farm) {
      return <div className="p-8 text-gray-500">농장 정보를 불러올 수 없습니다.</div>
    }

    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">농장 관리</h1>
        <FarmManager farm={farm} />
      </div>
    )
  }

  // super_admin: 전체 농장 목록
  const { data: farms } = await supabase
    .from('farms')
    .select('id, name, region, address, is_active, image_url, short_description, updated_at')
    .order('name')

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">농장 관리</h1>
        <p className="text-sm text-gray-500 mt-1">농장을 클릭하면 정보를 수정할 수 있습니다.</p>
      </div>
      <FarmList farms={farms ?? []} />
    </div>
  )
}
