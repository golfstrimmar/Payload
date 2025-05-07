'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { title } from 'process'
import Input from '@/components/ui/Input/Input'
// interface Event {
//   id: string
//   title: string
//   date: string
//   content: string
//   status: boolean
//   user?: string
// }
interface Media {
  id: string
  url: string
  alt?: string
}
export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [newEvent, setNewEvent] = useState({
    date: '',
    title: '',
    content: '',
    user: '',
    status: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdminLink, setShowAdminLink] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null)
  const router = useRouter()

  const [media, setMedia] = useState<Media[]>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        console.log('Fetching media...')
        const mediaResponse = await fetch('/api/media')
        console.log('Media response status:', mediaResponse.status)
        if (!mediaResponse.ok) {
          console.error('Media fetch failed:', mediaResponse.status, mediaResponse.statusText)
          throw new Error(`Failed to fetch media: ${mediaResponse.statusText}`)
        }
        const { docs: mediaDocs } = await mediaResponse.json()
        console.log('Media data:', mediaDocs)
        setMedia(
          mediaDocs.map((media: any) => ({
            id: media.id,
            url: media.url,
            alt: media.alt || 'Media',
          })),
        )
      } catch (err: any) {
        console.error('Error in fetchData:', err.message)
        setError(err.message || 'Error fetching data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])
  //
  //
  // // useEffect(() => {
  //   const fetchEvents = async () => {
  //     const token = localStorage.getItem('token')
  //     if (!token) {
  //       router.push('/login')
  //       return
  //     }

  //     try {
  //       const userResponse = await fetch('/api/users/me', {
  //         headers: { Authorization: `JWT ${token}` },
  //       })
  //       if (!userResponse.ok) throw new Error('Failed to fetch user')
  //       const { user } = await userResponse.json()
  //       setCurrentUser(user)
  //       setShowAdminLink(user.role === 'admin')

  //       const eventsResponse = await fetch('/api/events', {
  //         headers: { Authorization: `JWT ${token}` },
  //       })
  //       if (!eventsResponse.ok) throw new Error('Failed to fetch events')
  //       const { docs } = await eventsResponse.json()

  //       console.log('<====docs====>', docs)
  //       setEvents(
  //         docs.map((event: Event) => ({
  //           ...event,
  //           date: new Date(event.date).toLocaleString('en-US', { timeZone: 'Europe/Berlin' }),
  //           user: event.user?.email,
  //         })),
  //       )
  //     } catch (err) {
  //       setError('Error fetching data')
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   fetchEvents()
  // }, [router])

  // const handleCreateEvent = async (e: React.FormEvent) => {
  //   e.preventDefault()
  //   const token = localStorage.getItem('token')
  //   if (!token) {
  //     router.push('/login')
  //     return
  //   }

  //   try {
  //     const date = newEvent.date ? new Date(newEvent.date) : new Date()
  //     if (isNaN(date.getTime())) throw new Error('Invalid date format')

  //     const response = await fetch('/api/events', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `JWT ${token}`,
  //       },
  //       body: JSON.stringify({
  //         ...newEvent,
  //         date: date.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }),
  //         user: currentUser?.id,
  //       }),
  //     })

  //     if (!response.ok) {
  //       const errorData = await response.json()
  //       throw new Error(`Failed to create event: ${errorData.message || response.statusText}`)
  //     }
  //     const createdEvent = await response.json()
  //     // console.log('<====createdEvent====>', createdEvent)
  //     // const normalizedEvent = {
  //     //   ...createdEvent.doc,
  //     //   date: createdEvent.date
  //     //     ? new Date(createdEvent.date).toLocaleString('en-US', { timeZone: 'Europe/Berlin' })
  //     //     : new Date().toLocaleString('en-US', { timeZone: 'Europe/Berlin' }),
  //     // }
  //     console.log('<====Event====>', createdEvent.doc)
  //     const doc = createdEvent.doc
  //     const normalizedEvent = {
  //       ...doc,
  //       user: doc.user?.email,
  //       date: new Date(createdEvent.doc.date).toLocaleString('en-US', {
  //         timeZone: 'Europe/Berlin',
  //       }),
  //     }
  //     setEvents([...events, normalizedEvent])
  //     setNewEvent({ date: '', title: '', content: '', user: '', status: false })
  //   } catch (err: any) {
  //     setError(err.message || 'Error creating event')
  //   }
  // }

  // const handleDeleteEvent = async (id: string) => {
  //   const token = localStorage.getItem('token')
  //   if (!token) {
  //     router.push('/login')
  //     return
  //   }

  //   try {
  //     const response = await fetch(`/api/events/${id}`, {
  //       method: 'DELETE',
  //       headers: {
  //         Authorization: `JWT ${token}`,
  //       },
  //     })

  //     if (!response.ok) throw new Error('Failed to delete event')
  //     setEvents(events.filter((event) => event.id !== id))
  //   } catch (err) {
  //     setError('Error deleting event')
  //   }
  // }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/login')
  }

  if (loading) return <p className="text-center mt-10">Loading...</p>
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>

  return (
    <div className=" mx-4 mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-center">Your Media</h1>
      {/* <div className="flex flex-col mb-6 items-center gap-2">
        <p className="text-gray-600">
          You are logged in as: <strong>{currentUser?.email}</strong>{' '}
        </p>
        {showAdminLink && (
          <a href="/admin" className="text-blue-500 hover:underline">
            Go to Admin
          </a>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div> */}

      {/* <form onSubmit={handleCreateEvent} className="mb-8 border border-gray-300 rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
        <div className="mb-4">
          <Input
            typeInput="text"
            id="title"
            data="Title"
            name="title"
            value={newEvent.title}
            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            required
          />
        </div>
        <div className="mb-4">
          <Input
            typeInput="text"
            id="Content"
            data="Content"
            name="Content"
            value={newEvent.content}
            onChange={(e) => setNewEvent({ ...newEvent, content: e.target.value })}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="datetime-local"
            value={newEvent.date}
            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
            required
            className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={newEvent.status}
              onChange={(e) => setNewEvent({ ...newEvent, status: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Active</span>
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
        >
          Create Event
        </button>
      </form> */}

      {/* {events.length === 0 ? (
        <p className="text-center text-gray-500">No events found.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((event, index) => (
            <li key={index} className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
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
              <button
                onClick={() => handleDeleteEvent(event.id)}
                className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}   */}
      {media.length === 0 ? (
        <p className="text-center text-gray-500">No media found.</p>
      ) : (
        <ul className="space-y-4">
          {media.map((el, index) => (
            <li key={index} className="p-4 bg-gray-50 rounded-md flex justify-between items-center">
              {el.url ? (
                <img src={el.url} alt={el.alt || 'Media'} className="max-w-xs" />
              ) : (
                <p>No image available</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
