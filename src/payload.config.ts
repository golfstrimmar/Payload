import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        'postgres://neondb_owner:npg_z2ounjdgw1VR@ep-muddy-bush-a2p0oihx-pooler.eu-central-1.aws.neon.tech/golfstrimmar?sslmode=require',
      ssl: { rejectUnauthorized: false }, // Ключевая строка для Neon
      connectionTimeoutMillis: 5000, // Таймаут подключения
    },
  }),
  sharp,
  plugins: [payloadCloudPlugin()],
})
