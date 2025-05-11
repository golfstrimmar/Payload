'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  mediaUrls: string[]
}
interface StateContextType {
  user: string
  setUser: React.Dispatch<React.SetStateAction<string>>
  token: string
  setToken: React.Dispatch<React.SetStateAction<string>>
  role: string
  setRole: React.Dispatch<React.SetStateAction<string>>
  ID: string
  setID: React.Dispatch<React.SetStateAction<string>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  length: number
  setLength: React.Dispatch<React.SetStateAction<number>>
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
}

const StateContext = createContext<StateContextType | undefined>(undefined)

export function StateProvider({ children }: { children: ReactNode }) {
  const [length, setLength] = useState<number>(0)
  const [events, setEvents] = useState<Event[]>([])
  const [ID, setID] = useState<string>('')
  const [user, setUser] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || ''
    }
    return ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Синхронизация token с localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }
  }, [token])

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        console.log('<==== No token ====>')
        setUser('')
        return
      }
      try {
        const response = await fetch('/api/users/me', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (response.ok) {
          const { user } = await response.json()
          setUser(user?.email || '')
          setRole(user?.role || '')
          setID(user?.id || '')
        } else {
          console.error('Failed to fetch user:', response.status, response.statusText)
          setUser('')
        }
      } catch (err) {
        console.error('Error checking auth:', err)
        setUser('')
      }
    }

    checkAuth()
  }, [token])

  return (
    <StateContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        role,
        ID,
        isLoading,
        setIsLoading,
        events,
        setEvents,
      }}
    >
      {children}
    </StateContext.Provider>
  )
}

export function useStateContext() {
  const context = useContext(StateContext)
  if (!context) {
    throw new Error('useStateContext must be used within a StateProvider')
  }
  return context
}
