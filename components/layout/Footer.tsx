import Link from 'next/link'
import { Leaf, Phone, Mail } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 브랜드 */}
          <div>
            <div className="flex items-center gap-2 font-bold text-lg text-green-800 mb-3">
              <Leaf className="w-5 h-5 text-green-600" />
              치유농장 체험 예약
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              자연 속에서 몸과 마음을 회복하는<br />
              특별한 치유 체험을 제공합니다.
            </p>
          </div>

          {/* 바로가기 */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">바로가기</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/admin/login" className="hover:text-green-700 transition-colors">관리자 로그인</Link></li>
            </ul>
          </div>

          {/* 문의 */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">문의</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0 text-green-600" />
                <span>031-000-0000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0 text-green-600" />
                <span>info@carefarm.kr</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 후원 */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">후원</p>
          <Image
            src="/chungnam-agri-logo.png"
            alt="충청남도농업기술원"
            width={180}
            height={48}
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="mt-6 text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} 치유농장 체험 예약. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
