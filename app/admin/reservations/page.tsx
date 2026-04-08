import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '@/lib/types'
import type { AdminProfile, Reservation, ReservationStatus } from '@/lib/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import ReservationActionButtons from '@/components/admin/ReservationActionButtons'
import ReservationFilters from '@/components/admin/ReservationFilters'

interface SearchParams {
  status?: string
  date?: string
  farm?: string
  search?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

type ReservationRow = Reservation & {
  farms: { id: string; name: string; region: string } | null
  farm_schedules: { start_time: string; end_time: string } | null
}

export default async function AdminReservationsPage({ searchParams }: Props) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profileData } = await supabase
    .from('admin_profiles')
    .select('id, name, role, farm_id, created_at, updated_at')
    .eq('id', user!.id)
    .maybeSingle()

  if (!profileData) redirect('/admin/login')
  const adminProfile = profileData as AdminProfile

  const params = await searchParams
  const { status, date, farm: farmFilter, search } = params

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
    .order('created_at', { ascending: false })

  // 농장관리자는 본인 농장만 조회
  if (adminProfile.role === 'farm_admin' && adminProfile.farm_id) {
    query = query.eq('farm_id', adminProfile.farm_id)
  } else if (adminProfile.role === 'super_admin' && farmFilter) {
    query = query.eq('farm_id', farmFilter)
  }

  if (status && status !== 'all') {
    const validStatus = status as 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed'
    query = query.eq('status', validStatus)
  }
  if (date) query = query.eq('reservation_date', date)
  if (search) {
    query = query.or(`applicant_name.ilike.%${search}%,applicant_phone.ilike.%${search}%`)
  }

  const { data: rawReservations } = await query.limit(100)
  const reservations = (rawReservations ?? []) as unknown as ReservationRow[]

  // 농장 목록 (슈퍼관리자용 필터)
  let farms: { id: string; name: string }[] = []
  if (adminProfile.role === 'super_admin') {
    const { data } = await supabase.from('farms').select('id, name').eq('is_active', true).order('name')
    farms = data ?? []
  }

  // 상태별 카운트
  const statusCounts = {
    all: reservations.length,
    pending: reservations.filter((r) => r.status === 'pending').length,
    confirmed: reservations.filter((r) => r.status === 'confirmed').length,
    rejected: reservations.filter((r) => r.status === 'rejected').length,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">예약 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          {adminProfile.role === 'super_admin' ? '전체 농장 예약 현황' : '내 농장 예약 현황'}
        </p>
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

      {/* 필터 */}
      <ReservationFilters
        farms={adminProfile.role === 'super_admin' ? farms : []}
        currentStatus={status}
        currentDate={date}
        currentFarm={farmFilter}
        currentSearch={search}
      />

      {/* 예약 목록 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-4">
        {reservations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>예약 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
        )}
      </div>
    </div>
  )
}
