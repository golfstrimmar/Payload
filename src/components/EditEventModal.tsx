'use client'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import styles from './EditEventModal.module.scss'
import Input from '@/components/ui/Input/Input'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import ModalMessage from '@/components/ModalMessage/ModalMessage'
import Image from 'next/image'
import { useStateContext } from '@/components/StateProvaider'
import Loading from '@/components/Loading/Loading'
import toast, { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { time } from 'console'
import LocationManager from '@/components/LocationManager/LocationManager'
const EventMap = dynamic(() => import('@/components/EventMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />,
})

interface Event {
  id: string
  title: string
  date: string
  time: string
  content: string
  status: 'active' | 'inactive'
  user?: { email: string; id: string }
  mediaUrls?: { url: string }[]
  location?: {
    coordinates?: {
      type: 'Point'
      coordinates: [number, number] // [lng, lat]
    }
    address?: string
  }
}

interface EditEventModalProps {
  event: Event
  setShowEditModal: (show: boolean) => void
}
// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
const EditEventModal: React.FC<EditEventModalProps> = ({ event, setShowEditModal }) => {
  const router = useRouter()

  const {
    ID: currentUserId,
    token,
    setFlagEvents,
    events,
    locations,
    setFlagLocations,
  } = useStateContext()
  const [editedEvent, setEditedEvent] = useState<Event>(
    events.find((e) => String(e.id) === String(event)) || {},
  )
  const [showLocationManager, setShowLocationManager] = useState(false)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(
    event.mediaUrls?.map((media) => media.url) || [],
  )
  const [location, setLocation] = useState<{
    coordinates: [number, number]
    address: string
  } | null>(null)
  const { isLoading, setIsLoading, ID } = useStateContext()

  useEffect(() => {
    if (event) {
      console.log('<==== editedEvent====>', editedEvent)
    }
  }, [editedEvent])

  useEffect(() => {
    if (event) {
      setExistingMediaUrls(event.mediaUrls?.map((media) => media.url) || [])
    }
  }, [event])
  const toggleStatus = useCallback(() => {
    setEditedEvent((prev) => ({
      ...prev,
      status: prev.status === 'active' ? 'inactive' : 'active',
    }))
  }, [])
  // ----------------renderLocations------------------
  const handleSelectLocation = useCallback(
    (selectedLocation: {
      name: string
      coordinates: { latitude: number; longitude: number }[]
    }) => {
      setLocation({
        coordinates: selectedLocation.coordinates[0]
          ? [selectedLocation.coordinates[0].latitude, selectedLocation.coordinates[0].longitude]
          : [0, 0],
        address: selectedLocation.name || '',
      })
    },
    [],
  )
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
  // --------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(filesArray)
      const previews = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...previews])
    }
  }

  const handleRemoveExistingImage = (urlToRemove: string) => {
    setExistingMediaUrls((prev) => prev.filter((url) => url !== urlToRemove))
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

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    if (!token) {
      console.log('No token found, redirecting to login...')
      router.push('/login')
      return
    }

    try {
      const date = editedEvent.date ? new Date(editedEvent.date) : new Date()
      if (isNaN(date.getTime())) throw new Error('Invalid date format')

      const newMediaUrls: string[] = []

      // Загрузка новых файлов на Cloudinary
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error uploading file:', errorData)
          throw new Error('Failed to upload file')
        }

        const data = await response.json()
        newMediaUrls.push(data.url)
      }

      // Объединяем существующие (не удаленные) и новые URL
      const allMediaUrls = [...existingMediaUrls, ...newMediaUrls]
      // Обновляем date
      const newEventDate = new Date(editedEvent.date)
      const [hours, minutes] = editedEvent.time.split(':').map(Number)
      newEventDate.setHours(hours || 0, minutes || 0)
      const response = await fetch(`/api/events/${event}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ...editedEvent,
          date: newEventDate,
          user: currentUserId,
          mediaUrls: allMediaUrls.map((url) => ({ url })),
          location: location
            ? {
                coordinates: {
                  type: 'Point',
                  coordinates: location.coordinates,
                },
                address: location.address,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(`Failed to update event: ${errorData.message || response.statusText}`)
      }

      const updatedEvent = await response.json()
      console.log('<====Event Updated====>', updatedEvent.doc)
      toast.success('Event Updated Successfully.')
      setFlagEvents((prev) => !prev)
      setShowEditModal(false)
      setIsLoading(false)
    } catch (err: any) {
      console.error('Error in handleUpdateEvent:', err.message)
      toast.error(err.message || 'Error fetching event')
    } finally {
      setTimeout(() => {
        setIsLoading(false)
      }, 1500)
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
        {isLoading && <Loading />}
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <motion.div
          initial={{ scale: 0, y: 0 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-2xl"
        >
          {showLocationManager && (
            <LocationManager
              token={token}
              userId={ID || null}
              onClose={() => setShowLocationManager(false)}
            />
          )}
          <form
            onSubmit={handleUpdateEvent}
            className="w-full relative mb-8 bg-white border border-gray-300 rounded-lg p-4"
          >
            <Image
              onClick={(e) => {
                e.stopPropagation()
                setShowEditModal(false)
              }}
              src="/assets/svg/cross.svg"
              alt="cross"
              width={100}
              height={100}
              className="absolute top-4 right-4 cursor-pointer z-50 w-6 h-6 border border-gray-300 rounded-full p-1 hover:bg-gray-200 shadow-inner shadow-md transition-all duration-200 ease-in-out"
            />
            {error && <ModalMessage message={error} open={showModal} />}
            <h2 className="text-xl font-semibold mb-4">Edit Event</h2>

            <div className="mb-4">
              <Input
                typeInput="text"
                id="title"
                data="Title"
                name="title"
                value={editedEvent.title}
                onChange={(e) => setEditedEvent({ ...editedEvent, title: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <Input
                typeInput="text"
                id="Content"
                data="Content"
                name="Content"
                value={editedEvent.content}
                onChange={(e) => setEditedEvent({ ...editedEvent, content: e.target.value })}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={editedEvent.date}
                onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
                required
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="time"
                value={editedEvent.time}
                onChange={(e) => setEditedEvent({ ...editedEvent, time: e.target.value })}
                required
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedEvent.status}
                  onChange={(e) => setEditedEvent({ ...editedEvent, status: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
            {/* ----------Status--------- */}
            <div className="mb-4 flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={editedEvent.status === 'active'}
                    onChange={toggleStatus}
                    className="sr-only"
                  />
                  <div
                    className={`block w-14 h-8 rounded-full ${editedEvent.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'}`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${editedEvent.status === 'active' ? 'transform translate-x-6' : ''}`}
                  ></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">
                  {editedEvent.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </label>
            </div>
            {/* ------------------- */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Add More Media</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {existingMediaUrls.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Existing Media</h3>
                <div className="flex flex-wrap gap-4">
                  {existingMediaUrls.map((url, index) => (
                    <div
                      key={`existing-${index}`}
                      className="relative w-24 h-24 bg-gray-200 p-2 rounded-md"
                    >
                      <img
                        src={url}
                        alt={`Existing ${index}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(url)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {imagePreviews.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">New Media</h3>
                <div className="flex-nowrap gap-4 flex">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`new-${index}`}
                      className="relative w-24 h-24 bg-gray-200 p-2 rounded-md overflow-hidden flex items-center justify-center"
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

            {/* Location */}
            <div className="mb-4 h-64 w-full">
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
              <EventMap
                interactive
                onLocationSelect={(coords) => {
                  setLocation({
                    coordinates: coords,
                    address: '',
                  })
                }}
                selectedLocation={location?.coordinates}
                initialPosition={
                  !location?.coordinates ? editedEvent.location?.coordinates : undefined
                }
              />
              {location && (
                <div className="mt-2 text-sm">Selected: {location.coordinates.join(', ')}</div>
              )}
            </div>

            <Button buttonText="Update Event" buttonType="submit" />
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EditEventModal
