import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { headers } from 'next/headers'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''
  const isLoginPage = pathname === '/admin/login'

  const session = await getAdminSession()
  const showNav = session && !isLoginPage

  let farms: { id: string; name: string }[] = []
  if (showNav) {
    const supabase = await createAdminClient()
    if (session.role === 'super_admin') {
      const { data } = await supabase
        .from('farms')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      farms = data ?? []
    } else if (session.farmId) {
      const { data } = await supabase
        .from('farms')
        .select('id, name')
        .eq('id', session.farmId)
        .maybeSingle()
      if (data) farms = [data]
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showNav ? (
        <AdminLayoutClient
          role={session.role}
          farms={farms}
          farmId={session.farmId}
          adminName={session.name}
        >
          {children}
        </AdminLayoutClient>
      ) : (
        children
      )}
    </div>
  )
}
