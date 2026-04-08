'use client'

import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import AdminReservationCreateModal from './AdminReservationCreateModal'

interface Props {
  farms: { id: string; name: string }[]
  defaultFarmId?: string
}

export default function AdminReservationCreateButton({ farms, defaultFarmId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm bg-green-700 text-white px-4 py-2 rounded-xl hover:bg-green-800 transition-colors font-medium"
      >
        <PlusCircle className="w-4 h-4" />
        직접 등록
      </button>
      {open && (
        <AdminReservationCreateModal
          farms={farms}
          defaultFarmId={defaultFarmId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
