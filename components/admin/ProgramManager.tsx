'use client'

import { useState } from 'react'
import { Loader2, Pencil, Clock, Users, BookOpen, ChevronDown, ChevronUp, Plus, X, Trash2, AlertTriangle, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'

interface ProgramRow {
  id: string
  title: string
  description: string | null
  target_audience: string | null
  process_description: string | null
  duration_minutes: number | null
  notice: string | null
  image_url: string | null
  is_active: boolean
}

interface ProgramItem {
  farmProgramId: string
  farmProgramActive: boolean
  minAdvanceDays: number
  farmId: string
  farmName: string | null
  program: ProgramRow
}

interface Farm {
  id: string
  name: string
}

interface Props {
  items: ProgramItem[]
  isSuperAdmin: boolean
  farms: Farm[]
  defaultFarmId: string | null
}

interface EditForm {
  title: string
  description: string
  target_audience: string
  process_description: string
  duration_minutes: string
  notice: string
}

interface AddForm extends EditForm {
  farmId: string
}

const emptyEditForm: EditForm = {
  title: '',
  description: '',
  target_audience: '',
  process_description: '',
  duration_minutes: '',
  notice: '',
}

function toForm(p: ProgramRow): EditForm {
  return {
    title: p.title,
    description: p.description ?? '',
    target_audience: p.target_audience ?? '',
    process_description: p.process_description ?? '',
    duration_minutes: p.duration_minutes?.toString() ?? '',
    notice: p.notice ?? '',
  }
}

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
const textareaCls = `${inputCls} resize-none`

export default function ProgramManager({ items, isSuperAdmin, farms, defaultFarmId }: Props) {
  const [data, setData] = useState<ProgramItem[]>(items)
  const [editing, setEditing] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.farmProgramId, true]))
  )
  const [form, setForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingFp, setTogglingFp] = useState<string | null>(null)

  // 삭제 확인 모달
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 최소 예약 선행일 인라인 편집
  const [editingAdvanceId, setEditingAdvanceId] = useState<string | null>(null)
  const [advanceInput, setAdvanceInput] = useState('')
  const [savingAdvance, setSavingAdvance] = useState(false)

  function startEditAdvance(farmProgramId: string, current: number) {
    setEditingAdvanceId(farmProgramId)
    setAdvanceInput(String(current))
  }

  async function handleSaveAdvance(farmProgramId: string) {
    const days = Math.max(0, parseInt(advanceInput, 10) || 0)
    setSavingAdvance(true)
    try {
      const res = await fetch(`/api/admin/farm-programs/${farmProgramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_advance_days: days }),
      })
      if (!res.ok) { toast.error('저장에 실패했습니다.'); return }
      setData((prev) =>
        prev.map((item) =>
          item.farmProgramId === farmProgramId ? { ...item, minAdvanceDays: days } : item
        )
      )
      setEditingAdvanceId(null)
      toast.success('예약 가능일 설정이 저장되었습니다.')
    } finally {
      setSavingAdvance(false)
    }
  }

  async function handleDelete(farmProgramId: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/farm-programs/${farmProgramId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || '삭제에 실패했습니다.'); return }
      setData((prev) => prev.filter((item) => item.farmProgramId !== farmProgramId))
      setConfirmDeleteId(null)
      toast.success('프로그램이 삭제되었습니다.')
    } finally {
      setDeleting(false)
    }
  }

  // 프로그램 추가 모달
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState<AddForm>({ ...emptyEditForm, farmId: defaultFarmId ?? '' })
  const [adding, setAdding] = useState(false)

  function startEdit(item: ProgramItem) {
    setEditing(item.program.id)
    setForm(toForm(item.program))
  }

  function cancelEdit() {
    setEditing(null)
    setForm(null)
  }

  async function handleSave(programId: string) {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          target_audience: form.target_audience || null,
          process_description: form.process_description || null,
          duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
          notice: form.notice || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || '저장에 실패했습니다.'); return }

      setData((prev) =>
        prev.map((item) =>
          item.program.id === programId
            ? { ...item, program: { ...item.program, ...json.program } }
            : item
        )
      )
      setEditing(null)
      setForm(null)
      toast.success('프로그램이 저장되었습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleFpActive(farmProgramId: string, current: boolean) {
    setTogglingFp(farmProgramId)
    try {
      const res = await fetch(`/api/admin/farm-programs/${farmProgramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      if (!res.ok) { toast.error('변경에 실패했습니다.'); return }
      setData((prev) =>
        prev.map((item) =>
          item.farmProgramId === farmProgramId
            ? { ...item, farmProgramActive: !current }
            : item
        )
      )
      toast.success(!current ? '프로그램이 활성화되었습니다.' : '프로그램이 비활성화되었습니다.')
    } finally {
      setTogglingFp(null)
    }
  }

  function openAddModal() {
    setAddForm({ ...emptyEditForm, farmId: defaultFarmId ?? '' })
    setShowAddModal(true)
  }

  async function handleAdd() {
    if (!addForm.title.trim()) { toast.error('프로그램명을 입력하세요.'); return }
    if (!addForm.farmId) { toast.error('농장을 선택하세요.'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId: addForm.farmId,
          title: addForm.title,
          description: addForm.description || null,
          target_audience: addForm.target_audience || null,
          process_description: addForm.process_description || null,
          duration_minutes: addForm.duration_minutes ? Number(addForm.duration_minutes) : null,
          notice: addForm.notice || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || '추가에 실패했습니다.'); return }

      const farm = farms.find((f) => f.id === addForm.farmId)
      const newItem: ProgramItem = {
        farmProgramId: json.farmProgramId,
        farmProgramActive: true,
        minAdvanceDays: 0,
        farmId: addForm.farmId,
        farmName: farm?.name ?? null,
        program: json.program,
      }
      setData((prev) => [newItem, ...prev])
      setExpanded((e) => ({ ...e, [json.farmProgramId]: true }))
      setShowAddModal(false)
      toast.success('프로그램이 추가되었습니다.')
    } finally {
      setAdding(false)
    }
  }

  const showFarmName = isSuperAdmin && !defaultFarmId

  return (
    <>
      {/* 추가 버튼 (super_admin 전용) */}
      {isSuperAdmin && (
        <div className="flex justify-end mb-4">
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            프로그램 추가
          </button>
        </div>
      )}

      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          등록된 프로그램이 없습니다.
          {isSuperAdmin && (
            <div className="mt-3">
              <button onClick={openAddModal} className="text-green-600 hover:underline text-sm">
                프로그램 추가하기
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((item) => {
            const { farmProgramId, farmProgramActive, program } = item
            const isEditing = editing === program.id
            const isExpanded = expanded[farmProgramId]

            return (
              <div
                key={farmProgramId}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-opacity ${
                  !farmProgramActive ? 'opacity-60 border-gray-100' : 'border-gray-100'
                }`}
              >
                {/* 카드 헤더 */}
                <div className="px-6 py-4 flex items-center justify-between">
                  <button
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => setExpanded((e) => ({ ...e, [farmProgramId]: !e[farmProgramId] }))}
                  >
                    <BookOpen className="w-4 h-4 text-green-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{program.title}</span>
                        {showFarmName && item.farmName && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {item.farmName}
                          </span>
                        )}
                      </div>
                      {program.duration_minutes && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {program.duration_minutes}분
                          {program.target_audience && (
                            <>
                              <span className="mx-1">·</span>
                              <Users className="w-3 h-3" />
                              {program.target_audience}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                    )}
                  </button>

                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => handleToggleFpActive(farmProgramId, farmProgramActive)}
                      disabled={togglingFp === farmProgramId}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1 ${
                        farmProgramActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {togglingFp === farmProgramId && <Loader2 className="w-3 h-3 animate-spin" />}
                      {farmProgramActive ? '활성' : '비활성'}
                    </button>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(item)}
                        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        편집
                      </button>
                    )}
                    {isSuperAdmin && (
                      <button
                        onClick={() => setConfirmDeleteId(farmProgramId)}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 펼침 내용 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-6 py-5 space-y-5">
                    {isEditing && form ? (
                      <EditFormView
                        form={form}
                        onChange={(key, value) => setForm((f) => f ? { ...f, [key]: value } : f)}
                        onSave={() => handleSave(program.id)}
                        onCancel={cancelEdit}
                        saving={saving}
                      />
                    ) : (
                      <ViewContent program={program} />
                    )}

                    {/* 최소 예약 선행일 (super_admin 전용) */}
                    {isSuperAdmin && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <CalendarClock className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-xs font-medium text-gray-500">최소 예약 가능일</span>
                          {editingAdvanceId === farmProgramId ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={365}
                                value={advanceInput}
                                onChange={(e) => setAdvanceInput(e.target.value)}
                                className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveAdvance(farmProgramId)
                                  if (e.key === 'Escape') setEditingAdvanceId(null)
                                }}
                                autoFocus
                              />
                              <span className="text-xs text-gray-500">일 전부터 예약 가능</span>
                              <button
                                onClick={() => handleSaveAdvance(farmProgramId)}
                                disabled={savingAdvance}
                                className="px-2.5 py-1 bg-green-700 text-white text-xs rounded-lg hover:bg-green-800 disabled:opacity-40 flex items-center gap-1"
                              >
                                {savingAdvance && <Loader2 className="w-3 h-3 animate-spin" />}
                                저장
                              </button>
                              <button
                                onClick={() => setEditingAdvanceId(null)}
                                className="px-2.5 py-1 border border-gray-200 text-xs rounded-lg text-gray-600 hover:bg-gray-50"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${item.minAdvanceDays > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                {item.minAdvanceDays > 0 ? `${item.minAdvanceDays}일 전` : '제한 없음 (당일 가능)'}
                              </span>
                              <button
                                onClick={() => startEditAdvance(farmProgramId, item.minAdvanceDays)}
                                className="text-xs text-gray-400 hover:text-green-700 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-green-50 transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                수정
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 ml-7">
                          오늘로부터 N일 이후의 날짜부터 예약 신청이 가능합니다.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 mb-1">프로그램 삭제</h2>
                <p className="text-sm text-gray-500">
                  이 프로그램과 연결된 모든 스케줄 및 차단 날짜가 함께 삭제됩니다.
                  진행 중인 예약이 있으면 삭제할 수 없습니다.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프로그램 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">프로그램 추가</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* 농장 선택 (전체 농장일 때만 표시) */}
              {!defaultFarmId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">농장 선택 *</label>
                  <select
                    value={addForm.farmId}
                    onChange={(e) => setAddForm((f) => ({ ...f, farmId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">농장을 선택하세요</option>
                    {farms.map((farm) => (
                      <option key={farm.id} value={farm.id}>{farm.name}</option>
                    ))}
                  </select>
                  {addForm.farmId && (
                    <p className="text-xs text-green-600 mt-1">
                      선택됨: {farms.find((f) => f.id === addForm.farmId)?.name}
                    </p>
                  )}
                </div>
              )}
              {defaultFarmId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">농장</label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                    {farms.find((f) => f.id === defaultFarmId)?.name ?? defaultFarmId}
                  </div>
                </div>
              )}

              <EditFormView
                form={addForm}
                onChange={(key, value) => setAddForm((f) => ({ ...f, [key]: value }))}
                onSave={handleAdd}
                onCancel={() => setShowAddModal(false)}
                saving={adding}
                submitLabel="추가"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EditFormView({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
  submitLabel = '저장',
}: {
  form: EditForm
  onChange: (key: keyof EditForm, value: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  submitLabel?: string
}) {
  function update(key: keyof EditForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(key, e.target.value)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">프로그램명 *</label>
          <input type="text" value={form.title} onChange={update('title')} className={inputCls} />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">소요 시간 (분)</label>
            <input type="number" min={0} value={form.duration_minutes} onChange={update('duration_minutes')} className={inputCls} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">대상</label>
            <input type="text" value={form.target_audience} onChange={update('target_audience')} placeholder="예: 성인, 노인" className={inputCls} />
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">프로그램 소개</label>
        <textarea rows={3} value={form.description} onChange={update('description')} className={textareaCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">진행 순서 / 상세 내용</label>
        <textarea rows={4} value={form.process_description} onChange={update('process_description')} className={textareaCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">유의 사항</label>
        <textarea rows={3} value={form.notice} onChange={update('notice')} className={textareaCls} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving || !form.title.trim()}
          className="px-4 py-2 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 disabled:opacity-40 flex items-center gap-1.5"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 text-sm rounded-lg text-gray-600 hover:bg-gray-50"
        >
          취소
        </button>
      </div>
    </div>
  )
}

function ViewContent({ program }: { program: ProgramRow }) {
  if (!program.description && !program.process_description && !program.notice) {
    return <p className="text-gray-400 text-sm">내용이 없습니다. 편집 버튼으로 내용을 추가하세요.</p>
  }
  return (
    <div className="space-y-3 text-sm text-gray-700">
      {program.description && (
        <div>
          <div className="text-xs text-gray-400 mb-1">프로그램 소개</div>
          <p className="leading-relaxed whitespace-pre-line">{program.description}</p>
        </div>
      )}
      {program.process_description && (
        <div>
          <div className="text-xs text-gray-400 mb-1">진행 순서 / 상세 내용</div>
          <p className="leading-relaxed whitespace-pre-line">{program.process_description}</p>
        </div>
      )}
      {program.notice && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
          <div className="text-xs text-amber-600 font-medium mb-1">유의 사항</div>
          <p className="text-sm text-amber-800 whitespace-pre-line">{program.notice}</p>
        </div>
      )}
    </div>
  )
}
