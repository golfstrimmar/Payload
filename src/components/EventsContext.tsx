'use client'

import { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { Event } from './types'

interface EventsContextType {
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
  length: number
  setLength: React.Dispatch<React.SetStateAction<number>>
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([])
  const [length, setLength] = useState<number>(0)

  const value = useMemo(
    () => ({
      events,
      setEvents,
      length,
      setLength,
    }),
    [events, length],
  )

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
}

export function useEventsContext() {
  const context = useContext(EventsContext)
  if (!context) {
    throw new Error('useEventsContext must be used within an EventsProvider')
  }
  return context
}
