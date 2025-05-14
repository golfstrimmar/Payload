'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button/Button'
import AddEventModal from '@/components/AddEventModal/AddEventModal'
import { useStateContext } from '@/components/StateProvaider'
import { useUserContext } from '@/components/UserContext'
import toast, { Toaster } from 'react-hot-toast'
import Loading from '@/components/Loading/Loading'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Kalendar from '@/components/Kalendar/Kalendar'

// =============================

interface Event {
  id: string
  title: string
  date: string
  content: string
  user?: string
  mediaUrls?: string[]
  location?: {
    coordinates?: {
      type: 'Point'
      coordinates: [number, number] // [lng, lat]
    }
    address?: string
  }
}

export default function EventsPage() {
  const { isLoading, setIsLoading } = useStateContext()
  const { user, role } = useUserContext()
  const router = useRouter()

  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/admin').then(() => {
      setIsLoading(false)
    })
  }

  return (
    <div className=" mx-4 mt-10 p-6 bg-white rounded-lg shadow-md">
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      {isLoading && <Loading />}

      <h2 className="text-center text-2xl font-bold mb-6">Your Events</h2>
      <div className="flex flex-col mb-6 items-center gap-2">
        <p className="text-gray-600 ">
          You are logged in as: <strong>{user}</strong>
        </p>
        <p className="text-gray-600">
          You role: <strong>{role}</strong>
        </p>
        {role === 'admin' && (
          <Link href="/admin" className="text-blue-500 hover:underline" onClick={handleAdminClick}>
            Go to Admin
          </Link>
        )}
      </div>
      <Kalendar />
    </div>
  )
}
