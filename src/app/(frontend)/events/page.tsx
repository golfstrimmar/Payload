'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { title } from 'process'
import Button from '@/components/ui/Button/Button'
import AddEventModal from '@/components/AddEventModal/AddEventModal'
import { useStateContext } from '@/components/StateProvaider'
import EditEventModal from '@/components/EditEventModal'
import Image from 'next/image'
interface Event {
  id: string
  title: string
  date: string
  content: string
  status: boolean
  user?: string
  mediaUrls?: string[]
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, role, token, ID } = useStateContext()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [run, setRun] = useState<number>(null)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [editingEvent, setEditingEvent] = useState<Event>(null)
  useEffect(() => {
    if (events) {
      console.log('<==== events====>', events)
    }
  }, [events])

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
      } catch (err) {
        setError('Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [router])

  const handleDeleteEvent = async (id: string) => {
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

      if (!response.ok) throw new Error('Failed to delete event')
      setEvents(events.filter((event) => event.id !== id))
    } catch (error) {
      setError('Error deleting event')
    }
  }
  const handleEditEvent = (event: Event) => {
    console.log('Setting editingEvent:', event)
    setEditingEvent(event)
    setShowEditModal(true)
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>

  return (
    <div className=" mx-4 mt-10 p-6 bg-white rounded-lg shadow-md">
      {showEditModal && editingEvent && (
        <EditEventModal
          setEvents={setEvents}
          setShowEditModal={setShowEditModal}
          event={editingEvent}
        />
      )}
      <h2 className="text-center text-2xl font-bold mb-6">Your Events</h2>
      <div className="flex flex-col mb-6 items-center gap-2">
        <p className="text-gray-600 ">
          You are logged in as: <strong>{user}</strong>
        </p>
        <p className="text-gray-600">
          You role: <strong>{role}</strong>
        </p>
        {role === 'admin' && (
          <a href="/admin" className="text-blue-500 hover:underline">
            Go to Admin
          </a>
        )}
      </div>
      <div className="my-4 text-center">
        <Button
          buttonText="Create Event Modal"
          onClick={() => setShowCreateModal((prev) => !prev)}
          buttonType="button"
        />
      </div>
      {showCreateModal && (
        <AddEventModal
          setEvents={setEvents}
          setShowCreateModal={setShowCreateModal}
          currentUser={user}
          events={events}
        />
      )}

      {events.length === 0 ? (
        <p className="text-center text-gray-500">No events found.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event, index) => (
            <li
              key={index}
              className="p-4 bg-gray-100 rounded-md flex justify-between items-center shadow-[0px_0px_4px_rgba(0,0,0,0.25)]"
            >
              <section className="grid grid-cols-[300px_1fr] gap-4">
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
                  <div className="mt-auto">
                    <Button
                      buttonText="Edit"
                      buttonType="text"
                      onClick={() => handleEditEvent(event)}
                    />
                    <Button
                      buttonText="Delete"
                      buttonType="text"
                      onClick={() => handleDeleteEvent(event.id)}
                    />
                  </div>
                </div>
              </section>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
