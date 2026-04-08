import AdminLoginForm from '@/components/admin/AdminLoginForm'
import { Leaf } from 'lucide-react'

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-green-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-800 rounded-2xl mb-4">
            <Leaf className="w-7 h-7 text-green-300" />
          </div>
          <h1 className="text-2xl font-bold text-white">관리자 로그인</h1>
          <p className="text-green-400 text-sm mt-1">치유농장 예약 관리 시스템</p>
        </div>

        <AdminLoginForm />
      </div>
    </div>
  )
}
