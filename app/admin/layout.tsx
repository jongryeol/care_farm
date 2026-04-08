import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  let farms: { id: string; name: string }[] = []
  if (session) {
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
      {session && (
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
      <div className={session ? 'ml-56 pt-14' : ''}>
        {children}
      </div>
    </div>
  )
}
