import React from 'react'
import './styles.scss'
import Navbar from '../../components/Navbar'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}
import { StateProvider } from '@/components/StateProvaider'
import { UserProvider } from '@/components/UserContext'

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <UserProvider>
          <StateProvider>
            <Navbar />
            <main>{children}</main>
          </StateProvider>
        </UserProvider>
      </body>
    </html>
  )
}
