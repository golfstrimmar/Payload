'use client'

import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

interface EventMapProps {
  events?: Array<{
    id: string
    title?: string
    location?: {
      coordinates: [number, number]
    }
  }>
  onLocationSelect?: (coords: [number, number]) => void
  selectedLocation?: [number, number]
  initialPosition?: [number, number]
  interactive?: boolean
}

function MapUpdater({
  events,
  initialPosition,
  selectedLocation,
}: {
  events?: EventMapProps['events']
  initialPosition?: [number, number]
  selectedLocation?: [number, number]
}) {
  const map = useMap()

  useEffect(() => {
    let center: [number, number] = [51.505, -0.09]
    let zoom = 2

    if (events?.length > 0 && events[0]?.location?.coordinates) {
      center = [events[0].location.coordinates[1], events[0].location.coordinates[0]]
      zoom = 15
    } else if (initialPosition) {
      center = [initialPosition[1], initialPosition[0]]
      zoom = 15
    } else if (selectedLocation) {
      center = [selectedLocation[1], selectedLocation[0]]
      zoom = 15
    }

    map.flyTo(center, zoom, { duration: 1 })
  }, [map, events, initialPosition, selectedLocation])

  return null
}

export default function EventMap({
  events = [],
  onLocationSelect,
  selectedLocation,
  initialPosition,
  interactive = false,
}: EventMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    if (initialPosition) {
      console.log('<==== initialPosition====>', initialPosition)
    }
  }, [initialPosition])

  useEffect(() => {
    setIsClient(true)
    if (typeof window !== 'undefined') {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      })
    }
  }, [])

  if (!isClient) {
    return <div className="h-64 bg-gray-100 animate-pulse rounded-md" />
  }

  let center: [number, number] = [51.505, -0.09]
  let zoom = 2

  if (events.length > 0 && events[0]?.location?.coordinates) {
    center = [events[0].location.coordinates[1], events[0].location.coordinates[0]]
    zoom = 15
  } else if (initialPosition) {
    center = [initialPosition[1], initialPosition[0]]
    zoom = 15
  } else if (selectedLocation) {
    center = [selectedLocation[1], selectedLocation[0]]
    zoom = 15
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapUpdater
        events={events}
        initialPosition={initialPosition}
        selectedLocation={selectedLocation}
      />

      {interactive && onLocationSelect && <LocationPicker onSelect={onLocationSelect} />}

      {selectedLocation && (
        <Marker position={[selectedLocation[1], selectedLocation[0]]}>
          <Popup>Selected Location</Popup>
        </Marker>
      )}

      {!selectedLocation && initialPosition && (
        <Marker position={[initialPosition[1], initialPosition[0]]}>
          <Popup>Event Location</Popup>
        </Marker>
      )}
      {events.map(
        (event) =>
          event.location?.coordinates && (
            <Marker
              key={event.id}
              position={[event.location.coordinates[1], event.location.coordinates[0]]}
            >
              <Popup>
                <div>
                  <h3 className="font-bold">{event.title || 'Event'}</h3>
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
