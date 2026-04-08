import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { redirect } from 'next/navigation'
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '@/lib/types'
import type { Reservation, ReservationStatus } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'
import ReservationActionButtons from '@/components/admin/ReservationActionButtons'
import ReservationFilters from '@/components/admin/ReservationFilters'
import ReservationSlotView from '@/components/admin/ReservationSlotView'
import ReservationViewTabs from '@/components/admin/ReservationViewTabs'
import AdminReservationCreateButton from '@/components/admin/AdminReservationCreateButton'
import ReservationDetailPanel from '@/components/admin/ReservationDetailPanel'

export const dynamic = 'force-dynamic'

interface SearchParams {
  status?: string
  date?: string
  dateType?: string   // 'reservation' | 'created'
  view?: string       // 'list' | 'slots'
  farms?: string
  search?: string
  farmId?: string     // 사이드바 농장 선택
  no?: string         // 예약번호 상세 패널
}

interface Props {
  searchParams: Promise<SearchParams>
}

type ReservationRow = Reservation & {
  farms: { id: string; name: string; region: string } | null
  farm_schedules: { start_time: string; end_time: string } | null
}

export default async function AdminReservationsPage({ searchParams }: Props) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  const supabase = await createAdminClient()
  const adminProfile = {
    id: session.adminId,
    name: session.name,
    role: session.role,
    farm_id: session.farmId,
  }

  const params = await searchParams
  const { status, date, dateType, view, farms: farmsParam, search, farmId, no } = params
  const selectedFarms = farmsParam ? farmsParam.split(',').filter(Boolean) : []
  const isCreatedDate = dateType === 'created'
  const currentView = view === 'slots' ? 'slots' : 'list'

  // 예약 쿼리 구성
  let query = supabase
    .from('reservations')
    .select(`
      id, reservation_no, farm_id, schedule_id, reservation_date,
      start_time, end_time, head_count, applicant_name, applicant_phone,
      status, reject_reason, created_at, updated_at,
      farms:farm_id (id, name, region),
      farm_schedules:schedule_id (start_time, end_time)
    `)
    .order(isCreatedDate ? 'created_at' : 'reservation_date', { ascending: false })

  // 농장 필터: farm_admin은 본인 농장, super_admin은 사이드바 farmId > 다중 선택 순
  if (adminProfile.role === 'farm_admin' && adminProfile.farm_id) {
    query = query.eq('farm_id', adminProfile.farm_id)
  } else if (adminProfile.role === 'super_admin') {
    if (farmId) {
      query = query.eq('farm_id', farmId)
    } else if (selectedFarms.length > 0) {
      query = query.in('farm_id', selectedFarms)
    }
  }

  if (status && status !== 'all') {
    const validStatus = status as 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
    query = query.eq('status', validStatus)
  }
  if (date) {
    if (isCreatedDate) {
      // 신청일 기준: 해당 날짜 00:00 ~ 23:59
      query = query.gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`)
    } else {
      query = query.eq('reservation_date', date)
    }
  }
  if (search) {
    query = query.or(`applicant_name.ilike.%${search}%,applicant_phone.ilike.%${search}%`)
  }

  const { data: rawReservations } = await query.limit(100)
  const reservations = (rawReservations ?? []) as unknown as ReservationRow[]

  // 농장 목록
  let farms: { id: string; name: string }[] = []
  if (adminProfile.role === 'super_admin') {
    const { data } = await supabase.from('farms').select('id, name').eq('is_active', true).order('name')
    farms = data ?? []
  } else if (adminProfile.role === 'farm_admin' && adminProfile.farm_id) {
    const { data } = await supabase.from('farms').select('id, name').eq('id', adminProfile.farm_id).maybeSingle()
    if (data) farms = [data]
  }

  // ?no= 예약번호 상세 조회
  let detail: Parameters<typeof ReservationDetailPanel>[0]['detail'] | null = null
  if (no) {
    const { data: raw } = await supabase
      .from('reservations')
      .select('id, reservation_no, applicant_name, applicant_phone, head_count, status, reject_reason, request_memo, reservation_date, start_time, end_time, created_at, schedule_id, farms:farm_id(name, address)')
      .eq('reservation_no', no)
      .maybeSingle()

    if (raw) {
      const r = raw as typeof raw & { farms: { name: string; address: string } | null }

      // 같은 회차 + 날짜의 예약 현황
      const { data: slotRows } = await supabase
        .from('reservations')
        .select('id, applicant_name, head_count, status')
        .eq('schedule_id', r.schedule_id)
        .eq('reservation_date', r.reservation_date)
        .neq('status', 'cancelled')
        .neq('status', 'rejected')

      // 스케줄 최대 정원
      const { data: scheduleRow } = await supabase
        .from('farm_schedules')
        .select('max_capacity')
        .eq('id', r.schedule_id)
        .maybeSingle()

      const others = (slotRows ?? []).filter((s) => s.id !== r.id)
      const confirmedHead = (slotRows ?? []).filter((s) => s.status === 'confirmed').reduce((a, s) => a + s.head_count, 0)
      const pendingHead = (slotRows ?? []).filter((s) => s.status === 'pending').reduce((a, s) => a + s.head_count, 0)

      detail = {
        id: r.id,
        reservation_no: r.reservation_no,
        applicant_name: r.applicant_name,
        applicant_phone: r.applicant_phone,
        head_count: r.head_count,
        status: r.status,
        reject_reason: r.reject_reason,
        request_memo: r.request_memo,
        reservation_date: r.reservation_date,
        start_time: r.start_time,
        end_time: r.end_time,
        created_at: r.created_at,
        farms: r.farms,
        slot: scheduleRow ? {
          maxCapacity: scheduleRow.max_capacity,
          confirmedHead,
          pendingHead,
          otherRows: others.map((o) => ({ applicantName: o.applicant_name, headCount: o.head_count, status: o.status })),
        } : null,
      }
    }
  }

  // 상태별 카운트
  const statusCounts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    rejected: reservations.filter((r) => r.status === 'rejected').length,
  }

  return (
    <>
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-4 md:mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">예약 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            {adminProfile.role === 'super_admin'
              ? farmId
                ? `${farms.find((f) => f.id === farmId)?.name ?? '선택된 농장'} 예약 현황`
                : '전체 농장 예약 현황'
              : '내 농장 예약 현황'}
          </p>
        </div>
        <AdminReservationCreateButton
          farms={farms}
          defaultFarmId={
            adminProfile.role === 'farm_admin'
              ? adminProfile.farm_id ?? undefined
              : farmId ?? undefined
          }
        />
      </div>

      {/* 상태 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: '전체', count: statusCounts.all, color: 'bg-gray-50 text-gray-700' },
          { label: '신청', count: statusCounts.pending, color: 'bg-yellow-50 text-yellow-700' },
          { label: '확정', count: statusCounts.confirmed, color: 'bg-green-50 text-green-700' },
          { label: '거절', count: statusCounts.rejected, color: 'bg-red-50 text-red-700' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-sm font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 탭 */}
      <ReservationViewTabs currentView={currentView} />

      {/* 목록 탭: 필터 */}
      {currentView !== 'slots' && (
        <ReservationFilters
          farms={adminProfile.role === 'super_admin' && !farmId ? farms : []}
          currentStatus={status}
          currentDate={date}
          currentDateType={dateType}
          currentFarms={selectedFarms}
          currentSearch={search}
        />
      )}

      {/* 콘텐츠 */}
      <div className="mt-4">
        {currentView === 'slots' ? (
          <ReservationSlotView reservations={reservations} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {reservations.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>예약 내역이 없습니다.</p>
              </div>
            ) : (
              <>
                {/* 모바일 카드 뷰 */}
                <div className="md:hidden divide-y divide-gray-50">
                  {reservations.map((r) => {
                    const statusKey = r.status as ReservationStatus
                    return (
                      <Link
                        key={r.id}
                        href={`/admin/reservations?no=${r.reservation_no}`}
                        className="block px-4 py-4 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RESERVATION_STATUS_COLORS[statusKey]}`}>
                            {RESERVATION_STATUS_LABELS[statusKey]}
                          </span>
                          <span className="text-xs font-mono text-gray-400">{r.reservation_no}</span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{r.farms?.name}</p>
                          <span className="text-sm font-medium text-gray-600">{r.head_count}명</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {format(new Date(r.reservation_date + 'T00:00:00'), 'M월 d일 (E)', { locale: ko })}
                          {r.farm_schedules && ` · ${r.farm_schedules.start_time.slice(0, 5)}~${r.farm_schedules.end_time.slice(0, 5)}`}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-800 font-medium">{r.applicant_name}</span>
                            <span className="text-xs text-gray-400 ml-2">
                              {r.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{format(new Date(r.created_at), 'M/d HH:mm')}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* 데스크톱 테이블 뷰 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">예약번호</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">농장</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">예약일</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">회차</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">신청자</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">인원</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">상태</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">신청일시</th>
                        <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">처리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reservations.map((r) => {
                        const statusKey = r.status as ReservationStatus
                        return (
                          <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.reservation_no}</td>
                            <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">{r.farms?.name}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {format(new Date(r.reservation_date + 'T00:00:00'), 'M월 d일 (E)', { locale: ko })}
                            </td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                              {r.farm_schedules
                                ? `${r.farm_schedules.start_time.slice(0, 5)}~${r.farm_schedules.end_time.slice(0, 5)}`
                                : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-800">{r.applicant_name}</div>
                              <div className="text-xs text-gray-400">
                                {r.applicant_phone.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700 text-center">{r.head_count}명</td>
                            <td className="px-4 py-3">
                              <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${RESERVATION_STATUS_COLORS[statusKey]}`}>
                                {RESERVATION_STATUS_LABELS[statusKey]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {format(new Date(r.created_at), 'M/d HH:mm')}
                            </td>
                            <td className="px-4 py-3">
                              {r.status === 'pending' && (
                                <ReservationActionButtons reservationId={r.id} />
                              )}
                              {r.reject_reason && (
                                <div className="text-xs text-red-400 mt-1 max-w-24 truncate" title={r.reject_reason}>
                                  사유: {r.reject_reason}
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>

    {/* 예약 상세 패널 */}
    {detail && <ReservationDetailPanel detail={detail} />}
    </>
  )
}
