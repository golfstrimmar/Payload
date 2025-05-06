// import { postgresAdapter } from '@payloadcms/db-postgres'
// import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
// import { lexicalEditor } from '@payloadcms/richtext-lexical'
// import path from 'path'
// import { buildConfig } from 'payload'
// import { fileURLToPath } from 'url'
// import sharp from 'sharp'

// import { Users } from './collections/Users'
// import { Media } from './collections/Media'

// const filename = fileURLToPath(import.meta.url)
// const dirname = path.dirname(filename)

// console.log('DATABASE_URI:', process.env.DATABASE_URI)

// export default buildConfig({
//   admin: {
//     user: Users.slug,
//   },
//   collections: [Users, Media],
//   editor: lexicalEditor(),
//   secret: process.env.PAYLOAD_SECRET || '',
//   typescript: {
//     outputFile: path.resolve(dirname, 'payload-types.ts'),
//   },
//   db: postgresAdapter({
//     pool: {
//       connectionString: process.env.DATABASE_URI,
//       ssl: { rejectUnauthorized: false }, // Ключевая строка для Neon
//       connectionTimeoutMillis: 5000, // Таймаут подключения
//     },
//   }),
//   sharp,
//   plugins: [payloadCloudPlugin()],
// })

import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Events } from './collections/Events'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Events], 
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    },
  }),
  sharp,
  plugins: [],
})