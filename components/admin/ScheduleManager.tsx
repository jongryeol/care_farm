'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { DAY_OF_WEEK_LABELS } from '@/lib/types'

const MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]
const ALL_DAYS = [0,1,2,3,4,5,6]
const DAY_ORDER = [1,2,3,4,5,6,0] // 월~일 순

interface Schedule {
  id: string
  farm_program_id: string
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
  recommended_capacity: number
  available_months: number[]
  is_active: boolean
}

interface FarmProgramGroup {
  id: string
  farmName: string
  programTitle: string
  schedules: Schedule[]
}

export default function ScheduleManager({ groups }: { groups: FarmProgramGroup[] }) {
  const [data, setData] = useState<FarmProgramGroup[]>(groups)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g) => [g.id, true]))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [showAddForm, setShowAddForm] = useState<Record<string, boolean>>({})

  // 새 스케줄 폼 초기값
  const [newSchedule, setNewSchedule] = useState<Record<string, {
    day_of_week: number
    start_time: string
    end_time: string
    max_capacity: number
    available_months: number[]
  }>>({})

  async function handleToggleMonth(scheduleId: string, fpId: string, month: number, current: number[]) {
    const next = current.includes(month)
      ? current.filter((m) => m !== month)
      : [...current, month].sort((a, b) => a - b)

    setSaving((s) => ({ ...s, [scheduleId]: true }))
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available_months: next }),
      })
      if (!res.ok) { toast.error('저장에 실패했습니다.'); return }
      setData((prev) => prev.map((g) =>
        g.id !== fpId ? g : {
          ...g,
          schedules: g.schedules.map((s) =>
            s.id !== scheduleId ? s : { ...s, available_months: next }
          )
        }
      ))
    } finally {
      setSaving((s) => ({ ...s, [scheduleId]: false }))
    }
  }

  async function handleToggleActive(scheduleId: string, fpId: string, current: boolean) {
    setSaving((s) => ({ ...s, [scheduleId]: true }))
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      if (!res.ok) { toast.error('저장에 실패했습니다.'); return }
      setData((prev) => prev.map((g) =>
        g.id !== fpId ? g : {
          ...g,
          schedules: g.schedules.map((s) =>
            s.id !== scheduleId ? s : { ...s, is_active: !current }
          )
        }
      ))
      toast.success(!current ? '회차가 활성화되었습니다.' : '회차가 비활성화되었습니다.')
    } finally {
      setSaving((s) => ({ ...s, [scheduleId]: false }))
    }
  }

  async function handleDelete(scheduleId: string, fpId: string) {
    if (!confirm('이 회차를 삭제하시겠습니까?')) return
    setSaving((s) => ({ ...s, [scheduleId]: true }))
    try {
      const res = await fetch(`/api/admin/schedules/${scheduleId}`, { method: 'DELETE' })
      if (!res.ok) { toast.error('삭제에 실패했습니다.'); return }
      setData((prev) => prev.map((g) =>
        g.id !== fpId ? g : { ...g, schedules: g.schedules.filter((s) => s.id !== scheduleId) }
      ))
      toast.success('회차가 삭제되었습니다.')
    } finally {
      setSaving((s) => ({ ...s, [scheduleId]: false }))
    }
  }

  async function handleAddSchedule(fpId: string) {
    const form = newSchedule[fpId]
    if (!form) return
    setSaving((s) => ({ ...s, [`add_${fpId}`]: true }))
    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_program_id: fpId,
          day_of_week: form.day_of_week,
          start_time: form.start_time,
          end_time: form.end_time,
          max_capacity: form.max_capacity,
          recommended_capacity: Math.floor(form.max_capacity * 0.8),
          available_months: form.available_months,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || '추가에 실패했습니다.'); return }
      setData((prev) => prev.map((g) =>
        g.id !== fpId ? g : { ...g, schedules: [...g.schedules, json.schedule] }
      ))
      setNewSchedule((n) => { const next = { ...n }; delete next[fpId]; return next })
      setShowAddForm((n) => ({ ...n, [fpId]: false }))
      toast.success('회차가 추가되었습니다.')
    } finally {
      setSaving((s) => ({ ...s, [`add_${fpId}`]: false }))
    }
  }

  function initAddForm(fpId: string) {
    setNewSchedule((n) => ({
      ...n,
      [fpId]: { day_of_week: 1, start_time: '10:00', end_time: '12:00', max_capacity: 12, available_months: [] },
    }))
    setShowAddForm((s) => ({ ...s, [fpId]: true }))
  }

  return (
    <div className="space-y-6">
      {data.map((group) => (
        <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* 그룹 헤더 */}
          <button
            onClick={() => setExpanded((e) => ({ ...e, [group.id]: !e[group.id] }))}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <div className="text-left">
              <div className="text-xs text-gray-400">{group.farmName}</div>
              <div className="font-semibold text-gray-900">{group.programTitle}</div>
            </div>
            {expanded[group.id] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expanded[group.id] && (
            <div className="border-t border-gray-100">
              {/* 스케줄 목록 */}
              {group.schedules.length === 0 && (
                <p className="px-6 py-4 text-sm text-gray-400">등록된 회차가 없습니다.</p>
              )}
              {group.schedules.map((s) => (
                <div key={s.id} className={`px-6 py-4 border-b border-gray-50 last:border-0 ${!s.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start gap-4 flex-wrap">
                    {/* 요일·시간 */}
                    <div className="min-w-[110px]">
                      <div className="text-xs text-gray-400 mb-0.5">요일·시간</div>
                      <div className="font-medium text-gray-800 text-sm">
                        {DAY_OF_WEEK_LABELS[s.day_of_week]}요일
                      </div>
                      <div className="text-xs text-gray-500">{s.start_time.slice(0,5)}~{s.end_time.slice(0,5)}</div>
                    </div>

                    {/* 정원 */}
                    <div className="min-w-[60px]">
                      <div className="text-xs text-gray-400 mb-0.5">최대 인원</div>
                      <div className="text-sm text-gray-700">{s.max_capacity}명</div>
                    </div>

                    {/* 운영 월 체크박스 */}
                    <div className="flex-1 min-w-[240px]">
                      <div className="text-xs text-gray-400 mb-1.5">운영 월</div>
                      <div className="flex flex-wrap gap-1.5">
                        {MONTHS.map((m) => {
                          const checked = s.available_months.includes(m)
                          const isSaving = saving[s.id]
                          return (
                            <button
                              key={m}
                              onClick={() => handleToggleMonth(s.id, group.id, m, s.available_months)}
                              disabled={isSaving}
                              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                checked
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              } disabled:opacity-50`}
                            >
                              {m}월
                            </button>
                          )
                        })}
                        {saving[s.id] && <Loader2 className="w-4 h-4 animate-spin text-gray-400 self-center" />}
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => handleToggleActive(s.id, group.id, s.is_active)}
                        disabled={saving[s.id]}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          s.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {s.is_active ? '활성' : '비활성'}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, group.id)}
                        disabled={saving[s.id]}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* 회차 추가 폼 */}
              {showAddForm[group.id] && newSchedule[group.id] && (
                <div className="px-6 py-4 bg-green-50 border-t border-green-100">
                  <div className="text-sm font-medium text-gray-700 mb-3">새 회차 추가</div>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">요일</label>
                      <select
                        value={newSchedule[group.id].day_of_week}
                        onChange={(e) => setNewSchedule((n) => ({
                          ...n, [group.id]: { ...n[group.id], day_of_week: Number(e.target.value) }
                        }))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      >
                        {DAY_ORDER.map((d) => (
                          <option key={d} value={d}>{DAY_OF_WEEK_LABELS[d]}요일</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">시작</label>
                      <input
                        type="time"
                        value={newSchedule[group.id].start_time}
                        onChange={(e) => setNewSchedule((n) => ({
                          ...n, [group.id]: { ...n[group.id], start_time: e.target.value }
                        }))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">종료</label>
                      <input
                        type="time"
                        value={newSchedule[group.id].end_time}
                        onChange={(e) => setNewSchedule((n) => ({
                          ...n, [group.id]: { ...n[group.id], end_time: e.target.value }
                        }))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">최대 인원</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={newSchedule[group.id].max_capacity}
                        onChange={(e) => setNewSchedule((n) => ({
                          ...n, [group.id]: { ...n[group.id], max_capacity: Number(e.target.value) }
                        }))}
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">운영 월</label>
                      <div className="flex gap-1">
                        {MONTHS.map((m) => {
                          const checked = newSchedule[group.id].available_months.includes(m)
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setNewSchedule((n) => {
                                const cur = n[group.id].available_months
                                const next = checked ? cur.filter((x) => x !== m) : [...cur, m].sort((a,b)=>a-b)
                                return { ...n, [group.id]: { ...n[group.id], available_months: next } }
                              })}
                              className={`w-7 h-7 rounded text-xs font-medium ${
                                checked ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-500'
                              }`}
                            >
                              {m}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddSchedule(group.id)}
                        disabled={saving[`add_${group.id}`] || newSchedule[group.id].available_months.length === 0}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-40 flex items-center gap-1"
                      >
                        {saving[`add_${group.id}`] && <Loader2 className="w-3 h-3 animate-spin" />}
                        추가
                      </button>
                      <button
                        onClick={() => setShowAddForm((s) => ({ ...s, [group.id]: false }))}
                        className="px-3 py-1.5 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 회차 추가 버튼 */}
              {!showAddForm[group.id] && (
                <div className="px-6 py-3 border-t border-gray-50">
                  <button
                    onClick={() => initAddForm(group.id)}
                    className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    회차 추가
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
