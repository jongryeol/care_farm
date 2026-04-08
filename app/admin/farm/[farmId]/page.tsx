import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import FarmManager from '@/components/admin/FarmManager'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ farmId: string }>
}

export default async function AdminFarmEditPage({ params }: Props) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const { farmId } = await params

  // farm_admin은 본인 농장만 접근 가능
  if (session.role === 'farm_admin' && session.farmId !== farmId) {
    redirect('/admin/farm')
  }

  const supabase = await createAdminClient()
  const { data: farm } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .single()

  if (!farm) notFound()

  return (
    <div className="p-6 max-w-3xl">
      {/* 뒤로가기 (super_admin만) */}
      {session.role === 'super_admin' && (
        <Link
          href="/admin/farm"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 mb-5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          농장 목록으로
        </Link>
      )}

      <h1 className="text-xl font-semibold text-gray-900 mb-6">{farm.name}</h1>
      <FarmManager farm={farm} />
    </div>
  )
}
