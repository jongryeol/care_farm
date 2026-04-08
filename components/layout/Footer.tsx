import Link from 'next/link'
import { Phone, Mail } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4">

        {/* 상단: 로고(좌) + 정보·링크(우) */}
        <div className="flex flex-col md:flex-row md:items-start gap-8 py-10 border-b border-gray-100">

          {/* 후원사 로고 */}
          <div className="md:w-52 shrink-0 flex flex-col gap-1.5">
            <span className="text-xs text-gray-400">후원</span>
            <Image
              src="/chungnam-agri-logo.png"
              alt="충청남도농업기술원"
              width={180}
              height={48}
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* 문의 정보 */}
          <div className="flex-1 flex flex-col sm:flex-row gap-8">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">문의</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-green-600" />
                  <span>031-000-0000</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-green-600" />
                  <span>info@carefarm.kr</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 하단 바: 관리자 로그인(좌) + 저작권(우) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-4">
          <div>
            <Link
              href="/admin/login"
              className="text-xs text-gray-400 hover:text-green-700 transition-colors"
            >
              관리자 로그인
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 치유농장 체험 예약. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}
