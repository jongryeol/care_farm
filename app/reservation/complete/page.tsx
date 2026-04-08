import { createAdminClient as createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Calendar, Clock, Users, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  searchParams: Promise<{ no?: string }>
}

export default async function ReservationCompletePage({ searchParams }: Props) {
  const { no } = await searchParams
  if (!no) notFound()

  const supabase = await createClient()

  const { data: reservation } = await supabase
    .from('reservations')
    .select(`
      reservation_no, reservation_date, head_count, status, request_memo,
      farms:farm_id (name, address),
      farm_schedules:schedule_id (start_time, end_time)
    `)
    .eq('reservation_no', no)
    .single()

  if (!reservation) notFound()

  const farm = reservation.farms as { name: string; address: string } | null
  const schedule = reservation.farm_schedules as { start_time: string; end_time: string } | null

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {/* 완료 아이콘 */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">예약 신청이 완료되었습니다</h1>
      <p className="text-gray-500 mb-1">
        예약번호: <span className="font-mono font-semibold text-green-700">{reservation.reservation_no}</span>
      </p>
      <p className="text-sm text-gray-400 mb-10">관리자 확인 후 예약 확정 여부가 안내됩니다.</p>

      {/* 예약 상세 카드 */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm text-left divide-y divide-gray-50">
        <div className="px-6 py-4">
          <div className="text-xs text-gray-400 mb-0.5">농장</div>
          <div className="font-semibold text-gray-900">{farm?.name}</div>
          {farm?.address && <div className="text-xs text-gray-500 mt-0.5">{farm.address}</div>}
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
              <Calendar className="w-3.5 h-3.5" />날짜
            </div>
            <div className="font-medium text-gray-800 text-sm">
              {format(new Date(reservation.reservation_date + 'T00:00:00'), 'yyyy년 M월 d일 (E)', { locale: ko })}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
              <Clock className="w-3.5 h-3.5" />회차
            </div>
            <div className="font-medium text-gray-800 text-sm">
              {schedule?.start_time?.slice(0, 5)} ~ {schedule?.end_time?.slice(0, 5)}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
              <Users className="w-3.5 h-3.5" />인원
            </div>
            <div className="font-medium text-gray-800 text-sm">{reservation.head_count}명</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
              현재 상태
            </div>
            <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
              예약 신청
            </span>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 rounded-xl px-5 py-4 text-sm text-blue-700 text-left">
        <strong>안내사항</strong>
        <ul className="mt-2 space-y-1 text-blue-600 text-xs">
          <li>• 예약 확정/거절 여부는 담당자 확인 후 안내 드립니다.</li>
          <li>• 체험 당일 신청자 이름과 전화번호로 확인합니다.</li>
          <li>• 예약 확인·취소·변경은 아래 버튼을 이용해 주세요.</li>
        </ul>
      </div>

      {/* 하단 버튼 */}
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={`/reservation/lookup`}
          className="inline-flex items-center justify-center gap-2 bg-green-700 text-white font-semibold py-3.5 rounded-xl hover:bg-green-800 transition-colors"
        >
          예약 확인·취소·변경
          <ChevronRight className="w-4 h-4" />
        </Link>
        <div className="flex gap-3">
          <Link
            href="/farms"
            className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
          >
            다른 농장 보기
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            메인으로
          </Link>
        </div>
      </div>
    </div>
  )
}
