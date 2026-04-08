'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
    >
      <LogOut className="w-3.5 h-3.5 shrink-0" />
      로그아웃
    </button>
  )
}
