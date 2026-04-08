'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, CalendarDays, BookOpen, Building2, ChevronDown, Layers } from 'lucide-react'
import { useState } from 'react'

interface Farm {
  id: string
  name: string
}

interface Props {
  role: 'super_admin' | 'farm_admin'
  farms: Farm[]
  farmId: string | null  // farm_admin의 고정 farmId
  isOpen?: boolean
  onClose?: () => void
}

const NAV = [
  { href: '/admin/reservations', icon: LayoutDashboard, label: '예약 관리' },
  { href: '/admin/schedules', icon: CalendarDays, label: '스케줄 관리' },
  { href: '/admin/programs', icon: BookOpen, label: '프로그램 관리' },
  { href: '/admin/farm', icon: Building2, label: '농장 관리' },
]

export default function AdminSidebar({ role, farms, farmId, isOpen = false, onClose }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // super_admin: URL에서 선택된 farmId 읽기
  const selectedFarmId = role === 'super_admin'
    ? searchParams.get('farmId')
    : farmId

  const selectedFarm = farms.find((f) => f.id === selectedFarmId)

  function selectFarm(id: string | null) {
    setDropdownOpen(false)
    if (id) {
      window.location.href = `${pathname}?farmId=${id}`
    } else {
      window.location.href = pathname
    }
  }

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

    <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-300 md:w-56 md:translate-x-0 md:z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* 농장 선택 */}
      <div className="px-4 py-4">
        {role === 'super_admin' ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedFarm ? (
                  <span className="truncate">{selectedFarm.name}</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    전체 농장
                  </span>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                {/* 전체 옵션 */}
                <button
                  onClick={() => selectFarm(null)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    !selectedFarmId
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  전체 농장
                </button>
                <div className="border-t border-gray-100" />
                {farms.map((farm) => (
                  <button
                    key={farm.id}
                    onClick={() => selectFarm(farm.id)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      farm.id === selectedFarmId
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {farm.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-sm font-medium text-gray-700 truncate block">
              {farms[0]?.name ?? '내 농장'}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href)
          // 네비게이션 링크에 현재 farmId 유지 (super_admin)
          const linkHref = role === 'super_admin' && selectedFarmId
            ? `${href}?farmId=${selectedFarmId}`
            : href
          return (
            <Link
              key={href}
              href={linkHref}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
    </>
  )
}
