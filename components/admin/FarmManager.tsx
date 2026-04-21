'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, X, GripVertical, Loader2 } from 'lucide-react'
import type { Database } from '@/lib/types/database'

type Farm = Database['public']['Tables']['farms']['Row']

interface Props {
  farm: Farm
}

interface FormState {
  name: string
  short_description: string
  description: string
  address: string
  phone: string
  main_phone: string
  business_name: string
  representative_name: string
  email: string
  region: string
}

export default function FarmManager({ farm }: Props) {
  const [form, setForm] = useState<FormState>({
    name: farm.name,
    short_description: farm.short_description ?? '',
    description: farm.description ?? '',
    address: farm.address,
    phone: farm.phone ?? '',
    main_phone: farm.main_phone ?? '',
    business_name: farm.business_name ?? '',
    representative_name: farm.representative_name ?? '',
    email: farm.email ?? '',
    region: farm.region ?? '',
  })
  const [imageUrls, setImageUrls] = useState<string[]>(farm.image_urls ?? [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 드래그 상태
  const dragIndex = useRef<number | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // 이미지 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of files) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const res = await fetch(
          `/api/admin/farm/images?farmId=${encodeURIComponent(farm.id)}&ext=${ext}&type=${encodeURIComponent(file.type)}`,
          { method: 'POST', body: file, headers: { 'Content-Type': file.type } }
        )
        if (!res.ok) {
          let msg = '업로드 실패'
          try { msg = (await res.json()).error ?? msg } catch { /* empty body */ }
          throw new Error(msg)
        }
        const { url } = await res.json()
        uploaded.push(url)
      }
      setImageUrls((prev) => [...prev, ...uploaded])
      toast.success(`${uploaded.length}개 이미지가 업로드되었습니다.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // 이미지 삭제
  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // 드래그 앤 드롭 순서 변경
  const handleDragStart = (index: number) => {
    dragIndex.current = index
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const next = [...imageUrls]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(index, 0, moved)
    dragIndex.current = index
    setImageUrls(next)
  }

  const handleDragEnd = () => {
    dragIndex.current = null
  }

  // 저장
  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/farm', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmId: farm.id,
          ...form,
          image_urls: imageUrls,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? '저장 실패')
      }
      toast.success('농장 정보가 저장되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 기본 정보 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">기본 정보</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="농장명 *">
            <input name="name" value={form.name} onChange={handleChange}
              className={inputCls} placeholder="농장명" />
          </Field>
          <Field label="지역">
            <input name="region" value={form.region} onChange={handleChange}
              className={inputCls} placeholder="예: 경기, 강원" />
          </Field>
          <Field label="한 줄 소개" className="sm:col-span-2">
            <input name="short_description" value={form.short_description} onChange={handleChange}
              className={inputCls} placeholder="카드에 표시되는 짧은 소개" />
          </Field>
          <Field label="상세 설명" className="sm:col-span-2">
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={4} className={`${inputCls} resize-none`} placeholder="농장 상세 설명" />
          </Field>
        </div>
      </section>

      {/* 연락처 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">연락처 & 사업자 정보</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="주소 *" className="sm:col-span-2">
            <input name="address" value={form.address} onChange={handleChange}
              className={inputCls} placeholder="도로명 주소" />
          </Field>
          <Field label="대표 전화">
            <input name="main_phone" value={form.main_phone} onChange={handleChange}
              className={inputCls} placeholder="02-1234-5678" />
          </Field>
          <Field label="예약 전화">
            <input name="phone" value={form.phone} onChange={handleChange}
              className={inputCls} placeholder="010-1234-5678" />
          </Field>
          <Field label="이메일">
            <input name="email" value={form.email} onChange={handleChange}
              className={inputCls} placeholder="farm@example.com" type="email" />
          </Field>
          <Field label="사업체명">
            <input name="business_name" value={form.business_name} onChange={handleChange}
              className={inputCls} placeholder="사업체명" />
          </Field>
          <Field label="대표자명">
            <input name="representative_name" value={form.representative_name} onChange={handleChange}
              className={inputCls} placeholder="대표자 이름" />
          </Field>
        </div>
      </section>

      {/* 이미지 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">이미지</h2>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-sm font-medium text-green-700 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            이미지 추가
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {imageUrls.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl h-32 flex flex-col items-center justify-center gap-2 text-gray-400 cursor-pointer hover:border-green-300 hover:text-green-500 transition-colors"
          >
            <Upload className="w-6 h-6" />
            <span className="text-sm">클릭하여 이미지 업로드</span>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-gray-400 mb-2">드래그하여 순서를 변경할 수 있습니다. 첫 번째 이미지가 대표 이미지입니다.</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {imageUrls.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 cursor-grab active:cursor-grabbing"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`농장 이미지 ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      대표
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600 hover:text-red-600" />
                  </button>
                  <div className="absolute bottom-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}

const inputCls =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-300'

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}
