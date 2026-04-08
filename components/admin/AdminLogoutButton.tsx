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
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-green-300 hover:bg-green-800 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      로그아웃
    </button>
  )
}
