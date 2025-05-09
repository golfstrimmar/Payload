'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { title } from 'process'
import Button from '@/components/ui/Button/Button'
import AddEventModal from '@/components/AddEventModal/AddEventModal'
import EditEventModal from '@/components/EditEventModal'
import Image from 'next/image'
import { useStateContext } from '@/components/StateProvaider'
import toast, { Toaster } from 'react-hot-toast'
import Loading from '@/components/Loading/Loading'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import EventMap from '@/components/EventMap'
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
  const [events, setEvents] = useState<Event[]>([])

  const [error, setError] = useState('')
  const { user, role, token, ID, isLoading, setIsLoading, length, setLength } = useStateContext()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [run, setRun] = useState<number>(null)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editingEvent, setEditingEvent] = useState<Event>(null)

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    router.push('/admin').then(() => {
      setIsLoading(false)
    })
  }

  useEffect(() => {
    setIsLoading(true)
  }, [])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const eventsResponse = await fetch('/api/events', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (!eventsResponse.ok) throw new Error('Failed to fetch events')
        const { docs } = await eventsResponse.json()

        console.log('<====docs====>', docs)
        if (docs.length === 0) {
          router.push('/')
        }
        setEvents(
          docs.map((event: Event) => ({
            ...event,
            date: new Date(event.date).toLocaleString('en-US', { timeZone: 'Europe/Berlin' }),
            user: event.user,
          })),
        )
      } catch (err) {
        toast.error('Error fetching data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [router])

  const handleDeleteEvent = async (id: string) => {
    setIsLoading(true)
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `JWT ${token}`,
        },
      })

      if (!response.ok) {
        toast.error('Failed to delete event')
      } else {
        setIsLoading(false)
        toast.success('Event deleted successfully')
      }
      setEvents(events.filter((event) => event.id !== id))
    } catch (error) {
      setIsLoading(false)
      toast.error('Error deleting event')
    }
  }
  const handleEditEvent = (event: Event) => {
    console.log('Setting editingEvent:', event)
    setEditingEvent(event)
    setShowEditModal(true)
  }

  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>

  return (
    <div className=" mx-4 mt-10 p-6 bg-white rounded-lg shadow-md">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {isLoading && <Loading />}
      <AnimatePresence>
        {showEditModal && editingEvent && (
          <EditEventModal
            setEvents={setEvents}
            setShowEditModal={setShowEditModal}
            event={editingEvent}
          />
        )}
      </AnimatePresence>
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
            <li
              key={index}
              className="p-4 bg-gray-100 rounded-md flex justify-between items-center shadow-[0px_0px_4px_rgba(0,0,0,0.25)] w-full"
            >
              <section className="grid grid-cols-[300px_1fr] gap-4 w-full">
                <div className="flex flex-col gap-3 ">
                  {event.mediaUrls &&
                    event.mediaUrls.length > 0 &&
                    event.mediaUrls.map((url, index) => (
                      <div
                        key={index}
                        className={`w-full shadow-[0px_0px_8px_rgba(0,0,0,0.25)] cursor-pointer hover:shadow-[0px_0px_16px_rgba(0,0,0,0.25)] transition-all duration-300 ${run === index ? 'fixed w-[100vw] h-[100vh] z-500 top-0 left-0 bg-[rgba(0,0,0,0.9)] ]' : ''}`}
                        onClick={() => {
                          setRun(index)
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setRun(null)
                          }}
                          className={`  ${run === index ? 'block fixed top-4 right-4  z-500 cursor-pointer' : 'hidden'}`}
                        >
                          <Image src="/assets/svg/cross.svg" width={20} height={20} alt="close" />
                        </button>
                        <img
                          src={url.url}
                          alt={index}
                          className={`aspect-cover ${run === index ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                        />
                      </div>
                    ))}
                </div>
                <div className="flex flex-col">
                  <strong className="text-lg">Title: {event.title}</strong>
                  <p className="text-lg">Content: {event.content}</p>
                  <p className="text-sm text-gray-600">
                    Date:{new Date(event.date).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">User: {event.user.email}</p>
                  <p className="text-sm text-gray-600">
                    Status: ({event.status ? 'Active' : 'Inactive'})
                  </p>
                  <div className="mt-auto flex gap-2">
                    <Image
                      onClick={() => handleEditEvent(event)}
                      src="/assets/svg/edit.svg"
                      width={20}
                      height={20}
                      alt="edit"
                      className="cursor-pointer hover:scale-110 transition-all duration-200"
                    />
                    <Image
                      onClick={() => handleDeleteEvent(event.id)}
                      src="/assets/svg/cross.svg"
                      width={20}
                      height={20}
                      alt="delete"
                      className="cursor-pointer hover:scale-110 transition-all duration-200"
                    />
                  </div>
                </div>
                {event.location?.coordinates && (
                  <div className="mt-4 h-48 col-span-full">
                    <EventMap
                      events={[event]}
                      initialPosition={[
                        event.location.coordinates[1],
                        event.location.coordinates[0],
                      ]}
                    />
                  </div>
                )}
              </section>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
