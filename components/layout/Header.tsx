'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Leaf } from 'lucide-react'

const navLinks = [
  { href: '/programs', label: '체험 안내' },
  { href: '/farms', label: '농장 목록' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-green-800">
          <Leaf className="w-6 h-6 text-green-600" />
          치유농장
        </Link>

        {/* 데스크톱 메뉴 */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? 'text-green-700 border-b-2 border-green-700 pb-0.5'
                  : 'text-gray-600 hover:text-green-700'
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/farms"
            className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-800 transition-colors"
          >
            예약하기
          </Link>
        </nav>

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="메뉴"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-3">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-gray-700 py-1"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/farms"
            className="bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg text-center"
            onClick={() => setMenuOpen(false)}
          >
            예약하기
          </Link>
        </div>
      )}
    </header>
  )
}
