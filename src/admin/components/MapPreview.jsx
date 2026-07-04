import { useEffect, useRef } from 'react'

/**
 * Lightweight map preview using Leaflet (OpenStreetMap).
 * Use when you have latitude/longitude and want a static preview or small interactive map.
 */
export default function MapPreview({ latitude, longitude, height = 200, className = '', zoom = 15, interactive = true }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!latitude || !longitude || !containerRef.current) return

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (isNaN(lat) || isNaN(lng)) return

    const loadMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }

      const map = L.map(containerRef.current).setView([lat, lng], zoom)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      const icon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background:#2d2871;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const marker = L.marker([lat, lng], { icon }).addTo(map)
      markerRef.current = marker

      if (!interactive) {
        map.dragging.disable()
        map.touchZoom.disable()
        map.doubleClickZoom.disable()
        map.scrollWheelZoom.disable()
      }
    }

    loadMap()
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
        markerRef.current = null
      }
    }
  }, [latitude, longitude, zoom, interactive])

  if (!latitude || !longitude) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm ${className}`} style={{ height }}>
        No coordinates
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}
      style={{ height }}
    />
  )
}
