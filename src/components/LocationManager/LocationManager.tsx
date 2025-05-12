'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import toast, { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const EventMap = dynamic(() => import('@/components/EventMap').then((mod) => mod.default), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md" />,
})

interface Location {
  id: string
  name: string
  user: { id: string }
  coordinates: { latitude: number; longitude: number }[]
}

interface LocationManagerProps {
  token: string | null
  userId: string | null
  onClose: () => void
}

const LocationManager: React.FC<LocationManagerProps> = ({ token, userId, onClose }) => {
  const [locationName, setLocationName] = useState('')
  const [coords, setCoords] = useState<[number, number] | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!token || !userId) {
      toast.error('You must be logged in to save locations.')
      setIsLoading(false)
      return
    }

    if (!locationName.trim()) {
      toast.error('Please enter a location name.')
      setIsLoading(false)
      return
    }

    if (!coords) {
      toast.error('Please select a location on the map.')
      setIsLoading(false)
      return
    }

    try {
      const locationData = {
        name: locationName.trim(),
        user: userId,
        coordinates: [
          {
            latitude: coords[0],
            longitude: coords[1],
          },
        ],
      }

      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify(locationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save location')
      }

      const responseData = await response.json()
      const createdLocation: Location = {
        id: String(responseData.doc?.id || responseData.id),
        name: responseData.doc?.name || locationData.name,
        user: { id: userId },
        coordinates: responseData.doc?.coordinates || locationData.coordinates,
      }

      toast.success('Location saved successfully')
      setLocationName('')
      setCoords(null)
      onClose()
    } catch (err: any) {
      console.error('Error saving location:', err.message, err.stack)
      toast.error(err.message || 'Failed to save location')
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
            onClick={onClose}
            src="/assets/svg/cross.svg"
            alt="cross"
            width={24}
            height={24}
            className="absolute top-4 right-4 cursor-pointer z-50 border border-gray-300 rounded-full p-1 hover:bg-gray-200 transition-all duration-200"
          />
          <form onSubmit={handleSaveLocation}>
            <h2 className="text-xl font-semibold mb-4">Add Location</h2>
            <div className="mb-4 h-64 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Location on Map
              </label>
              <EventMap
                interactive
                onLocationSelect={(coords) => setCoords(coords)}
                selectedLocation={coords}
              />
              {coords && <div className="mt-2 text-sm">Selected: {coords.join(', ')}</div>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Location Name</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Enter location name"
                className="mt-1 w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Saving...' : 'Save Location'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default LocationManager
