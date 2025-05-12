'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStateContext } from '@/components/StateProvaider'
import toast, { Toaster } from 'react-hot-toast'
import Image from 'next/image'

interface Event {
  id: string
  title: string
  content: string
  date: string
  status: 'active' | 'inactive'
  mediaUrls?: { url: string }[]
  location?: { coordinates: [number, number]; address?: string }
  user?: { id: string; email?: string }
}

interface DeleteEventsModalProps {
  events: Event[]
  setEvents: (events: Event[]) => void
  setShowDeleteModal: (show: boolean) => void
}

const DeleteEventsModal: React.FC<DeleteEventsModalProps> = ({
  events,
  setEvents,
  setShowDeleteModal,
}) => {
  const { token, setIsLoading } = useStateContext()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = searchQuery
    ? events.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : []

  const handleDeleteEvents = async () => {
    if (!token) {
      toast.error('You must be logged in to delete events.')
      return
    }

    if (filteredEvents.length === 0) {
      toast.error('No events found to delete.')
      return
    }

    setIsLoading(true)
    try {
      for (const event of filteredEvents) {
        const response = await fetch(`/api/events/${event.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `JWT ${token}`,
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to delete event')
        }
      }

      // Обновляем состояние, удаляя события
      setEvents(events.filter((event) => !filteredEvents.includes(event)))
      toast.success(
        `${filteredEvents.length} event${filteredEvents.length > 1 ? 's' : ''} deleted successfully`,
      )
      setShowDeleteModal(false)
      setSearchQuery('')
    } catch (err: any) {
      console.error('Error deleting events:', err)
      toast.error(err.message || 'Failed to delete events')
    } finally {
      setIsLoading(false)
      setTimeout(() => toast.dismiss(), 1500)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-[100vw] h-[100vh] fixed top-0 left-0 flex justify-center items-center bg-[rgba(0,0,0,.95)] z-100 p-4"
      >
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <motion.div
          initial={{ scale: 0, y: 0 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-white border border-gray-300 rounded-lg p-4"
        >
          <Image
            onClick={() => setShowDeleteModal(false)}
            src="/assets/svg/cross.svg"
            alt="cross"
            width={24}
            height={24}
            className="absolute top-4 right-4 cursor-pointer z-50 border border-gray-300 rounded-full p-1 hover:bg-gray-200 transition-all duration-200"
          />
          <h2 className="text-xl font-semibold mb-4">Delete Events</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Search by Title</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter event title..."
              className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </h3>
            {searchQuery ? (
              filteredEvents.length > 0 ? (
                <ul className="max-h-64 overflow-y-auto border rounded-md p-2">
                  {filteredEvents.map((event) => (
                    <li key={event.id} className="py-1">
                      {event.title} -{' '}
                      {new Date(event.date).toLocaleString('de-DE', {
                        timeZone: 'Europe/Berlin',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No events found.</p>
              )
            ) : (
              <p className="text-gray-500">Start typing to search events.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteEvents}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              disabled={filteredEvents.length === 0}
            >
              Delete {filteredEvents.length > 0 ? `(${filteredEvents.length})` : ''}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default DeleteEventsModal
