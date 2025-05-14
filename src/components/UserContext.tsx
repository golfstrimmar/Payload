'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'

interface UserContextType {
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
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string>('')
  const [token, setToken] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || ''
    }
    return ''
  })
  const [role, setRole] = useState<string>('')
  const [ID, setID] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }
  }, [token])

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

  const value = useMemo(
    () => ({
      user,
      setUser,
      token,
      setToken,
      role,
      setRole,
      ID,
      setID,
    }),
    [user, token, role, ID],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}
