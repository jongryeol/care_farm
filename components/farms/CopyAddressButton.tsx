'use client'

import { Copy } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  address: string
}

export default function CopyAddressButton({ address }: Props) {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    toast.success('주소가 복사되었습니다')
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-700 transition-colors ml-1 shrink-0"
      title="주소 복사"
    >
      <Copy className="w-3.5 h-3.5" />
    </button>
  )
}
