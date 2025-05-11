'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import AddEventModal from '@/components/AddEventModal/AddEventModal'
import { useStateContext } from '@/components/StateProvaider'
import toast, { Toaster } from 'react-hot-toast'
import Loading from '@/components/Loading/Loading'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'

// =============================

interface Event {
  id: string
  title: string
  date: string
  content: string
  status: boolean
  user?: string
  mediaUrls?: string[]
  location?: {
    coordinates?: {
      type: 'Point'
      coordinates: [number, number] // [lng, lat]
    }
    address?: string
  }
}

export default function EventsPage() {
  const [error, setError] = useState('')
  const { user, role, token, ID, isLoading, setIsLoading, length, setLength, events, setEvents } =
    useStateContext()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    router.push('/admin').then(() => {
      setIsLoading(false)
    })
  }
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsResponse = await fetch('/api/events', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (!eventsResponse.ok) throw new Error('Failed to fetch events')
        const { docs } = await eventsResponse.json()

        console.log('<====docs====>', docs)

        setEvents(
          docs.map((event: Event) => ({
            ...event,
            date: new Date(event.date).toLocaleString('en-US', { timeZone: 'Europe/Berlin' }),
            user: event.user,
          })),
        )
        setIsLoading(false)
      } catch (err) {
        toast.error('Failed to fetch events')
        setIsLoading(false)
        console.log('<==== Error fetching data =====>')
      }
    }

    fetchEvents()
  }, [])
  useEffect(() => {
    setIsLoading(true)
  }, [])

  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>

  return (
    <div className=" mx-4 mt-10 p-6 bg-white rounded-lg shadow-md">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      {isLoading && <Loading />}

      <h2 className="text-center text-2xl font-bold mb-6">Your Events</h2>
      <div className="flex flex-col mb-6 items-center gap-2">
        <p className="text-gray-600 ">
          You are logged in as: <strong>{user}</strong>
        </p>
        <p className="text-gray-600">
          You role: <strong>{role}</strong>
        </p>
        {role === 'admin' && (
          <Link href="/admin" className="text-blue-500 hover:underline" onClick={handleAdminClick}>
            Go to Admin
          </Link>
        )}
      </div>
      <div className="my-4 text-center">
        <Button
          buttonText="Create Event Modal"
          onClick={() => setShowCreateModal((prev) => !prev)}
          buttonType="button"
        />
      </div>
      <AnimatePresence>
        {showCreateModal && (
          <AddEventModal
            setEvents={setEvents}
            setShowCreateModal={setShowCreateModal}
            currentUser={user}
            events={events}
          />
        )}
      </AnimatePresence>

      {events.length === 0 ? (
        <p className="text-center text-gray-500">No events found.</p>
      ) : (
        <ul className="space-y-4 w-full">
          {events.map((event, index) => (
            <div key={index}>
              <Link href={`/events/${event.id}`}>{event.title}</Link>
              {/* <EventCard
                event={event}
                handleDeleteEvent={handleDeleteEvent}
                handleEditEvent={handleEditEvent}
                user={user}
              /> */}
            </div>
          ))}
        </ul>
      )}
    </div>
  )
}
