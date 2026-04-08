'use client'

import Link from 'next/link'
import { MapPin, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

interface FarmSummary {
  id: string
  name: string
  region: string | null
  address: string
  is_active: boolean
  image_url: string | null
  short_description: string | null
  updated_at: string
}

interface Props {
  farms: FarmSummary[]
}

export default function FarmList({ farms }: Props) {
  if (farms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
        등록된 농장이 없습니다.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {farms.map((farm) => (
        <Link
          key={farm.id}
          href={`/admin/farm/${farm.id}`}
          className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all overflow-hidden flex flex-col"
        >
          {/* 썸네일 */}
          <div className="h-36 bg-gray-100 overflow-hidden relative">
            {farm.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={farm.image_url}
                alt={farm.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                이미지 없음
              </div>
            )}
            {/* 활성/비활성 뱃지 */}
            <div className="absolute top-2 right-2">
              {farm.is_active ? (
                <span className="flex items-center gap-1 text-xs font-medium bg-green-600 text-white px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  운영중
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium bg-gray-400 text-white px-2 py-0.5 rounded-full">
                  <XCircle className="w-3 h-3" />
                  비활성
                </span>
              )}
            </div>
          </div>

          {/* 내용 */}
          <div className="px-4 py-3 flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                {farm.name}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors shrink-0" />
            </div>
            {farm.short_description && (
              <p className="text-xs text-gray-500 line-clamp-2">{farm.short_description}</p>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-auto pt-2">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{farm.region ? `${farm.region} · ` : ''}{farm.address}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
