'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  currentView: string
}

export default function ReservationViewTabs({ currentView }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setView = (v: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (v === 'list') params.delete('view')
    else params.set('view', v)
    router.push(`/admin/reservations?${params.toString()}`)
  }

  const isSlots = currentView === 'slots'

  return (
    <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
      <button
        onClick={() => setView('list')}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
          !isSlots ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        예약 관리 (목록)
      </button>
      <button
        onClick={() => setView('slots')}
        className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
          isSlots ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        회차별 관리
      </button>
    </div>
  )
}
