// collections/Media.ts
import { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/media', // Не используется для Cloudinary, но оставим для совместимости
    staticDir: 'public/media', // Не используется для Cloudinary
    mimeTypes: ['image/*', 'image/jpeg', 'image/png', 'image/webp'],
    adminThumbnail: 'thumbnail', // Используем поле thumbnail для предпросмотра
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        crop: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 432,
        crop: 'centre',
      },
    ],
    handler: 'cloudinary',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'filename',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ],
  access: {
    read: () => true,
  },
}
