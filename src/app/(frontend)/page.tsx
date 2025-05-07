import { headers as getHeaders } from 'next/headers'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'

import config from '@/payload.config'
import './styles.scss'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Получаем пользователей
  const users = await payload.find({
    collection: 'users',
    limit: 10,
  })

  // Получаем медиа-файлы
  const media = await payload.find({
    collection: 'media',
    limit: 10,
  })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <div className="home">
      <div className="content">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/main/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>

        {!user && <h1>Welcome to your new project.</h1>}
        {user && <h1>Welcome back, {user.email}</h1>}

        <section className="data-section">
          <h2>Users</h2>
          <div className="users-grid">
            {users.docs.map((user) => (
              <div key={user.id} className="user-card">
                <h3>{user.email}</h3>
                <p>ID: {user.id}</p>
                {user.role && <p>Role: {user.role}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="data-section">
          <h2>Media Files</h2>
          <div className="media-grid">
            {media.docs.map((file) => (
              <div key={file.id} className="media-card">
                {file.mimeType?.includes('image') ? (
                  <Image
                    src={file.url}
                    alt={file.alt || 'Media file'}
                    width={200}
                    height={150}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div className="file-placeholder">
                    <span>{file.filename}</span>
                  </div>
                )}
                <p>{file.filename}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="links">
          <a
            className="admin"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            Go to admin panel
          </a>
          <a
            className="docs"
            href="https://payloadcms.com/docs"
            rel="noopener noreferrer"
            target="_blank"
          >
            Documentation
          </a>
        </div>
      </div>
      <div className="footer">
        <p>Update this page by editing</p>
        <a className="codeLink" href={fileURL}>
          <code>app/(frontend)/page.tsx</code>
        </a>
      </div>
    </div>
  )
}
