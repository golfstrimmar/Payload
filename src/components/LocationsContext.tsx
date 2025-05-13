'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react'

interface LocationsContextType {
  locations: Location[]
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>
  flagLocations: boolean
  setFlagLocations: React.Dispatch<React.SetStateAction<boolean>>
  fetchLocations: () => Promise<void>
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined)

export function LocationsProvider({ children, token }: { children: ReactNode; token: string }) {
  const [locations, setLocations] = useState<Location[]>([])
  const [flagLocations, setFlagLocations] = useState<boolean>(false)

  const fetchLocations = useCallback(async () => {
    if (!token) return
    try {
      const response = await fetch('/api/locations', {
        headers: { Authorization: `JWT ${token}` },
      })
      if (response.ok) {
        const { docs } = await response.json()
        setLocations(docs)
      } else {
        console.error('Failed to fetch locations:', response.status, response.statusText)
      }
    } catch (err) {
      console.error('Error fetching locations:', err)
    }
  }, [token])

  useEffect(() => {
    fetchLocations()
  }, [flagLocations, fetchLocations])

  const value = useMemo(
    () => ({
      locations,
      setLocations,
      flagLocations,
      setFlagLocations,
      fetchLocations,
    }),
    [locations, flagLocations, fetchLocations],
  )

  return <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>
}

export function useLocationsContext() {
  const context = useContext(LocationsContext)
  if (!context) {
    throw new Error('useLocationsContext must be used within a LocationsProvider')
  }
  return context
}
