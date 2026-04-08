'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'

interface Farm { id: string; name: string }

interface Props {
  role: 'super_admin' | 'farm_admin'
  farms: Farm[]
  farmId: string | null
  adminName: string
  children: React.ReactNode
}

export default function AdminLayoutClient({ role, farms, farmId, adminName, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <AdminSidebar
        role={role}
        farms={farms}
        farmId={farmId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <AdminHeader
        adminName={adminName}
        role={role}
        farmId={farmId}
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="md:ml-56 pt-14">
        {children}
      </div>
    </>
  )
}
