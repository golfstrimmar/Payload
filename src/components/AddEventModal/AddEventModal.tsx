'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import styles from './AddEventModal.module.scss'
import Input from '@/components/ui/Input/Input'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import Image from 'next/image'
import { useStateContext } from '@/components/StateProvaider'
import { useUserContext } from '@/components/UserContext'
import toast, { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import LocationManager from '@/components/LocationManager/LocationManager'
import { date } from 'node_modules/payload/dist/fields/validations'

const EventMap = dynamic(() => import('@/components/EventMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md" />,
})

interface Event {
  id: string
  title: string
  content: string
  date: string
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
// ========================================
// ========================================
// ========================================
const AddEventModal: React.FC<AddEventModalProps> = ({
  setShowCreateModal,
  setEvents,
  currentUser,
  selectedDay,
}) => {
  const { setIsLoading, locations, setFlagLocations, setFlagEvents } = useStateContext()
  const { token, ID } = useUserContext()

  const router = useRouter()
  const [newEvent, setNewEvent] = useState({
    title: '',
    content: '',
    time: '',
    endDateTime: '',
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [location, setLocation] = useState<{
    coordinates: [number, number]
    address: string
  } | null>(null)
  const [showLocationManager, setShowLocationManager] = useState(false)

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

  const parseDateTime = useCallback((dateTimeString: string): Date => {
    try {
      const date = new Date(dateTimeString)
      if (isNaN(date.getTime())) throw new Error('Invalid date format')
      return date
    } catch (e) {
      console.error('Error parsing date:', dateTimeString, e)
      return new Date(NaN)
    }
  }, [])

  const handleSelectLocation = useCallback(
    (selectedLocation: {
      name: string
      coordinates: { latitude: number; longitude: number }[]
    }) => {
      setLocation({
        coordinates: selectedLocation.coordinates[0]
          ? [selectedLocation.coordinates[0].latitude, selectedLocation.coordinates[0].longitude]
          : [0, 0],
        address: selectedLocation.name ? selectedLocation.name : '',
      })
    },
    [],
  )
  // -----------------------------
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

      const selectedDate = new Date(selectedDay)
      const [hours, minutes] = newEvent.time.split(':').map(Number)
      selectedDate.setHours(hours || 0, minutes || 0)
      if (isNaN(selectedDate.getTime())) throw new Error('Invalid start date format')

      const eventBase = {
        title: newEvent.title,
        content: newEvent.content,
        user: ID,
        mediaUrls: mediaUrls.map((url) => ({ url })),
        location: location
          ? { coordinates: location.coordinates, address: location.address }
          : undefined,
      }

      const createdEvents: Event[] = []
      if (newEvent.endDateTime) {
        const endDate = parseDateTime(newEvent.endDateTime)

        if (isNaN(endDate.getTime())) throw new Error('Invalid end date format')
        if (endDate < selectedDate) throw new Error('End date must be after start date')

        const dayOfWeek = selectedDate.getDay()
        const currentDate = new Date(selectedDate)

        while (currentDate <= endDate) {
          if (currentDate.getDay() === dayOfWeek) {
            const eventData = {
              ...eventBase,
              date: currentDate,
            }

            const response = await fetch('/api/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `JWT ${token}`,
              },
              body: JSON.stringify(eventData),
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.message || 'Failed to create event')
            }

            const responseData = await response.json()
            const createdEvent = responseData.doc || responseData

            const normalizedEvent: Event = {
              id: String(createdEvent.id || createdEvent._id || `temp-${Date.now()}`),
              title: createdEvent.title || eventData.title,
              content: createdEvent.content || eventData.content,
              date: createdEvent.date || eventData.date,
              status: createdEvent.status || eventData.status,
              mediaUrls: createdEvent.mediaUrls || eventData.mediaUrls || [],
              location: createdEvent.location || eventData.location,
              user: {
                id: String(createdEvent.user?.id || currentUser?.id),
                email: createdEvent.user?.email || currentUser?.email,
              },
            }

            createdEvents.push(normalizedEvent)
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      } else {
        const eventData = {
          ...eventBase,
          date: selectedDate,
        }
        console.log('<====eventData====>', eventData)
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `JWT ${token}`,
          },
          body: JSON.stringify(eventData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to create event')
        }

        const responseData = await response.json()
        const createdEvent = responseData.doc || responseData

        const normalizedEvent: Event = {
          id: String(createdEvent.id || createdEvent._id || `temp-${Date.now()}`),
          title: createdEvent.title || eventData.title,
          content: createdEvent.content || eventData.content,
          date: createdEvent.date || eventData.date,
          mediaUrls: createdEvent.mediaUrls || eventData.mediaUrls || [],
          location: createdEvent.location || eventData.location,
          user: {
            id: String(createdEvent.user?.id || currentUser?.id),
            email: createdEvent.user?.email || currentUser?.email,
          },
        }

        createdEvents.push(normalizedEvent)
      }

      // setEvents((prev) => [...prev, ...createdEvents])
      setFlagEvents((prev) => !prev)
      toast.success(`Event${createdEvents.length > 1 ? 's' : ''} created successfully`)
      setShowCreateModal(false)
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

  const handleDeleteLocation = async (id: string) => {
    try {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `JWT ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete location')
      }

      toast.success('Location deleted successfully')
      setFlagLocations((prev) => !prev)
    } catch (err: any) {
      console.error('Error deleting location:', err)
      toast.error(err.message || 'Failed to delete location')
    }
  }
  // ----------------renderLocations------------------
  const renderLocations = useMemo(
    () =>
      locations.length > 0 ? (
        <div className="mb-2 rounded-md border border-gray-300 p-2">
          <h3 className="text-lg font-bold text-gray-700 mb-1">Saved Locations:</h3>
          <div className="mb-2  rounded-md ">
            {locations.map((loc) => (
              <p
                key={loc.id}
                onClick={() => handleSelectLocation(loc)}
                className={`cursor-pointer p-1 rounded-md border border-gray-200 transition-all duration-200 bg-slate-100 hover:bg-slate-300 text-gray-600 my-1 flex items-center justify-between ${
                  location?.address === loc.name
                    ? 'bg-slate-600 text-white hover:bg-slate-600 hover:text-white'
                    : ''
                }`}
              >
                {loc.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteLocation(loc.id)
                  }}
                  className="cursor-pointer hover:transform hover:scale-105 transition-transform duration-200"
                >
                  <Image src="/assets/svg/cross.svg" width={15} height={15} alt="delete" />
                </button>
              </p>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 mb-2">No locations saved yet.</p>
      ),
    [locations, location, handleSelectLocation],
  )

  return (
    <AnimatePresence>
      {showLocationManager && (
        <LocationManager
          token={token}
          userId={ID || null}
          onClose={() => setShowLocationManager(false)}
        />
      )}
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
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-300 rounded-lg p-4"
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
            {/* -------------Title------------------ */}
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
            {/* ---------Content---------- */}
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
            {/* -----------Date--------- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="mt-1 w-full p-2 border rounded-md bg-gray-100">
                {new Date(selectedDay).toLocaleDateString('de-DE')}
              </p>
            </div>
            {/* --------------Start Time---------------- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                value={newEvent.time}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                required
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* ---------------End Date and Time----------------- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                End Date and Time (Optional)
              </label>
              <input
                type="datetime-local"
                value={newEvent.endDateTime}
                onChange={(e) => setNewEvent({ ...newEvent, endDateTime: e.target.value })}
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* ======Media====== */}
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
            {/*====== Location ======*/}
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setShowLocationManager(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition cursor-pointer"
                >
                  Add New Location
                </button>
              </div>
              {renderLocations}
              <div className="h-64 w-full">
                <EventMap
                  interactive
                  onLocationSelect={(coords) => {
                    setLocation({ coordinates: coords, address: location?.address || '' })
                  }}
                  selectedLocation={location?.coordinates}
                />
              </div>
            </div>
            <Button buttonText="Create Event" buttonType="submit" />
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AddEventModal
