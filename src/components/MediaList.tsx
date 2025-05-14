'use client'
import { useState, useEffect } from 'react'

export default function MediaList() {
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const response = await fetch('/api/media?depth=1')
        if (response.ok) {
          const { docs } = await response.json()
          const urls = docs.map((media: any) => media.url)
          setMediaUrls(urls)
        } else {
          console.error('Failed to fetch media:', response.status)
        }
      } catch (err) {
        console.error('Error fetching media:', err)
      }
    }
    fetchMedia()
  }, [])

  return (
    <div>
      {mediaUrls.map((url, index) => (
        <img
          key={index}
          src={url.startsWith('http') ? url : `http://localhost:3000${url}`}
          alt={`Media ${index}`}
          style={{ maxWidth: '300px' }}
        />
      ))}
    </div>
  )
}
