import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ReservationForm from '@/components/reservation/ReservationForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReservePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: farm } = await supabase
    .from('farms')
    .select(`
      id, name, address, region,
      farm_programs (
        id, program_id, is_active, min_advance_days,
        programs (id, title, description),
        farm_schedules (*)
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!farm) notFound()

  const activeFarmPrograms = farm.farm_programs
    .filter((fp: { is_active: boolean }) => fp.is_active)
    .map((fp: typeof farm.farm_programs[0]) => ({
      ...fp,
      farm_schedules: fp.farm_schedules.filter((s: { is_active: boolean }) => s.is_active),
    }))
    .filter((fp: { farm_schedules: unknown[] }) => fp.farm_schedules.length > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 overflow-x-hidden">
      {/* 뒤로가기 */}
      <Link
        href={`/farms/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        농장 상세로 돌아가기
      </Link>

      {/* 헤더 */}
      <div className="mb-8">
        <div className="text-sm text-gray-400 mb-1">{farm.region}</div>
        <h1 className="text-2xl font-bold text-gray-900">{farm.name} 예약 신청</h1>
        <p className="text-sm text-gray-500 mt-1">{farm.address}</p>
      </div>

      {activeFarmPrograms.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>현재 예약 가능한 프로그램이 없습니다.</p>
          <Link href={`/farms/${id}`} className="text-green-600 text-sm mt-2 inline-block hover:underline">
            농장 상세 보기
          </Link>
        </div>
      ) : (
        <ReservationForm
          farmId={farm.id}
          farmName={farm.name}
          farmPrograms={activeFarmPrograms}
        />
      )}
    </div>
  )
}
