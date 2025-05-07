'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsAuthenticated(false)
        setIsAdmin(false)
        return
      }

      try {
        const response = await fetch('/api/users/me', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (response.ok) {
          const { user } = await response.json()
          setIsAuthenticated(true)
          setIsAdmin(user.role === 'admin')
        } else {
          setIsAuthenticated(false)
          setIsAdmin(false)
        }
      } catch (err) {
        setIsAuthenticated(false)
        setIsAdmin(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setIsAdmin(false)
    router.push('/login')
  }

  return (
    <nav className="bg-blue-600 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          <Link href="/">My App</Link>
        </div>
        <div className="flex space-x-4">
          <Link href="/" className="text-white hover:text-blue-200">
            Home
          </Link>
          {isAuthenticated && (
            <Link href="/events" className="text-white hover:text-blue-200">
              Events
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="text-white hover:text-blue-200">
              Admin
            </Link>
          )}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="text-white hover:text-blue-200">
              Logout
            </button>
          ) : (
            <Link href="/login" className="text-white hover:text-blue-200">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
