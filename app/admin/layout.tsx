import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Leaf, LayoutDashboard, LogOut } from 'lucide-react'
import AdminLogoutButton from '@/components/admin/AdminLogoutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 페이지는 제외
  return (
    <div className="min-h-screen bg-gray-50">
      {user && (
        <aside className="fixed top-0 left-0 h-full w-56 bg-green-900 text-white flex flex-col z-40">
          <div className="px-5 py-5 border-b border-green-800">
            <Link href="/admin/reservations" className="flex items-center gap-2 font-bold text-lg">
              <Leaf className="w-5 h-5 text-green-400" />
              관리자
            </Link>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            <Link
              href="/admin/reservations"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-green-100 hover:bg-green-800 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              예약 관리
            </Link>
          </nav>

          <div className="px-3 py-4 border-t border-green-800">
            <AdminLogoutButton />
          </div>
        </aside>
      )}

      <div className={user ? 'ml-56' : ''}>
        {children}
      </div>
    </div>
  )
}
