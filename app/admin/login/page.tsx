import AdminLoginForm from '@/components/admin/AdminLoginForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-green-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">관리자 로그인</h1>
          <p className="text-green-400 text-sm mt-1">치유농장 예약 관리 시스템</p>
        </div>

        <AdminLoginForm />

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-green-500 hover:text-green-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  )
}
