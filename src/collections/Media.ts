// collections/Media.ts
import { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  // upload: {
  //   staticURL: '/media', // URL остаётся таким же
  //   staticDir: 'public/media', // Новый путь к папке
  //   mimeTypes: ['image/*'],
  //   adminThumbnail: ({ doc }) => doc.url || '',
  // },
  upload: false,
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
  ],
  access: {
    read: () => true,
  },
}
