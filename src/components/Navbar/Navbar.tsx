'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import './Navbar.scss'
import { useUserContext } from '@/components/UserContext'
import { useStateContext } from '@/components/StateProvaider'
import { useRouter, usePathname } from 'next/navigation'
import Uhr from '@/components/ui/Uhr/Uhr'
import Burger from '@/components/ui/Burger/Burger'
export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const { user, setUser, setToken, role } = useUserContext()
  const { setEvents, length } = useStateContext()
  const pathname = usePathname()
  const [activeLink, setactiveLink] = useState<string>('')
  const [isOpen, setisOpen] = useState<boolean>(false)

  // ----------------------------

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
      setEvents([])
      setToken('')
      setUser('')
      localStorage.removeItem('token')
      setIsAuthenticated(false)
      router.push('/')
    } catch (err) {
      console.error('Error logging out:', err)
    }
  }

  const handlerburgerClick = () => {
    setisOpen(!isOpen)
  }

  return (
    <nav className="bg-blue-600 header">
      <div className="w-full  ">
        <Uhr />
        <Burger handlerburgerClick={handlerburgerClick} isOpen={isOpen} />
        <div
          className={`flex px-4 space-x-4  justify-between items-center menu ${isOpen ? 'run' : ''}`}
        >
          <Link
            href="/"
            className={`  hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out ${activeLink === '/' ? 'underline  text-white text-shadow-[0_0_2px_rgba(0_0_0)] ' : 'text-blue-200'}`}
          >
            Home
          </Link>

          {isAuthenticated && (
            <div className="flex space-x-2">
              <Link
                href="/events"
                className={`  hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out ${activeLink === '/events' ? 'underline  text-white text-shadow-[0_0_2px_rgba(0_0_0)] ' : 'text-blue-200'}`}
              >
                Events
              </Link>
              <span className="text-[13px]">({length})</span>
            </div>
          )}
          {isAuthenticated && role === 'admin' && (
            <Link
              href="/admin"
              className={`  hover:text-blue-400 cursor-pointer transition-colors duration-200 ease-in-out ${activeLink === '/admin' ? 'underline  text-white text-shadow-[0_0_2px_rgba(0_0_0)] ' : 'text-blue-200'}`}
            >
              Admin
            </Link>
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
          {isAuthenticated && (
            <div className=" grid grid-cols-[.5fr_2fr] person">
              <span>user:</span>
              <h2 className="text-blue-200 font-bold lh-1">{user}</h2>
              <span>role:</span>
              <p className="text-blue-200 font-bold lh-1">{role}</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
