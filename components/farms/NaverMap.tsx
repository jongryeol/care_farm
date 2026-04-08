'use client'

import { useEffect, useRef } from 'react'

interface NaverMapProps {
  latitude: number
  longitude: number
  name: string
}

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: object) => object
        LatLng: new (lat: number, lng: number) => object
        Marker: new (options: object) => { setMap: (map: object | null) => void }
        InfoWindow: new (options: object) => {
          open: (map: object, marker: object) => void
          close: () => void
        }
      }
    }
  }
}

export default function NaverMap({ latitude, longitude, name }: NaverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<object | null>(null)

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !window.naver?.maps) return

      const location = new window.naver.maps.LatLng(latitude, longitude)
      const map = new window.naver.maps.Map(mapRef.current, {
        center: location,
        zoom: 15,
      })
      mapInstanceRef.current = map

      const marker = new window.naver.maps.Marker({
        position: location,
        map,
      })

      const infoWindow = new window.naver.maps.InfoWindow({
        content: `<div style="padding:8px 12px;font-size:13px;font-weight:600">${name}</div>`,
      })
      infoWindow.open(map, marker)
    }

    if (window.naver?.maps) {
      initMap()
      return
    }

    // 스크립트 동적 로드
    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
    if (!clientId) return

    const script = document.createElement('script')
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    script.async = true
    script.onload = initMap
    document.head.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, name])

  if (!process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID) {
    return (
      <div className="w-full h-64 rounded-xl bg-gray-100 flex items-center justify-center text-sm text-gray-400">
        지도 API 키가 설정되지 않았습니다
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-64 rounded-xl overflow-hidden border border-gray-200"
    />
  )
}
