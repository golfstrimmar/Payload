'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter, useParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import EditEventModal from '@/components/EditEventModal'
import { useStateContext } from '@/components/StateProvaider'
import Link from 'next/link'
const EventMap = dynamic(() => import('@/components/EventMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
})
interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  mediaUrls: string[]
}

interface EventCardProps {
  event: Event
  handleEditEvent: (event: Event) => void
  handleDeleteEvent: (id: string) => void
}

const EventCard: React.FC<EventCardProps> = () => {
  const [run, setRun] = useState<number>(null)
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event>({
    id: '',
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    mediaUrls: [],
  })
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editingEvent, setEditingEvent] = useState<Event>(null)
  const router = useRouter()
  const { user, role, token, ID, isLoading, setIsLoading, events, setEvents } = useStateContext()
  //  ====================
  useEffect(() => {
    console.log('<====id====>', id)
    console.log(
      '<====events====>',
      events.map((foo) => {
        return foo.id
      }),
    )

    if (id && events) {
      const foundEvent = events.find((e) => String(e.id) === String(id))
      console.log('<==== foundEvent ====>', foundEvent)
      if (foundEvent) {
        setEvent(foundEvent)
      } else {
        toast.error('Event not found')
      }
    }
  }, [id, events])
  //  ====================
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

      setEvents(events.filter((event) => event.id !== id))
      toast.success('Event deleted successfully')
      router.push('/events')
    } catch (error) {
      setIsLoading(false)
      toast.error('Error deleting event')
    }
  }
  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setShowEditModal(true)
  }
  //  ====================

  return (
    <li className="w-full p-4 bg-gray-100 rounded-md shadow-[0px_0px_4px_rgba(0,0,0,0.25)]">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <AnimatePresence>
        {showEditModal && editingEvent && (
          <EditEventModal
            setEvents={setEvents}
            setShowEditModal={setShowEditModal}
            event={editingEvent}
          />
        )}
      </AnimatePresence>
      <Link
        href={`/events`}
        className="inline-flex items-center gap-2 cursor-pointer mb-3 hover:bg-gray-200 p-2 rounded-md transition-all duration-300"
      >
        <Image src="/assets/svg/chevron-left.svg" alt="arrow" width={10} height={10} /> Return to
        events{' '}
      </Link>
      <br />
      <section className="grid grid-cols-[500px_1fr] gap-4 w-full">
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
                  className={`aspect-cover min-h-[300px] ${run === index ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                />
              </div>
            ))}
        </div>
        <div className="flex flex-col">
          <strong className="text-lg">Title: {event.title}</strong>
          <p className="text-lg ">Content: {event.content}</p>
          <p className="text-sm text-gray-600">Date:{new Date(event.date).toLocaleString()}</p>
          <p className="text-sm text-gray-600">User: {event.user?.email}</p>
          <p className="text-sm text-gray-600">Status: {event.status ? 'Active' : 'Inactive'}</p>
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
          <div className="mt-4 h-148 col-span-full">
            <EventMap
              events={[event]}
              initialPosition={[event.location.coordinates[1], event.location.coordinates[0]]}
            />
          </div>
        )}
      </section>
    </li>
  )
}

export default EventCard
