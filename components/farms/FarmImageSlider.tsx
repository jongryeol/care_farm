'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  name: string
}

export default function FarmImageSlider({ images, name }: Props) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const total = images.length

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % total)
  }, [total])

  const prev = () => setCurrent((c) => (c - 1 + total) % total)

  // 자동 슬라이드 (3.5초)
  useEffect(() => {
    if (total <= 1 || paused) return
    const timer = setInterval(next, 3500)
    return () => clearInterval(timer)
  }, [total, paused, next])

  if (total === 0) {
    return (
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-green-200 to-green-400 h-72 lg:h-96 flex items-center justify-center text-green-700 font-semibold text-xl">
        {name}
      </div>
    )
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-gray-100 h-72 lg:h-96"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* 이미지 */}
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`${name} ${i + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* 좌우 버튼 (이미지 2장 이상일 때만) */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="이전"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="다음"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* 인디케이터 점 */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`${i + 1}번 이미지`}
              />
            ))}
          </div>

          {/* 카운터 */}
          <div className="absolute top-3 right-3 bg-black/30 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {current + 1} / {total}
          </div>
        </>
      )}
    </div>
  )
}
