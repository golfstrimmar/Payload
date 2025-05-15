'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter, useParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import EditEventModal from '@/components/EditEventModal'
import { useStateContext } from '@/components/StateProvaider'
import { useUserContext } from '@/components/UserContext'
import Link from 'next/link'

const EventMap = dynamic(() => import('@/components/EventMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
})

interface Event {
  id: string
  title: string
  content: string
  date: string
  time: string
  location: { coordinates: [number, number]; address?: string }
  mediaUrls: string[]
  status: 'active' | 'inactive'
  user?: { id: string; email?: string }
}

interface EventCardProps {
  event: Event
  handleEditEvent: (event: Event) => void
  handleDeleteEvent: (id: string) => void
}
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
const EventCard: React.FC<EventCardProps> = () => {
  const [run, setRun] = useState<number | null>(null)
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event>({
    id: '',
    title: '',
    content: '',
    date: '',
    time: '',
    location: { coordinates: [0, 0], address: '' },
    mediaUrls: [],
    status: 'inactive',
  })
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const router = useRouter()
  const { setIsLoading, events, setEvents, length } = useStateContext()
  const { token } = useUserContext()
  // ---------------
  useEffect(() => {
    if (length === 0) {
      console.log('<==== length====>', length)
      router.push('/events')
    }
  }, [length])
  useEffect(() => {
    if (events) {
      console.log('<==== events on eventpage====>', events)
    }
  }, [events])
  useEffect(() => {
    if (id && events) {
      const foundEvent = events?.find((e) => String(e.id) === String(id))
      if (foundEvent) {
        setEvent({
          ...foundEvent,
          status: foundEvent.status === 'active' ? 'active' : 'inactive',
        })
      }
    }
  }, [events])

  useEffect(() => {
    if (id) {
      console.log('<==== id====>', id)
    }
  }, [id])
  useEffect(() => {
    if (event) {
      console.log('<==== event on eventpage====>', event)
    }
  }, [event])

  const handleDeleteEvent = async (id: string) => {
    setIsLoading(true)

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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete event')
      }

      setEvents(events.filter((event) => event.id !== id))
      toast.success('Event deleted successfully')
      setIsLoading(false)
      router.push('/events')
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error.message || 'Error deleting event')
    }
  }

  // ----------------------------------
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setShowEditModal(true)
  }
  return (
    <li className="w-full p-4 bg-gray-100 rounded-md shadow-[0px_0px_4px_rgba(0,0,0,0.25)]">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <AnimatePresence>
        {showEditModal && editingEvent && (
          <EditEventModal
            setEvents={setEvents}
            setShowEditModal={setShowEditModal}
            event={editingEvent.id}
          />
        )}
      </AnimatePresence>
      <Link
        href={`/events`}
        className="inline-flex items-center gap-2 cursor-pointer mb-3 hover:bg-gray-200 p-2 rounded-md transition-all duration-300"
      >
        <Image src="/assets/svg/chevron-left.svg" alt="arrow" width={10} height={10} /> Return to
        events
      </Link>
      <br />
      <section className="">
        <div className="flex items-center gap-4 w-full">
          <div className="flex flex-col gap-3 max-w-[500px]">
            {event.mediaUrls &&
              event.mediaUrls.length > 0 &&
              event.mediaUrls.map((url, index) => (
                <div
                  key={index}
                  className={`w-full shadow-[0px_0px_8px_rgba(0,0,0,0.25)] cursor-pointer hover:shadow-[0px_0px_16px_rgba(0,0,0,0.25)] transition-all duration-300 ${
                    run === index
                      ? 'fixed w-[100vw] h-[100vh] z-500 top-0 left-0 bg-[rgba(0,0,0,0.9)]'
                      : ''
                  }`}
                  onClick={() => {
                    setRun(index)
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRun(null)
                    }}
                    className={` ${
                      run === index ? 'block fixed top-4 right-4 z-500 cursor-pointer' : 'hidden'
                    }`}
                  >
                    <Image src="/assets/svg/cross.svg" width={20} height={20} alt="close" />
                  </button>
                  <img
                    src={url}
                    alt={url}
                    className={`aspect-cover min-h-[300px] ${
                      run === index
                        ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
                        : ''
                    }`}
                  />
                </div>
              ))}
          </div>
          <div className="flex flex-col gap-3">
            <strong className="text-[30px]">{event.title}</strong>
            <p className="text-[20px] my-2 text-gray-800 border border-gray-400 p-3">
              {event.content}
            </p>
            <h3 className="text-[25px]">{event.date}</h3>
            <h3 className="text-[25px]">
              {event.time.split(':')[0] + ':' + event.time.split(':')[1]}
            </h3>
            <p className="text-sm text-gray-600">User: {event.user?.email}</p>

            <div className="mt-auto flex gap-10">
              <Image
                onClick={() => handleEditEvent(event)}
                src="/assets/svg/edit.svg"
                width={25}
                height={25}
                alt="edit"
                className="cursor-pointer hover:scale-110 transition-all duration-200"
              />
              <Image
                onClick={() => handleDeleteEvent(event.id)}
                src="/assets/svg/cross.svg"
                width={25}
                height={25}
                alt="delete"
                className="cursor-pointer hover:scale-110 transition-all duration-200"
              />
            </div>
          </div>
        </div>
        {event.location && (
          <div className="mt-4 h-148 col-span-full">
            <h3 className="text-[25px]">Location name: {event.location.address}</h3>
            <EventMap initialPosition={event.location.coordinates} />
          </div>
        )}
      </section>
    </li>
  )
}

export default EventCard
