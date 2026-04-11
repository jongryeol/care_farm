import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Phone, Clock, Users, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import NaverMap from '@/components/farms/NaverMap'
import CopyAddressButton from '@/components/farms/CopyAddressButton'
import FarmImageSlider from '@/components/farms/FarmImageSlider'
import FarmScheduleView from '@/components/farms/FarmScheduleView'

export const revalidate = 60

interface Props {
  params: Promise<{ id: string }>
}

export default async function FarmDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const farmNo = parseInt(id)
  const isNumeric = !isNaN(farmNo)

  // 숫자이면 farm_no로 조회, 아니면 UUID로 조회 후 farm_no URL로 redirect
  let { data: farm } = isNumeric
    ? await supabase
        .from('farms')
        .select(`*, farm_programs (*, programs (*), farm_schedules (*))`)
        .eq('farm_no', farmNo)
        .eq('is_active', true)
        .maybeSingle()
    : await supabase
        .from('farms')
        .select(`*, farm_programs (*, programs (*), farm_schedules (*))`)
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle()

  if (!farm) notFound()

  // UUID로 접근했고 farm_no가 있으면 숫자 URL로 redirect
  if (!isNumeric && farm.farm_no) {
    redirect(`/farms/${farm.farm_no}`)
  }

  // 다른 농장 랜덤 2개
  const { data: otherFarmsRaw } = await supabase
    .from('farms')
    .select('id, farm_no, name, region, image_url, image_urls, description')
    .eq('is_active', true)
    .neq('id', farm.id)
  const otherFarms = (otherFarmsRaw ?? [])
    .sort(() => Math.random() - 0.5)
    .slice(0, 2)

  const farmPath = farm.farm_no ?? farm.id

  // 이미지 배열 (image_urls 우선, 없으면 image_url 단일, 없으면 빈 배열)
  const images: string[] =
    farm.image_urls?.length > 0
      ? farm.image_urls
      : farm.image_url
      ? [farm.image_url]
      : []

  type FarmExtra = { main_phone?: string | null }
  const { main_phone } = farm as typeof farm & FarmExtra

  const displayPhone = main_phone ?? farm.phone

  type ScheduleRow = { is_active: boolean; day_of_week: number; start_time: string; end_time: string; max_capacity: number; recommended_capacity: number; available_months: number[] }
  type ProgramRow = { programs: { title: string; description: string | null; duration_minutes: number | null; target_audience: string | null; notice: string | null } | null; farm_schedules: ScheduleRow[] }

  const programs = farm.farm_programs
    .filter((fp: { is_active: boolean }) => fp.is_active)
    .map((fp: ProgramRow) => ({
      ...fp.programs,
      schedules: fp.farm_schedules.filter((s) => s.is_active),
    }))


  return (
    <div className="max-w-4xl mx-auto px-4 py-12 pb-28 lg:pb-12">
      {/* 이미지 슬라이더 */}
      <div className="mb-8">
        <FarmImageSlider images={images} name={farm.name} />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{farm.name}</h1>
            <div className="flex items-center gap-1.5 mb-3 mt-3">
              <Image src="/chungnam-agri-logo.png" alt="충청남도농업기술원" width={60} height={16} className="h-4 w-auto object-contain opacity-70" />
              <span className="text-xs text-gray-400">와 함께 합니다.</span>
            </div>
            {farm.description && (
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{farm.description}</p>
            )}
          </div>

          {/* 연락처 및 위치 */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
            {farm.address && (
              <div className="flex items-start gap-3 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span>{farm.address}</span>
                  <CopyAddressButton address={farm.address} />
                </div>
              </div>
            )}
            {displayPhone && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-green-600 shrink-0" />
                <a href={`tel:${displayPhone}`} className="hover:text-green-700 transition-colors">
                  {displayPhone}
                </a>
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

          {/* 체험 프로그램 */}
          {programs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">체험 프로그램</h2>
              <div className="space-y-4">
                {programs.map((p: { title?: string; description?: string | null; duration_minutes?: number | null; target_audience?: string | null; notice?: string | null; schedules: { day_of_week: number; start_time: string; end_time: string; available_months: number[] }[] }, idx: number) => (
                  <div key={idx} className="bg-green-50 rounded-2xl p-5 space-y-3">
                    <div className="font-semibold text-green-800 text-base">{p.title}</div>
                    {p.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {p.duration_minutes && (
                        <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-green-100">
                          <Clock className="w-3.5 h-3.5 text-green-600" />
                          {p.duration_minutes}분
                        </span>
                      )}
                      {p.target_audience && (
                        <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border border-green-100">
                          <Users className="w-3.5 h-3.5 text-green-600" />
                          {p.target_audience}
                        </span>
                      )}
                    </div>
                    {p.schedules.length > 0 && (
                      <div className="border-t border-green-100 pt-3">
                        <p className="text-xs font-medium text-green-700 mb-2">운영 일정</p>
                        <FarmScheduleView schedules={p.schedules} />
                      </div>
                    )}
                    {p.notice && (
                      <div className="text-xs text-gray-500 border-t border-green-100 pt-3 whitespace-pre-line">
                        {p.notice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 사이드바: 예약 CTA */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-900 mb-2">지금 예약하기</h3>
            <p className="text-sm text-gray-500 mb-5">원하는 날짜와 회차를 선택해 예약 신청을 하세요.</p>

            <Link
              href={`/farms/${farmPath}/reserve`}
              className="flex items-center justify-center gap-2 w-full bg-green-700 text-white font-semibold py-3.5 rounded-xl hover:bg-green-800 transition-colors"
            >
              예약 신청하기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 농장 더보기 */}
      {otherFarms.length > 0 && (
        <div className="mt-16 border-t border-gray-100 pt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">농장 더보기</h2>
            <Link
              href="/farms"
              className="text-sm text-green-700 font-medium hover:underline flex items-center gap-1"
            >
              모든 농장 보기
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {otherFarms.map((f) => {
              const fPath = f.farm_no ?? f.id
              const thumb = (f.image_urls as string[] | null)?.length
                ? (f.image_urls as string[])[0]
                : (f.image_url as string | null)
              return (
                <Link
                  key={f.id}
                  href={`/farms/${fPath}`}
                  className="group flex gap-4 bg-gray-50 hover:bg-green-50 rounded-2xl p-4 transition-colors"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={f.name as string}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-200 shrink-0" />
                  )}
                  <div className="min-w-0">
                    {f.region && (
                      <span className="text-xs text-green-700 font-medium">{f.region as string}</span>
                    )}
                    <p className="font-semibold text-gray-900 mt-0.5 group-hover:text-green-800 transition-colors">
                      {f.name as string}
                    </p>
                    {f.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{f.description as string}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* 모바일 하단 고정 CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <Link
          href={`/farms/${farmPath}/reserve`}
          className="flex items-center justify-center gap-2 w-full bg-green-700 text-white font-semibold py-3.5 rounded-xl hover:bg-green-800 transition-colors"
        >
          예약 신청하기
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
