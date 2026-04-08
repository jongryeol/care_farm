'use client'

import Link from 'next/link'
import { ExternalLink, Menu } from 'lucide-react'
import AdminLogoutButton from './AdminLogoutButton'

interface Props {
  adminName: string
  role: 'super_admin' | 'farm_admin'
  farmId: string | null
  onMenuClick: () => void
}

export default function AdminHeader({ adminName, role, farmId, onMenuClick }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30 md:left-56 md:px-6">
      {/* 왼쪽: 햄버거(모바일) + 역할 배지 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>
        {role === 'super_admin' && (
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            슈퍼 관리자
          </span>
        )}
      </div>

      {/* 오른쪽: 이름, 내 농장 보기, 로그아웃 */}
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-sm text-gray-500 hidden sm:block">{adminName}</span>
        {role === 'farm_admin' && farmId && (
          <>
            <div className="w-px h-4 bg-gray-200 hidden sm:block" />
            <Link
              href={`/farms/${farmId}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">내 농장 보기</span>
            </Link>
          </>
        )}
        <div className="w-px h-4 bg-gray-200" />
        <AdminLogoutButton />
      </div>
    </header>
  )
}
