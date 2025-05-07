'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { title } from 'process'
import Button from '@/components/ui/Button/Button'
import AddEventModal from '@/components/AddEventModal/AddEventModal'
interface Event {
  id: string
  title: string
  date: string
  content: string
  status: boolean
  user?: string
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdminLink, setShowAdminLink] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const userResponse = await fetch('/api/users/me', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (!userResponse.ok) throw new Error('Failed to fetch user')
        const { user } = await userResponse.json()
        setCurrentUser(user)
        setShowAdminLink(user.role === 'admin')

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
            user: event.user?.email,
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
    } catch (err) {
      setError('Error deleting event')
    }
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>

  return (
    <div className=" mx-4 mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-center">Your Events</h1>
      <div className="flex flex-col mb-6 items-center gap-2">
        <p className="text-gray-600">
          You are logged in as: <strong>{currentUser?.email}</strong>{' '}
        </p>
        {showAdminLink && (
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
          currentUser={currentUser}
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
              <div>
                <strong className="text-lg">Title: {event.title}</strong>
                <p className="text-lg">Content: {event.content}</p>
                <p className="text-sm text-gray-600">
                  Date:{new Date(event.date).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">User: {event.user}</p>
                <p className="text-sm text-gray-600">
                  Status: ({event.status ? 'Active' : 'Inactive'})
                </p>
              </div>
              {/* <button
                onClick={() => handleDeleteEvent(event.id)}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
              >
                Delete
              </button> */}
              <Button
                buttonText="Delete"
                buttonType="text"
                onClick={() => handleDeleteEvent(event.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
