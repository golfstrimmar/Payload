'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface StateContextType {
  user: string
  setUser: React.Dispatch<React.SetStateAction<string>>
  token: string
  setToken: React.Dispatch<React.SetStateAction<string>>
}

const StateContext = createContext<StateContextType | undefined>(undefined)

export function StateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string>('')
  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || ''
    }
    return ''
  })

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

      console.log('<==== Token ====>', token)
      try {
        const response = await fetch('/api/users/me', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (response.ok) {
          const { user } = await response.json()
          console.log('<==== User ====>', user)
          setUser(user?.email || '')
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
    <StateContext.Provider value={{ user, setUser, token, setToken }}>
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
