'use client'
import React, { useState } from 'react'
import styles from './AddEventModal.module.scss'
import Input from '@/components/ui/Input/Input'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import ModalMessage from '@/components/ModalMessage/ModalMessage'
import Image from 'next/image'

interface Event {
  id: string
  title: string
  date: string
  content: string
  status: boolean
  user?: string
  mediaUrls?: string[] // Добавим сюда URLs медиафайлов
}

interface AddEventModalProps {
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
  currentUser: { id: string }
  events: Event[]
  setShowCreateModal: any
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  setEvents,
  currentUser,
  events,
  setShowCreateModal,
}) => {
  const router = useRouter()
  const [newEvent, setNewEvent] = useState({
    date: '',
    title: '',
    content: '',
    user: '',
    status: false,
    mediaUrls: [] as string[], // Новое поле для хранения URLs медиафайлов
  })
  const [showModal, setShowModal] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]) // Хранение выбранных файлов
  const [imagePreviews, setImagePreviews] = useState<string[]>([]) // Превью изображений

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles(filesArray)

      // Генерация превью
      const previews = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...previews]) // Добавляем новые превью в массив
      console.log('Selected files:', filesArray) // Логируем выбранные файлы
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) {
      console.log('No token found, redirecting to login...')
      router.push('/login')
      return
    }

    console.log('Creating event with data:', newEvent)

    try {
      const date = newEvent.date ? new Date(newEvent.date) : new Date()
      if (isNaN(date.getTime())) throw new Error('Invalid date format')

      const mediaUrls: string[] = []

      // Загрузка каждого файла на Cloudinary
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!)

        console.log('Uploading file:', file)

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
        mediaUrls.push(data.url) // Добавляем URL медиафайла в список
        console.log('File uploaded successfully:', data.url)
      }

      console.log('All media URLs:', mediaUrls)

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          ...newEvent,
          date: date.toISOString(),
          user: currentUser?.id,
          mediaUrls: mediaUrls.map((url) => ({ url })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(`Failed to create event: ${errorData.message || response.statusText}`)
      }

      const createdEvent = await response.json()
      console.log('<====Event Created====>', createdEvent)

      const doc = createdEvent.doc
      const normalizedEvent = {
        ...doc,
        user: doc.user?.email,
        date: new Date(doc.date).toLocaleString('en-US', { timeZone: 'Europe/Berlin' }),
      }
      console.log('Normalized event:', normalizedEvent)

      setEvents([...events, normalizedEvent])
      setNewEvent({ date: '', title: '', content: '', user: '', status: false, mediaUrls: [] })
      setSelectedFiles([]) // Очистить выбранные файлы
      setImagePreviews([]) // Очистить превью
    } catch (err: any) {
      console.error('Error in handleCreateEvent:', err.message)
      setError(err.message || 'Error creating event')
      setShowModal(true)
      setTimeout(() => {
        setShowModal(false)
        setError('')
      }, 1500)
    } finally {
      setShowCreateModal(false)
    }
  }

  return (
    <div className="w-[100vw] h-[100vh] fixed top-0 left-0 flex justify-center items-center bg-[rgba(0,0,0,.95)] z-100 p-4">
      <form
        onSubmit={handleCreateEvent}
        className="w-full relative mb-8 bg-white border border-gray-300 rounded-lg p-4"
      >
        <Image
          onClick={(e) => {
            e.stopPropagation()
            setShowCreateModal(false)
          }}
          src="/assets/svg/cross.svg"
          alt="cross"
          width={100}
          height={100}
          className="absolute top-4 right-4 cursor-pointer z-50 w-6 h-6 border border-gray-300 rounded-full p-1 hover:bg-gray-200 shadow-inner shadow-md transition-all duration-200 ease-in-out"
        />
        {error && <ModalMessage message={error} open={showModal} />}
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

        {/* Инпут для загрузки файлов */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Media</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Превью изображений */}
        {imagePreviews.length > 0 && (
          <div className="mb-4 flex space-x-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="w-24 h-24 bg-gray-200 p-2 rounded-md">
                <img
                  src={preview}
                  alt={`Preview ${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <Button buttonText="Create Event" buttonType="submit" />
      </form>
    </div>
  )
}

export default AddEventModal
