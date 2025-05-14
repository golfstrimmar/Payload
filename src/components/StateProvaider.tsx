'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { useUserContext } from '@/components/UserContext'
export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: { coordinates: [number, number]; address?: string }
  mediaUrls: string[]
}

interface Location {
  id: string
  name: string
  user: { id: string }
  coordinates: { latitude: number; longitude: number }[]
}

interface StateContextType {
  user: string
  setUser: React.Dispatch<React.SetStateAction<string>>
  token: string
  setToken: React.Dispatch<React.SetStateAction<string>>
  role: string
  setRole: React.Dispatch<React.SetStateAction<string>>
  ID: string
  setID: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  length: number
  setLength: React.Dispatch<React.SetStateAction<number>>
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
  locations: Location[]
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>
  flagLocations: boolean
  setFlagLocations: React.Dispatch<React.SetStateAction<boolean>>
  flagEvents: boolean
  setFlagEvents: React.Dispatch<React.SetStateAction<boolean>>
}

const StateContext = createContext<StateContextType | undefined>(undefined)

export function StateProvider({ children }: { children: ReactNode }) {
  const [flagLocations, setFlagLocations] = useState<boolean>(false)
  const [flagEvents, setFlagEvents] = useState<boolean>(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [length, setLength] = useState<number>(0)
  const [events, setEvents] = useState<Event[]>([])
  const { token } = useUserContext() // token
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // ------------------------------
  useEffect(() => {
    const fetchLocations = async () => {
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
    }
    fetchLocations()
  }, [flagLocations, token])

  // ------------------------------

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) {
        setEvents([])
        return
      }
      try {
        const response = await fetch('/api/events', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${token}`,
          },
        })
        if (response.ok) {
          const { docs } = await response.json()
          const normalizedEvents: Event[] = docs.map((event: any) => {
            // Преобразуем дату из UTC в локальное время Europe/Berlin
            const date = new Date(event.date)
            const formattedDate = date
              .toLocaleString('sv-SE', {
                timeZone: 'Europe/Berlin',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })
              .replace(' ', ' ') // "2025-05-13 00:30:00"

            return {
              id: String(event.id),
              title: event.title,
              content: event.content || '',
              date: formattedDate.split(' ')[0], // "2025-05-13"
              time: formattedDate.split(' ')[1], // "00:30:00"
              user: { id: String(event.user.id), email: event.user.email },
              location:
                { coordinates: event.location.coordinates, address: event.location.address } || '',
              mediaUrls: event.mediaUrls?.map((media: any) => media.url) || [],
            }
          })
          setEvents(normalizedEvents)
        } else {
          console.error('Failed to fetch events:', response.status, response.statusText)
          setEvents([])
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        setEvents([])
      }
    }
    fetchEvents()
  }, [token, flagEvents])
  // ------------------------------
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     if (token) {
  //       localStorage.setItem('token', token)
  //     } else {
  //       localStorage.removeItem('token')
  //     }
  //   }
  // }, [token])
  // ------------------------------
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     if (!token) {
  //       console.log('<==== No token ====>')
  //       setUser('')
  //       return
  //     }
  //     try {
  //       const response = await fetch('/api/users/me', {
  //         headers: { Authorization: `JWT ${token}` },
  //       })
  //       if (response.ok) {
  //         const { user } = await response.json()
  //         setUser(user?.email || '')
  //         setRole(user?.role || '')
  //         setID(user?.id || '')
  //       } else {
  //         console.error('Failed to fetch user:', response.status, response.statusText)
  //         setUser('')
  //       }
  //     } catch (err) {
  //       console.error('Error checking auth:', err)
  //       setUser('')
  //     }
  //   }
  //   checkAuth()
  // }, [token])
  // ------------------------------
  const contextValue = useMemo(
    () => ({
      isLoading,
      setIsLoading,
      length,
      setLength,
      events,
      setEvents,
      locations,
      setLocations,
      flagLocations,
      setFlagLocations,
      flagEvents,
      setFlagEvents,
    }),
    [isLoading, length, events, locations, flagLocations, flagEvents, setFlagEvents],
  )

  return <StateContext.Provider value={contextValue}>{children}</StateContext.Provider>
}

export function useStateContext() {
  const context = useContext(StateContext)
  if (!context) {
    throw new Error('useStateContext must be used within a StateProvider')
  }
  return context
}
