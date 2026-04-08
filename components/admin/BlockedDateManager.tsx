'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2, Ban } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { DAY_OF_WEEK_LABELS } from '@/lib/types'

interface BlockedRow {
  id: string
  farm_schedule_id: string | null
  farm_program_id: string | null
  blocked_date: string
  reason: string | null
  farm_schedules: { day_of_week: number; start_time: string; end_time: string } | null
}

interface FarmProgramOption {
  id: string
  farmName: string
  programTitle: string
  schedules: { id: string; day_of_week: number; start_time: string; end_time: string }[]
}

interface Props {
  initialBlocked: BlockedRow[]
  farmPrograms: FarmProgramOption[]
}

export default function BlockedDateManager({ initialBlocked, farmPrograms }: Props) {
  const [blocked, setBlocked] = useState<BlockedRow[]>(initialBlocked)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    farm_program_id: farmPrograms[0]?.id ?? '',
    farm_schedule_id: '',  // '' = 전체 차단
    blocked_date: '',
    reason: '',
  })

  const selectedProgram = farmPrograms.find((fp) => fp.id === form.farm_program_id)

  async function handleAdd() {
    if (!form.farm_program_id || !form.blocked_date) {
      toast.error('프로그램과 날짜를 선택해 주세요.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_program_id: form.farm_program_id,
          farm_schedule_id: form.farm_schedule_id || null,
          blocked_date: form.blocked_date,
          reason: form.reason || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '추가에 실패했습니다.'); return }

      // 반환된 데이터에 schedule 정보를 추가
      const schedule = form.farm_schedule_id
        ? selectedProgram?.schedules.find((s) => s.id === form.farm_schedule_id) ?? null
        : null
      const newRow: BlockedRow = {
        ...data.blocked,
        farm_schedules: schedule ? {
          day_of_week: schedule.day_of_week,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        } : null,
      }
      setBlocked((b) => [newRow, ...b])
      setForm((f) => ({ ...f, blocked_date: '', reason: '', farm_schedule_id: '' }))
      setShowForm(false)
      toast.success('예약 차단이 추가되었습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 차단을 해제하시겠습니까?')) return
    setDeleting((d) => ({ ...d, [id]: true }))
    try {
      const res = await fetch(`/api/admin/blocked-dates/${id}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('삭제에 실패했습니다.'); return }
      setBlocked((b) => b.filter((row) => row.id !== id))
      toast.success('차단이 해제되었습니다.')
    } finally {
      setDeleting((d) => ({ ...d, [id]: false }))
    }
  }

  function getFarmProgramLabel(fpId: string | null) {
    if (!fpId) return '-'
    const fp = farmPrograms.find((f) => f.id === fpId)
    return fp ? `${fp.farmName} / ${fp.programTitle}` : fpId
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">예약 차단 날짜</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          차단 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">프로그램</label>
              <select
                value={form.farm_program_id}
                onChange={(e) => setForm((f) => ({ ...f, farm_program_id: e.target.value, farm_schedule_id: '' }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm min-w-[200px]"
              >
                {farmPrograms.map((fp) => (
                  <option key={fp.id} value={fp.id}>
                    {fp.farmName} / {fp.programTitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">날짜</label>
              <input
                type="date"
                value={form.blocked_date}
                onChange={(e) => setForm((f) => ({ ...f, blocked_date: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">회차 (선택, 미선택 시 전체 차단)</label>
              <select
                value={form.farm_schedule_id}
                onChange={(e) => setForm((f) => ({ ...f, farm_schedule_id: e.target.value }))}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm min-w-[180px]"
              >
                <option value="">전체 차단</option>
                {selectedProgram?.schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {DAY_OF_WEEK_LABELS[s.day_of_week]}요일 {s.start_time.slice(0,5)}~{s.end_time.slice(0,5)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">사유 (선택)</label>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="예: 농장 행사"
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-36"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={saving}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 flex items-center gap-1"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                차단 추가
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 차단 목록 */}
      {blocked.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <Ban className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">차단된 날짜가 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {blocked.map((row) => {
            const dateLabel = (() => {
              try { return format(new Date(row.blocked_date + 'T00:00:00'), 'yyyy년 M월 d일 (E)', { locale: ko }) }
              catch { return row.blocked_date }
            })()
            const scheduleLabel = row.farm_schedules
              ? `${DAY_OF_WEEK_LABELS[row.farm_schedules.day_of_week]}요일 ${row.farm_schedules.start_time.slice(0,5)}~${row.farm_schedules.end_time.slice(0,5)}`
              : '전체 회차'
            return (
              <div key={row.id} className="px-6 py-3 flex items-center gap-4">
                <Ban className="w-4 h-4 text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{dateLabel}</div>
                  <div className="text-xs text-gray-500">
                    {getFarmProgramLabel(row.farm_program_id)} · {scheduleLabel}
                    {row.reason && <span className="ml-1 text-red-500">({row.reason})</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(row.id)}
                  disabled={deleting[row.id]}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  {deleting[row.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
