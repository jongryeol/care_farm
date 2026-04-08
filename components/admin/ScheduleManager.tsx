'use client'

import { useState } from 'react'
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { DAY_OF_WEEK_LABELS } from '@/lib/types'

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] // 월~일
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

interface Schedule {
  id: string
  farm_program_id: string
  year: number
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

interface ScheduleRow {
  day_of_week: number
  start_time: string
  end_time: string
  max_capacity: number
}

interface AddFormState {
  year: number
  month: number
  rows: ScheduleRow[]
}

const defaultRow = (): ScheduleRow => ({
  day_of_week: 1,
  start_time: '10:00',
  end_time: '12:00',
  max_capacity: 12,
})

/**
 * 스케줄 목록을 연도 > 월로 2단 그룹핑
 * Map<year, Map<month, Schedule[]>>
 */
function groupByYearMonth(schedules: Schedule[]): [number, [number, Schedule[]][]][] {
  const yearMap = new Map<number, Map<number, Schedule[]>>()

  for (const s of schedules) {
    if (!yearMap.has(s.year)) yearMap.set(s.year, new Map())
    const monthMap = yearMap.get(s.year)!
    for (const m of s.available_months) {
      if (!monthMap.has(m)) monthMap.set(m, [])
      monthMap.get(m)!.push(s)
    }
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, monthMap]) => [
      year,
      Array.from(monthMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([month, list]) => [
          month,
          list.slice().sort((a, b) => a.day_of_week - b.day_of_week),
        ] as [number, Schedule[]]),
    ])
}

export default function ScheduleManager({ groups }: { groups: FarmProgramGroup[] }) {
  const [data, setData] = useState<FarmProgramGroup[]>(groups)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g) => [g.id, true]))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [addForm, setAddForm] = useState<Record<string, AddFormState | null>>({})

  /* ── 추가 폼 헬퍼 ── */
  function openAddForm(fpId: string) {
    const now = new Date()
    setAddForm((prev) => ({
      ...prev,
      [fpId]: { year: now.getFullYear(), month: now.getMonth() + 1, rows: [defaultRow()] },
    }))
  }
  function closeAddForm(fpId: string) {
    setAddForm((prev) => ({ ...prev, [fpId]: null }))
  }
  function updateForm(fpId: string, patch: Partial<AddFormState>) {
    setAddForm((prev) => {
      const cur = prev[fpId]; if (!cur) return prev
      return { ...prev, [fpId]: { ...cur, ...patch } }
    })
  }
  function updateRow(fpId: string, idx: number, patch: Partial<ScheduleRow>) {
    setAddForm((prev) => {
      const cur = prev[fpId]; if (!cur) return prev
      return { ...prev, [fpId]: { ...cur, rows: cur.rows.map((r, i) => i === idx ? { ...r, ...patch } : r) } }
    })
  }
  function addRow(fpId: string) {
    setAddForm((prev) => {
      const cur = prev[fpId]; if (!cur) return prev
      return { ...prev, [fpId]: { ...cur, rows: [...cur.rows, defaultRow()] } }
    })
  }
  function removeRow(fpId: string, idx: number) {
    setAddForm((prev) => {
      const cur = prev[fpId]; if (!cur || cur.rows.length <= 1) return prev
      return { ...prev, [fpId]: { ...cur, rows: cur.rows.filter((_, i) => i !== idx) } }
    })
  }

  /* ── API 핸들러 ── */
  async function handleSubmitAdd(fpId: string) {
    const form = addForm[fpId]; if (!form) return
    setSaving((s) => ({ ...s, [`add_${fpId}`]: true }))
    try {
      const created: Schedule[] = []
      for (const row of form.rows) {
        const res = await fetch('/api/admin/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farm_program_id: fpId,
            year: form.year,
            day_of_week: row.day_of_week,
            start_time: row.start_time,
            end_time: row.end_time,
            max_capacity: row.max_capacity,
            recommended_capacity: Math.floor(row.max_capacity * 0.8),
            available_months: [form.month],
          }),
        })
        const json = await res.json()
        if (!res.ok) { toast.error(json.error || '추가에 실패했습니다.'); return }
        created.push(json.schedule)
      }
      setData((prev) => prev.map((g) =>
        g.id !== fpId ? g : { ...g, schedules: [...g.schedules, ...created] }
      ))
      closeAddForm(fpId)
      toast.success(`${form.year}년 ${form.month}월 회차 ${created.length}개가 추가되었습니다.`)
    } finally {
      setSaving((s) => ({ ...s, [`add_${fpId}`]: false }))
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
          schedules: g.schedules.map((s) => s.id !== scheduleId ? s : { ...s, is_active: !current }),
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

  return (
    <div className="space-y-6">
      {data.map((group) => {
        const form = addForm[group.id]
        const isAdding = !!form
        const yearGroups = groupByYearMonth(group.schedules)

        return (
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
              {expanded[group.id]
                ? <ChevronUp className="w-4 h-4 text-gray-400" />
                : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {expanded[group.id] && (
              <div className="border-t border-gray-100 px-6 py-4 space-y-6">
                {/* 등록된 회차 없음 */}
                {yearGroups.length === 0 && !isAdding && (
                  <p className="text-sm text-gray-400 py-2">등록된 회차가 없습니다.</p>
                )}

                {/* 연도 > 월 2단 그룹 */}
                {yearGroups.map(([year, monthGroups]) => (
                  <div key={year}>
                    {/* 연도 헤더 */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-gray-800">{year}년</span>
                      <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    <div className="space-y-4 pl-2">
                      {monthGroups.map(([month, schedules]) => (
                        <div key={month}>
                          {/* 월 헤더 */}
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                            {MONTH_NAMES[month - 1]}
                          </div>

                          {/* 회차 행들 */}
                          <div className="space-y-2">
                            {schedules.map((s) => (
                              <div
                                key={s.id}
                                className={`flex items-center gap-3 flex-wrap bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 transition-opacity ${!s.is_active ? 'opacity-50' : ''}`}
                              >
                                <div className="min-w-[64px]">
                                  <div className="text-xs text-gray-400 mb-0.5">요일</div>
                                  <div className="text-sm font-medium text-gray-800">
                                    {DAY_OF_WEEK_LABELS[s.day_of_week]}요일
                                  </div>
                                </div>
                                <div className="min-w-[110px]">
                                  <div className="text-xs text-gray-400 mb-0.5">시간</div>
                                  <div className="text-sm text-gray-700">
                                    {s.start_time.slice(0, 5)} ~ {s.end_time.slice(0, 5)}
                                  </div>
                                </div>
                                <div className="min-w-[64px]">
                                  <div className="text-xs text-gray-400 mb-0.5">최대 인원</div>
                                  <div className="text-sm text-gray-700">{s.max_capacity}명</div>
                                </div>

                                {/* 해당 월 외 추가 월 배지 */}
                                {s.available_months.length > 1 && (
                                  <div className="flex flex-wrap gap-1">
                                    {s.available_months
                                      .filter((m) => m !== month)
                                      .map((m) => (
                                        <span key={m} className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                          +{MONTH_NAMES[m - 1]}
                                        </span>
                                      ))}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 ml-auto">
                                  <button
                                    onClick={() => handleToggleActive(s.id, group.id, s.is_active)}
                                    disabled={saving[s.id]}
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
                                      s.is_active
                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                  >
                                    {saving[s.id] && <Loader2 className="w-3 h-3 animate-spin" />}
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
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* ── 추가 폼 ── */}
                {isAdding && form && (
                  <div className="rounded-xl border border-green-200 bg-green-50/60 px-5 py-4">
                    {/* 연도 + 월 선택 */}
                    <div className="flex items-end gap-3 mb-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">운영 연도</label>
                        <select
                          value={form.year}
                          onChange={(e) => updateForm(group.id, { year: Number(e.target.value) })}
                          className={selectCls}
                        >
                          {YEAR_OPTIONS.map((y) => (
                            <option key={y} value={y}>{y}년</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">운영 월</label>
                        <select
                          value={form.month}
                          onChange={(e) => updateForm(group.id, { month: Number(e.target.value) })}
                          className={selectCls}
                        >
                          {MONTH_NAMES.map((name, i) => (
                            <option key={i + 1} value={i + 1}>{name}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-sm font-semibold text-green-700 pb-1.5">
                        {form.year}년 {form.month}월
                      </span>
                    </div>

                    {/* 회차 행 목록 */}
                    <div className="space-y-2 mb-3">
                      {form.rows.map((row, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 flex-wrap bg-white rounded-xl border border-gray-200 px-4 py-3"
                        >
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">요일</label>
                            <select
                              value={row.day_of_week}
                              onChange={(e) => updateRow(group.id, idx, { day_of_week: Number(e.target.value) })}
                              className={selectCls}
                            >
                              {DAY_ORDER.map((d) => (
                                <option key={d} value={d}>{DAY_OF_WEEK_LABELS[d]}요일</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">시작</label>
                            <input
                              type="time"
                              value={row.start_time}
                              onChange={(e) => updateRow(group.id, idx, { start_time: e.target.value })}
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">종료</label>
                            <input
                              type="time"
                              value={row.end_time}
                              onChange={(e) => updateRow(group.id, idx, { end_time: e.target.value })}
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">최대 인원</label>
                            <input
                              type="number"
                              min={1}
                              max={200}
                              value={row.max_capacity}
                              onChange={(e) => updateRow(group.id, idx, { max_capacity: Number(e.target.value) })}
                              className={`${inputCls} w-20`}
                            />
                          </div>
                          {form.rows.length > 1 && (
                            <button
                              onClick={() => removeRow(group.id, idx)}
                              className="mt-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addRow(group.id)}
                      className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium mb-4"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      회차 추가
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmitAdd(group.id)}
                        disabled={saving[`add_${group.id}`]}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-40"
                      >
                        {saving[`add_${group.id}`] && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        저장
                      </button>
                      <button
                        onClick={() => closeAddForm(group.id)}
                        className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}

                {!isAdding && (
                  <button
                    onClick={() => openAddForm(group.id)}
                    className="flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    추가하기
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const selectCls = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500'
const inputCls = 'border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
