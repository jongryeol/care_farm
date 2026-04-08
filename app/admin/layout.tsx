import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { headers } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

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
      {showNav && (
        <>
          <AdminSidebar
            role={session.role}
            farms={farms}
            farmId={session.farmId}
          />
          <AdminHeader
            adminName={session.name}
            role={session.role}
            farmId={session.farmId}
          />
        </>
      )}
      <div className={showNav ? 'ml-56 pt-14' : ''}>
        {children}
      </div>
    </div>
  )
}
