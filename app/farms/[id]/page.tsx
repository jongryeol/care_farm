import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Clock, Users, Calendar, ChevronRight, ArrowLeft } from 'lucide-react'
import { DAY_OF_WEEK_LABELS } from '@/lib/types'
import NaverMap from '@/components/farms/NaverMap'
import CopyAddressButton from '@/components/farms/CopyAddressButton'

export const revalidate = 60

interface Props {
  params: Promise<{ id: string }>
}

export default async function FarmDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: farm } = await supabase
    .from('farms')
    .select(`
      *,
      farm_programs (
        *,
        programs (*),
        farm_schedules (*)
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!farm) notFound()

  // 모든 활성 스케줄을 프로그램에서 꺼내 요일별 그룹핑
  type ScheduleRow = typeof farm.farm_programs[0]['farm_schedules'][0] & { programTitle: string }
  const schedulesByDay: Record<number, ScheduleRow[]> = {}
  for (const fp of farm.farm_programs) {
    if (!fp.is_active) continue
    for (const s of fp.farm_schedules) {
      if (!s.is_active) continue
      const row: ScheduleRow = { ...s, programTitle: fp.programs?.title ?? '' }
      if (!schedulesByDay[s.day_of_week]) schedulesByDay[s.day_of_week] = []
      schedulesByDay[s.day_of_week].push(row)
    }
  }
  const activeDays = Object.keys(schedulesByDay).map(Number).sort()

  const program = farm.farm_programs?.[0]?.programs

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-28 lg:pb-12">
      {/* 뒤로가기 */}
      <Link href="/farms" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        농장 목록
      </Link>

      {/* 대표 이미지 */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-green-200 to-green-400 h-72 mb-8">
        {farm.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={farm.image_url} alt={farm.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-green-700 font-semibold text-xl">
            {farm.name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 메인 정보 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 농장 기본 정보 */}
          <div>
            {farm.region && (
              <span className="inline-block bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full mb-3">
                {farm.region}
              </span>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{farm.name}</h1>
            {farm.description && (
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{farm.description}</p>
            )}
          </div>

          {/* 연락처 및 위치 */}
          <div className="space-y-2 text-sm text-gray-600">
            {farm.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>{farm.address}</span>
                <CopyAddressButton address={farm.address} />
              </div>
            )}
            {farm.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-600 shrink-0" />
                <a href={`tel:${farm.phone}`} className="hover:text-green-700">{farm.phone}</a>
              </div>
            )}
          </div>

          {/* 지도 */}
          {farm.latitude && farm.longitude && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">위치</h2>
              <NaverMap
                latitude={Number(farm.latitude)}
                longitude={Number(farm.longitude)}
                name={farm.name}
              />
            </div>
          )}

          {/* 운영 일정 */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">운영 일정 및 회차</h2>
            {activeDays.length === 0 ? (
              <p className="text-gray-400 text-sm">운영 일정이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {activeDays.map((day) => (
                  <div key={day} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-gray-900">{DAY_OF_WEEK_LABELS[day]}요일</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {schedulesByDay[day].map((schedule) => (
                        <div key={schedule.id} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800 mb-1">
                            <Clock className="w-3.5 h-3.5 text-green-600" />
                            {schedule.start_time.slice(0, 5)} ~ {schedule.end_time.slice(0, 5)}
                          </div>
                          {schedule.programTitle && (
                            <div className="text-xs text-green-700 font-medium mb-0.5">{schedule.programTitle}</div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Users className="w-3.5 h-3.5" />
                            <span>최대 {schedule.max_capacity}명 / 적정 {schedule.recommended_capacity}명</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 체험 프로그램 정보 */}
          {program && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">체험 프로그램</h2>
              <div className="bg-green-50 rounded-xl p-5 space-y-3">
                <div className="font-semibold text-green-800">{program.title}</div>
                {program.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">{program.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {program.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {program.duration_minutes}분
                    </span>
                  )}
                  {program.target_audience && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {program.target_audience}
                    </span>
                  )}
                </div>
                {program.notice && (
                  <div className="text-xs text-gray-500 border-t border-green-100 pt-3 whitespace-pre-line">
                    {program.notice}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 모바일 하단 고정 CTA */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          <Link
            href={`/farms/${farm.id}/reserve`}
            className="flex items-center justify-center gap-2 w-full bg-green-700 text-white font-semibold py-3.5 rounded-xl hover:bg-green-800 transition-colors"
          >
            예약 신청하기
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 사이드바: 예약 CTA */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-2">지금 예약하기</h3>
            <p className="text-sm text-gray-500 mb-5">원하는 날짜와 회차를 선택해 예약 신청을 하세요.</p>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <span>운영 요일</span>
                <span className="font-medium">{activeDays.map((d) => DAY_OF_WEEK_LABELS[d]).join('·')}요일</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>일일 회차</span>
                <span className="font-medium">최대 {Math.max(...activeDays.map((d) => schedulesByDay[d].length), 0)}회</span>
              </div>
            </div>

            <Link
              href={`/farms/${farm.id}/reserve`}
              className="flex items-center justify-center gap-2 w-full bg-green-700 text-white font-semibold py-3.5 rounded-xl hover:bg-green-800 transition-colors"
            >
              예약 신청하기
              <ChevronRight className="w-4 h-4" />
            </Link>

            {farm.phone && (
              <a
                href={`tel:${farm.phone}`}
                className="flex items-center justify-center gap-2 w-full mt-3 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                <Phone className="w-4 h-4" />
                전화 문의
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
