import { createClient } from '@/lib/supabase/server'
import { DAY_OF_WEEK_LABELS } from '@/lib/types'
import Link from 'next/link'
import { MapPin, Phone, Calendar, ChevronRight } from 'lucide-react'

export const revalidate = 60

export default async function FarmsPage() {
  const supabase = await createClient()

  const { data: farms } = await supabase
    .from('farms')
    .select(`
      *,
      farm_programs (
        farm_schedules (day_of_week, is_active)
      )
    `)
    .eq('is_active', true)
    .order('region')

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* 헤더 */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">치유농장 목록</h1>
        <p className="text-gray-500">전국 {farms?.length ?? 0}개 치유농장에서 힐링 체험을 신청하세요</p>
      </div>

      {/* 농장 그리드 */}
      {!farms || farms.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">등록된 농장이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => {
            const allSchedules = farm.farm_programs.flatMap(
              (fp: { farm_schedules: { day_of_week: number; is_active: boolean }[] }) => fp.farm_schedules
            )
            const activeDays = Array.from(
              new Set(
                allSchedules
                  .filter((s: { is_active: boolean }) => s.is_active)
                  .map((s: { day_of_week: number }) => s.day_of_week)
              )
            ).sort() as number[]

            return (
              <Link
                key={farm.id}
                href={`/farms/${farm.id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all overflow-hidden"
              >
                {/* 이미지 영역 */}
                <div className="h-44 bg-gradient-to-br from-green-200 to-green-400 relative overflow-hidden">
                  {farm.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={farm.image_url}
                      alt={farm.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-green-700 font-medium text-sm">
                      {farm.name}
                    </div>
                  )}
                  {farm.region && (
                    <span className="absolute top-3 left-3 bg-white/90 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {farm.region}
                    </span>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-5">
                  <h2 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                    {farm.name}
                  </h2>
                  {farm.short_description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{farm.short_description}</p>
                  )}

                  <div className="space-y-1.5 text-xs text-gray-500">
                    {farm.address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{farm.address}</span>
                      </div>
                    )}
                    {farm.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{farm.phone}</span>
                      </div>
                    )}
                    {activeDays.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>운영: {activeDays.map((d) => DAY_OF_WEEK_LABELS[d]).join('·')}요일</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                      예약 가능
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
