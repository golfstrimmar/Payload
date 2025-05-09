'use client'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
})

interface EventMapProps {
  events?: Array<{
    id: string
    location?: {
      coordinates: [number, number] // [lng, lat]
    }
  }>
  onLocationSelect?: (coords: [number, number]) => void
  selectedLocation?: [number, number] // Добавляем проп для выбранного местоположения
  interactive?: boolean
}

export default function EventMap({
  events = [],
  onLocationSelect,
  selectedLocation,
  interactive = false,
}: EventMapProps) {
  return (
    <MapContainer
      center={selectedLocation || [51.505, -0.09]}
      zoom={selectedLocation ? 13 : 2}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {interactive && onLocationSelect && <LocationPicker onSelect={onLocationSelect} />}

      {/* Маркер для выбранного местоположения */}
      {selectedLocation && (
        <Marker position={[selectedLocation[1], selectedLocation[0]]}>
          <Popup>Selected Location</Popup>
        </Marker>
      )}

      {/* Маркеры для событий */}
      {events.map(
        (event) =>
          event.location?.coordinates && (
            <Marker
              key={event.id}
              position={[event.location.coordinates[1], event.location.coordinates[0]]}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{event.title}</h3>
                </div>
              </Popup>
            </Marker>
          ),
      )}
    </MapContainer>
  )
}

function LocationPicker({ onSelect }: { onSelect: (coords: [number, number]) => void }) {
  const map = useMap()

  map.on('click', (e) => {
    onSelect([e.latlng.lng, e.latlng.lat])
  })

  return null
}
