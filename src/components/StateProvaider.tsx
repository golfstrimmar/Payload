'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { useUserContext } from '@/components/UserContext'

export interface Event {
  id: string
  title: string
  content: string // Исправлено с description на content
  date: string
  time: string
  location: { coordinates: [number, number]; address?: string }
  mediaUrls: string[]
  user?: { id: string; email?: string } // Добавлено
}

interface StateContextType {
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  length: number
  setLength: React.Dispatch<React.SetStateAction<number>>
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
  setFlagEvents: React.Dispatch<React.SetStateAction<boolean>>
}

const StateContext = createContext<StateContextType | undefined>(undefined)

export function StateProvider({ children }: { children: ReactNode }) {
  const { token } = useUserContext()
  const [flagEvents, setFlagEvents] = useState<boolean>(false)
  const [length, setLength] = useState<number>(0)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchEvents = async () => {
      if (!token) {
        setEvents([])
        setLength(0)
        return
      }
      setIsLoading(true)
      try {
        // Получаем события
        const eventsResponse = await fetch('/api/events?depth=1&limit=100000', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${token}`,
          },
        })
        if (eventsResponse.ok) {
          const { docs } = await eventsResponse.json()
          console.log('<====docs====>', docs)
          const normalizedEvents: Event[] = docs.map((event: any) => {
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
              .replace(' ', ' ')
            return {
              id: String(event.id),
              title: event.title,
              content: event.content || '',
              date: formattedDate.split(' ')[0],
              time: formattedDate.split(' ')[1],
              user: event.user ? { id: String(event.user.id), email: event.user.email } : undefined,
              location: event.location || { coordinates: [0, 0], address: '' },
              mediaUrls: event.mediaUrls || [],
            }
          })
          setEvents(normalizedEvents)
          setLength(normalizedEvents.length)
        } else {
          console.error('Failed to fetch events:', eventsResponse.status)
          setEvents([])
        }
      } catch (err) {
        console.error('Error fetching events or count:', err)
        setEvents([])
        setLength(0)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [token, flagEvents])

  const contextValue = useMemo(
    () => ({
      isLoading,
      setIsLoading,
      length,
      setLength,
      events,
      setEvents,
      setFlagEvents,
    }),
    [isLoading, length, events, flagEvents],
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
