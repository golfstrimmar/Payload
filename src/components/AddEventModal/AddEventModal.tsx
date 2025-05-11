'use client'

import React, { useState } from 'react'
import styles from './AddEventModal.module.scss'
import Input from '@/components/ui/Input/Input'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import Image from 'next/image'
import { useStateContext } from '@/components/StateProvaider'
import toast, { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

const EventMap = dynamic(() => import('@/components/EventMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md" />,
})

interface Event {
  id: string
  title: string
  content: string
  date: string
  status: boolean
  mediaUrls?: { url: string }[]
  location?: { coordinates: [number, number]; address?: string }
  user?: { id: string; email?: string }
}

interface AddEventModalProps {
  setShowCreateModal: (show: boolean) => void
  setEvents: (events: Event[]) => void
  currentUser: { id: string; email?: string } | null
  selectedDay: string
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  setShowCreateModal,
  setEvents,
  currentUser,
  selectedDay,
}) => {
  const router = useRouter()
  const { token, setIsLoading } = useStateContext()
  const [newEvent, setNewEvent] = useState({
    title: '',
    content: '',
    time: '',
    status: true,
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [location, setLocation] = useState<{
    coordinates: [number, number]
    address: string
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(filesArray)
      const previews = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...previews])
    }
  }

  const handleRemoveNewImage = (previewToRemove: string) => {
    setImagePreviews((prev) => prev.filter((preview) => preview !== previewToRemove))
    setSelectedFiles((prev) => {
      const index = imagePreviews.indexOf(previewToRemove)
      if (index !== -1) {
        const newFiles = [...prev]
        newFiles.splice(index, 1)
        return newFiles
      }
      return prev
    })
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!token) {
      toast.error('You must be logged in to create an event.')
      router.push('/login')
      setIsLoading(false)
      return
    }

    try {
      const selectedDate = new Date(selectedDay)
      const [hours, minutes] = newEvent.time.split(':').map(Number)
      selectedDate.setHours(hours || 0, minutes || 0)

      if (isNaN(selectedDate.getTime())) throw new Error('Invalid date format')

      const mediaUrls: string[] = []
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) throw new Error('Failed to upload file')
        const data = await response.json()
        mediaUrls.push(data.url)
      }

      const eventData = {
        title: newEvent.title,
        content: newEvent.content,
        date: selectedDate.toISOString(),
        status: newEvent.status,
        user: currentUser?.id,
        mediaUrls: mediaUrls.map((url) => ({ url })),
        location: location
          ? { coordinates: location.coordinates, address: location.address }
          : undefined,
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(eventData),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers.get('content-type'))

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create event')
      }

      const responseData = await response.json()
      const createdEvent = responseData.doc || responseData
      console.log('<==== Created event ====>', createdEvent)

      const normalizedEvent: Event = {
        id: String(createdEvent.id || createdEvent._id || `temp-${Date.now()}`),
        title: createdEvent.title || eventData.title,
        content: createdEvent.content || eventData.content,
        date: createdEvent.date || eventData.date,
        status: createdEvent.status ?? eventData.status,
        mediaUrls: createdEvent.mediaUrls || eventData.mediaUrls || [],
        location: createdEvent.location || eventData.location,
        user: {
          id: String(createdEvent.user?.id || currentUser?.id),
          email: createdEvent.user?.email || currentUser?.email,
        },
      }

      setEvents((prev) => [...prev, normalizedEvent])
      console.log('New event added:', normalizedEvent)

      toast.success('Event created successfully')
      setShowCreateModal(false)
      setNewEvent({ title: '', content: '', time: '', status: true })
      setSelectedFiles([])
      setImagePreviews([])
      setLocation(null)
    } catch (err: any) {
      console.error('Error creating event:', err)
      toast.error(err.message || 'Failed to create event')
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
          className="w-full max-w-2xl"
        >
          <form
            onSubmit={handleCreateEvent}
            className="w-full relative mb-8 bg-white border border-gray-300 rounded-lg p-4"
          >
            <Image
              onClick={() => setShowCreateModal(false)}
              src="/assets/svg/cross.svg"
              alt="cross"
              width={24}
              height={24}
              className="absolute top-4 right-4 cursor-pointer z-50 border border-gray-300 rounded-full p-1 hover:bg-gray-200 transition-all duration-200"
            />
            <h2 className="text-xl font-semibold mb-4">Create Event</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="mt-1 w-full p-2 border rounded-md bg-gray-100">
                {new Date(selectedDay).toLocaleDateString('de-DE')}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                required
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
                id="content"
                data="Content"
                name="content"
                value={newEvent.content}
                onChange={(e) => setNewEvent({ ...newEvent, content: e.target.value })}
                required
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Add Media</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">New Media</h3>
                <div className="flex flex-wrap gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`new-${index}`}
                      className="relative w-24 h-24 bg-gray-200 p-2 rounded-md"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(preview)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4 h-64 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Location
              </label>
              <EventMap
                interactive
                onLocationSelect={(coords) => {
                  setLocation({ coordinates: coords, address: '' })
                }}
                selectedLocation={location?.coordinates}
              />
              {location && (
                <div className="mt-2 text-sm">Selected: {location.coordinates.join(', ')}</div>
              )}
            </div>
            <Button buttonText="Create Event" buttonType="submit" />
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AddEventModal
