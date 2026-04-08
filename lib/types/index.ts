import type { Database } from './database'

export type Farm = Database['public']['Tables']['farms']['Row']
export type Program = Database['public']['Tables']['programs']['Row']
export type FarmProgram = Database['public']['Tables']['farm_programs']['Row']
export type FarmSchedule = Database['public']['Tables']['farm_schedules']['Row']
export type Reservation = Database['public']['Tables']['reservations']['Row']
export type PhoneVerification = Database['public']['Tables']['phone_verifications']['Row']
export type AdminProfile = Database['public']['Tables']['admin_profiles']['Row']
export type ReservationLog = Database['public']['Tables']['reservation_logs']['Row']

export type ReservationStatus = Reservation['status']
export type AdminRole = AdminProfile['role']

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: '예약 신청',
  confirmed: '예약 확정',
  rejected: '예약 거절',
  cancelled: '취소',
  completed: '체험 완료',
}

export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  completed: 'bg-blue-100 text-blue-800',
}

// 예약 신청 폼 타입
export interface ReservationFormData {
  farmId: string
  scheduleId: string
  reservationDate: string
  headCount: number
  applicantName: string
  applicantPhone: string
  requestMemo?: string
  privacyAgreed: boolean
}

// 프로그램+스케줄 묶음 (농장 상세, 예약 폼에서 사용)
export interface FarmProgramWithSchedules extends FarmProgram {
  programs: Program
  farm_schedules: FarmSchedule[]
}

// 농장 상세 (프로그램 > 스케줄 구조)
export interface FarmWithSchedules extends Farm {
  farm_programs: FarmProgramWithSchedules[]
}

// 회차별 예약 현황
export interface ScheduleCapacity {
  scheduleId: string
  date: string
  confirmedCount: number
  pendingCount: number
  maxCapacity: number
  recommendedCapacity: number
  isAvailable: boolean
  isOverRecommended: boolean
}
