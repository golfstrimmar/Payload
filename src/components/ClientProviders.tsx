'use client'

import { EventsProvider } from '@/components/EventsContext'
import { LocationsProvider } from '@/components/LocationsContext'
import { useUserContext } from '@/components/UserContext'
import Navbar from '@/components/Navbar/Navbar'

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const { token } = useUserContext()

  return (
    <EventsProvider>
      <LocationsProvider token={token}>
        <Navbar />
        <main>{children}</main>
      </LocationsProvider>
    </EventsProvider>
  )
}
