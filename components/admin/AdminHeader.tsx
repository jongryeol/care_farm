'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import AdminLogoutButton from './AdminLogoutButton'

interface Props {
  adminName: string
  role: 'super_admin' | 'farm_admin'
  farmId: string | null
}

export default function AdminHeader({ adminName, role, farmId }: Props) {
  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30">
      {/* 왼쪽: 역할 배지 */}
      <div className="flex items-center">
        {role === 'super_admin' && (
          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
            슈퍼 관리자
          </span>
        )}
      </div>

      {/* 오른쪽: 이름, 내 농장 보기, 로그아웃 */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{adminName}</span>
        {role === 'farm_admin' && farmId && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <Link
              href={`/farms/${farmId}`}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-700 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              내 농장 보기
            </Link>
          </>
        )}
        <div className="w-px h-4 bg-gray-200" />
        <AdminLogoutButton />
      </div>
    </header>
  )
}
