'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Исправление иконки маркера
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Event {
  id: number
  title: string
  event_date: string
  description: string | null
  location: string | null
}

interface MapProps {
  events: Event[]
  onMapClick?: (lat: number, lng: number) => void // Добавляем проп для клика
}

// Парсинг строки POINT(x y) в координаты [lat, lng]
const parsePoint = (point: string | null): [number, number] | null => {
  if (!point) {
    console.log('No location provided')
    return null
  }
  const match = point.match(/POINT\((-?\d+\.?\d*)\s(-?\d+\.?\d*)\)/)
  if (!match) {
    console.log('Invalid location format:', point)
    return null
  }
  const lng = parseFloat(match[1])
  const lat = parseFloat(match[2])
  console.log('Parsed coords:', { lat, lng })
  return [lat, lng]
}

// Компонент для авто-зума
function AutoZoom({ events }: MapProps) {
  const map = useMap()

  useEffect(() => {
    if (events.length === 0) return

    const bounds: [number, number][] = []
    events.forEach((event) => {
      const coords = parsePoint(event.location)
      if (coords) {
        bounds.push(coords)
      }
    })

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [events, map])

  return null
}

// Компонент для обработки клика на карте
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!onMapClick) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      onMapClick(lat, lng)
    }

    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onMapClick])

  return null
}

export default function Map({ events, onMapClick }: MapProps) {
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null)

  console.log('Events for map:', events)

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPoint([lat, lng])
    if (onMapClick) {
      onMapClick(lat, lng)
    }
  }

  return (
    <MapContainer center={[48.8566, 2.3522]} zoom={10} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <AutoZoom events={events} />
      <MapClickHandler onMapClick={handleMapClick} />
      {events.map((event) => {
        const coords = parsePoint(event.location)
        if (!coords) return null
        return (
          <Marker key={event.id} position={coords}>
            <Popup>
              <h3>{event.title}</h3>
              <p>Date: {new Date(event.event_date).toLocaleString()}</p>
              <p>Description: {event.description || 'None'}</p>
            </Popup>
          </Marker>
        )
      })}
      {selectedPoint && (
        <Marker
          position={selectedPoint}
          icon={
            new L.Icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })
          }
        >
          <Popup>Selected location</Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
