'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import styles from './EditEventModal.module.scss'
import Input from '@/components/ui/Input/Input'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import Image from 'next/image'
import { useStateContext } from '@/components/StateProvaider'
import { useUserContext } from '@/components/UserContext'
import { useLocationsContext } from '@/components/LocationsContext'
import toast, { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import LocationManager from '@/components/LocationManager/LocationManager'
import ClockUhr from '@/components/ui/ClockUhr/ClockUhr'
import Calendar from '@/components/ui/Calendar/Calendar'

const EventMap = dynamic(() => import('@/components/EventMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md" />,
})

interface Media {
  id: string
  url: string
  alt?: string
  thumbnailURL?: string
}

interface Event {
  id: string
  title: string
  content: string
  date: string
  time?: string
  mediaUrls?: string[]
  location?: { coordinates: [number, number]; address?: string }
  user?: { id: string; email?: string }
}

interface EditEventModalProps {
  event: string // ID события
  setShowEditModal: (show: boolean) => void
  currentUser: { id: string; email?: string } | null
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  event,
  setShowEditModal,
  currentUser,
}) => {
  const { locations, setFlagLocations } = useLocationsContext()
  const { token, ID } = useUserContext()
  const { setIsLoading, setFlagEvents, events } = useStateContext()
  const router = useRouter()

  // Инициализация состояния события
  const initialEvent = events.find((e) => String(e.id) === String(event)) || {
    id: event,
    title: '',
    content: '',
    date: '',
    time: '00:00',
    mediaUrls: [],
    location: undefined,
    user: currentUser,
  }

  const [editedEvent, setEditedEvent] = useState({
    title: initialEvent.title || '',
    content: initialEvent.content || '',
    date: new Date(initialEvent.date).toISOString().split('T')[0],
    time: initialEvent.time || '00:00',
    endDate: '',
    endTime: '',
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(initialEvent.mediaUrls || [])
  const [savedMedia, setSavedMedia] = useState<Media[]>([])
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([])
  const [selectedMediaPreviews, setSelectedMediaPreviews] = useState<string[]>([])
  const [location, setLocation] = useState<{
    coordinates: [number, number]
    address: string
  } | null>(
    initialEvent.location
      ? {
          coordinates: initialEvent.location.coordinates,
          address: initialEvent.location.address || '',
        }
      : null,
  )
  const [showLocationManager, setShowLocationManager] = useState(false)

  // Загрузка медиа из Payload
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media', {
          headers: {
            Authorization: `JWT ${token}`,
          },
        })
        if (!response.ok) throw new Error('Failed to fetch media')
        const data = await response.json()
        const uniqueMedia = Array.from(
          new Map(data.docs.map((item: Media) => [item.id, item])).values(),
        )
        setSavedMedia(uniqueMedia)
        console.log('<==== savedMedia ====>', uniqueMedia)

        // Инициализация selectedMediaIds и selectedMediaPreviews на основе existingMediaUrls
        const initialMediaIds = uniqueMedia
          .filter((media) => existingMediaUrls.includes(media.url))
          .map((media) => media.id)
        setSelectedMediaIds(initialMediaIds)
        setSelectedMediaPreviews(existingMediaUrls)
      } catch (err) {
        console.error('Error fetching media:', err)
        toast.error('Failed to load saved media')
      }
    }
    if (token) fetchMedia()
  }, [token, existingMediaUrls])

  useEffect(() => {
    if (existingMediaUrls) {
      console.log('<==== existingMediaUrls ====>', existingMediaUrls)
    }
  }, [existingMediaUrls])

  // Обработка загрузки новых файлов
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
      const previews = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...previews])
    }
  }

  // Удаление нового изображения
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

  // Удаление существующего изображения
  const handleRemoveExistingImage = (urlToRemove: string) => {
    setExistingMediaUrls((prev) => prev.filter((url) => url !== urlToRemove))
    setSelectedMediaPreviews((prev) => prev.filter((url) => url !== urlToRemove))
    setSelectedMediaIds((prev) => {
      const media = savedMedia.find((m) => m.url === urlToRemove || m.thumbnailURL === urlToRemove)
      if (media) {
        return prev.filter((id) => id !== media.id)
      }
      return prev
    })
  }

  // Выбор/удаление сохранённого медиа
  const handleSelectSavedMedia = useCallback((mediaId: string, url: string) => {
    console.log('<==== handleSelectSavedMedia ====>', { mediaId, url })
    setSelectedMediaIds((prev) => {
      if (prev.includes(mediaId)) {
        setSelectedMediaPreviews((prevPreviews) => {
          const newPreviews = prevPreviews.filter((p) => p !== url)
          console.log('<==== Removing preview ====>', newPreviews)
          return newPreviews
        })
        setExistingMediaUrls((prev) => prev.filter((u) => u !== url))
        return prev.filter((id) => id !== mediaId)
      } else {
        setSelectedMediaPreviews((prevPreviews) => {
          if (prevPreviews.includes(url)) return prevPreviews
          const newPreviews = [...prevPreviews, url]
          console.log('<==== Adding preview ====>', newPreviews)
          return newPreviews
        })
        setExistingMediaUrls((prev) => {
          if (prev.includes(url)) return prev
          return [...prev, url]
        })
        return [...prev, mediaId]
      }
    })
  }, [])

  // UI для сохранённых медиа (только невыбранные)
  const renderSavedMedia = useMemo(() => {
    const availableMedia = savedMedia.filter((media) => !selectedMediaIds.includes(media.id))
    return availableMedia.length > 0 ? (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Available Media</h3>
        <div className="flex flex-wrap gap-4">
          {availableMedia.map((media) => (
            <div
              key={media.id}
              className="relative w-24 h-24 bg-gray-200 p-2 rounded-md overflow-hidden cursor-pointer shadow-custom-media"
              onClick={() => handleSelectSavedMedia(media.id, media.thumbnailURL || media.url)}
            >
              <img
                src={media.thumbnailURL || media.url}
                alt={media.alt || 'Saved media'}
                className="w-full h-full object-cover shadow-custom-inset"
              />
            </div>
          ))}
        </div>
      </div>
    ) : (
      <p className="text-gray-500 mb-4">No available media.</p>
    )
  }, [savedMedia, selectedMediaIds, handleSelectSavedMedia])

  // UI для выбранных медиа (новые + предсохранённые)
  const renderSelectedMedia = useMemo(() => {
    const allPreviews = [...imagePreviews, ...selectedMediaPreviews]
    console.log('<==== renderSelectedMedia previews ====>', allPreviews)
    return allPreviews.length > 0 ? (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Media</h3>
        <div className="flex flex-wrap gap-4">
          {allPreviews.map((preview, index) => (
            <div
              key={`selected-${preview}-${index}`}
              className="relative w-24 h-24 bg-gray-200 p-2 rounded-md overflow-hidden shadow-custom-media"
            >
              <img
                src={preview}
                alt={`Preview ${index}`}
                className="w-full h-full object-cover shadow-custom-inset"
              />
              <button
                type="button"
                onClick={() =>
                  imagePreviews.includes(preview)
                    ? handleRemoveNewImage(preview)
                    : handleRemoveExistingImage(preview)
                }
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    ) : null
  }, [imagePreviews, selectedMediaPreviews])

  // Выбор локации
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

  // Удаление локации
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

  // Рендеринг списка локаций
  const renderLocations = useMemo(
    () =>
      locations.length > 0 ? (
        <div className="mb-2 rounded-md border border-gray-300 p-2">
          <h3 className="text-lg font-bold text-gray-700 mb-1">Saved Locations:</h3>
          <div className="mb-2 rounded-md">
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

  // Обработка изменения даты
  const handleDateChange = (date: Date, field: 'date' | 'endDate') => {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    const year = newDate.getFullYear()
    const month = String(newDate.getMonth() + 1).padStart(2, '0')
    const day = String(newDate.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    setEditedEvent((prev) => ({ ...prev, [field]: formattedDate }))
  }

  // Парсинг даты и времени
  const parseDateTime = useCallback((dateString: string, timeString: string): Date => {
    try {
      if (!dateString || !timeString) throw new Error('Date or time missing')
      const [year, month, day] = dateString.split('-').map(Number)
      const [hours, minutes] = timeString.split(':').map(Number)
      const date = new Date(year, month - 1, day, hours, minutes)
      if (isNaN(date.getTime())) throw new Error('Invalid date format')
      return date
    } catch (e) {
      console.error('Error parsing date:', dateString, timeString, e)
      return new Date(NaN)
    }
  }, [])

  // Обновление события
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!token) {
      toast.error('You must be logged in to update an event.')
      router.push('/login')
      setIsLoading(false)
      return
    }

    try {
      // Загрузка новых файлов на Cloudinary
      const newMediaUrls: string[] = []
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
        newMediaUrls.push(data.url)
      }

      // Объединяем существующие, новые и предсохранённые URL
      const allMediaUrls = [...existingMediaUrls, ...newMediaUrls]

      // Формируем дату
      const selectedDate = new Date(editedEvent.date)
      const [hours, minutes] = editedEvent.time.split(':').map(Number)
      selectedDate.setHours(hours || 0, minutes || 0)
      if (isNaN(selectedDate.getTime())) throw new Error('Invalid date format')

      const eventData = {
        title: editedEvent.title,
        content: editedEvent.content,
        user: ID,
        date: selectedDate.toISOString(),
        mediaUrls: allMediaUrls.length > 0 ? allMediaUrls : [],
        location: location
          ? { coordinates: location.coordinates, address: location.address }
          : undefined,
      }

      console.log('<==== eventData ====>', eventData)

      const response = await fetch(`/api/events/${event}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update event')
      }

      const responseData = await response.json()
      console.log('<==== responseData ====>', responseData)

      const updatedEvent = responseData.doc || responseData
      console.log('<==== updatedEvent.mediaUrls ====>', updatedEvent.mediaUrls)

      const normalizedEvent: Event = {
        id: String(updatedEvent.id || updatedEvent._id || event),
        title: updatedEvent.title || eventData.title,
        content: updatedEvent.content || eventData.content,
        date: updatedEvent.date || eventData.date,
        mediaUrls: updatedEvent.mediaUrls || eventData.mediaUrls || [],
        location: updatedEvent.location || eventData.location,
        user: {
          id: String(updatedEvent.user?.id || currentUser?.id),
          email: updatedEvent.user?.email || currentUser?.email,
        },
      }

      setFlagEvents((prev) => !prev)
      toast.success('Event updated successfully')
      setShowEditModal(false)
      setSelectedFiles([])
      setImagePreviews([])
      setSelectedMediaIds([])
      setSelectedMediaPreviews([])
      setLocation(null)
      setEditedEvent({
        title: '',
        content: '',
        date: '',
        time: '00:00',
        endDate: '',
        endTime: '',
      })
    } catch (err: any) {
      console.error('Error updating event:', err)
      toast.error(err.message || 'Failed to update event')
    } finally {
      setIsLoading(false)
      setTimeout(() => toast.dismiss(), 1500)
    }
  }

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
        className="w-[100vw] h-[100vh] fixed top-0 pt-20 sm:pt-0 left-0 flex justify-center items-center bg-[rgba(0,0,0,.95)] z-100 p-4"
      >
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

        <motion.div
          initial={{ scale: 0, y: 0 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-300 rounded-lg p-1 sm:p-4"
        >
          <form
            onSubmit={handleUpdateEvent}
            className="w-full relative mb-8 bg-white border border-gray-300 rounded-lg p-1 sm:p-4"
          >
            <Image
              onClick={() => setShowEditModal(false)}
              src="/assets/svg/cross.svg"
              alt="cross"
              width={24}
              height={24}
              className="absolute top-2 right-2 cursor-pointer z-50 border border-gray-300 rounded-full p-1 hover:bg-gray-200 transition-all duration-200"
            />
            <h2 className="text-xl font-semibold mb-4">Edit Event</h2>
            {/* Title */}
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
            {/* Content */}
            <div className="mb-4">
              <Input
                typeInput="textarea"
                id="content"
                data="Content"
                name="content"
                value={editedEvent.content}
                onChange={(e) => setEditedEvent({ ...editedEvent, content: e.target.value })}
                required
              />
            </div>
            {/* Start Date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Date:{' '}
                {editedEvent.date
                  ? new Date(editedEvent.date).toLocaleDateString('de-DE')
                  : 'Not Selected'}
              </label>
              <Calendar
                selectedDate={new Date(editedEvent.date)}
                handleDateChange={(date) => handleDateChange(date, 'date')}
              />
            </div>
            {/* Start Time */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time: {editedEvent.time}
              </label>
              <ClockUhr
                value={editedEvent.time}
                onChange={(e) => setEditedEvent({ ...editedEvent, time: e.target.value })}
              />
            </div>
            {/* End Date and Time */}
            {/* <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                End Date (Optional):
                {editedEvent.endDate
                  ? new Date(editedEvent.endDate).toLocaleDateString('de-DE', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                  : 'Not Selected'}
              </label>
              <label className="block text-sm font-medium text-gray-700">
                End Time (Optional): {editedEvent.endTime || 'Not Selected'}
              </label>
              <br className="my-1" />
              <Calendar
                selectedDate={editedEvent.endDate ? new Date(editedEvent.endDate) : undefined}
                handleDateChange={(date) => handleDateChange(date, 'endDate')}
              />
              <br className="my-1" />
              <ClockUhr
                value={editedEvent.endTime}
                onChange={(e) => setEditedEvent({ ...editedEvent, endTime: e.target.value })}
              />
            </div> */}
            {/* Media */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Add Media</label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
            </div>
            {/* Saved Media */}
            {renderSavedMedia}
            {/* Selected Media (существующие, новые, предсохранённые) */}
            {renderSelectedMedia}
            {/* Location */}
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
            <Button buttonText="Update Event" buttonType="submit" />
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EditEventModal
