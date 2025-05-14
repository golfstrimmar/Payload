import React from 'react'
import './styles.scss'
import Navbar from '../../components/Navbar'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}
import { StateProvider } from '@/components/StateProvaider'
import { UserProvider } from '@/components/UserContext'
import { LocationsProvider } from '@/components/LocationsContext'
export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <UserProvider>
          <StateProvider>
            <LocationsProvider>
              <Navbar />
              <main>{children}</main>
            </LocationsProvider>
          </StateProvider>
        </UserProvider>
      </body>
    </html>
  )
}
