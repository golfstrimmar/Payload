'use client'
import React, { useState, useEffect } from 'react'
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

interface Event {
  id: string
  title: string
  date: string
  content: string
  status: boolean
  user?: { email: string; id: string }
  mediaUrls?: { url: string }[]
}

interface EditEventModalProps {
  event: Event
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
  setShowEditModal: (show: boolean) => void
}

const EditEventModal: React.FC<EditEventModalProps> = ({ event, setEvents, setShowEditModal }) => {
  const router = useRouter()
  const { ID: currentUserId, token } = useStateContext()
  const [editedEvent, setEditedEvent] = useState<Event>(event)
  const [showModal, setShowModal] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(
    event.mediaUrls?.map((media) => media.url) || [],
  )
  const { isLoading, setIsLoading } = useStateContext()

  // Преобразуем дату в формат, подходящий для datetime-local
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''

    const pad = (num: number) => num.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  useEffect(() => {
    if (event) {
      setEditedEvent({
        ...event,
        date: formatDateForInput(event.date), // Форматируем дату при инициализации
      })
      setExistingMediaUrls(event.mediaUrls?.map((media) => media.url) || [])
    }
  }, [event])

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

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ...editedEvent,
          date: date.toISOString(),
          user: currentUserId,
          mediaUrls: allMediaUrls.map((url) => ({ url })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(`Failed to update event: ${errorData.message || response.statusText}`)
      }

      const updatedEvent = await response.json()
      console.log('<====Event Updated====>', updatedEvent)

      toast.success('Event Updated Successfully.')

      setEvents((prevEvents) =>
        prevEvents.map((ev) =>
          ev.id === event.id
            ? {
                ...updatedEvent.doc,
                date: new Date(updatedEvent.doc.date).toLocaleString('en-US', {
                  timeZone: 'Europe/Berlin',
                }),
                user: event.user,
              }
            : ev,
        ),
      )
      setShowEditModal(false)
      setIsLoading(false)
      setTimeout(() => {
        toast.dismiss()
      }, 1500)
    } catch (err: any) {
      console.error('Error in handleUpdateEvent:', err.message)
      toast.error(err.message || 'Error fetching event')
    } finally {
      setTimeout(() => {
        toast.dismiss()
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
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <motion.div
          initial={{ scale: 0, y: 0 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-2xl"
        >
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
                type="datetime-local"
                value={editedEvent.date}
                onChange={(e) => setEditedEvent({ ...editedEvent, date: e.target.value })}
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
                <div className="flex-nowrap gap-4 flex ">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={`new-${index}`}
                      className="relative w-24 h-24 bg-gray-200 p-2 rounded-md overflow-hidden    flex items-center justify-center"
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

            <Button buttonText="Update Event" buttonType="submit" />
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default EditEventModal
