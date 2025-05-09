'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

import { useStateContext } from '@/components/StateProvaider'
import { useRouter, useParams, usePathname } from 'next/navigation'

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { user, setToken, setUser } = useStateContext()
  const pathname = usePathname()
  const [activeLink, setactiveLink] = useState<string>('')
  useEffect(() => {
    setactiveLink(pathname)
  }, [pathname])

  useEffect(() => {
    if (user) {
      setIsAuthenticated(true)
    }
  }, [user])

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
    } catch (err) {
      console.error('Error logging out:', err)
    }
    setToken('')
    setUser('')
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setIsAdmin(false)
    router.push('/')
  }

  return (
    <nav className="bg-blue-600 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          <Link href="/">My App</Link>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/"
            className={`  hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out ${activeLink === '/' ? 'underline  text-white text-shadow-[0_0_2px_rgba(0_0_0)] ' : 'text-blue-200'}`}
          >
            Home
          </Link>

          {isAuthenticated && (
            <Link
              href="/events"
              className={`  hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out ${activeLink === '/events' ? 'underline  text-white text-shadow-[0_0_2px_rgba(0_0_0)] ' : 'text-blue-200'}`}
            >
              Events
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className={`  hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out ${activeLink === '/admin' ? 'underline  text-white text-shadow-[0_0_2px_rgba(0_0_0)] ' : 'text-blue-200'}`}
            >
              Admin
            </Link>
          )}
          {isAuthenticated && (
            <div className="flex items-center space-x-2">
              <span>User:</span>
              <h2 className="text-blue-200 font-bold lh-1">{user}</h2>
            </div>
          )}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="text-blue-200 hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className={`hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out ${activeLink === '/login' ? 'underline  text-white text-shadow-[0_0_2px_rgba(0_0_0)] ' : 'text-blue-200'}`}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
