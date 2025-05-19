import { CollectionConfig } from 'payload/types'
import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

// Настройка Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300 },
      { name: 'card', width: 768, height: 576 },
    ],
    disableLocalStorage: true, // Отключаем локальное хранилище (важно для Vercel)
    mimeTypes: ['image/*'],
    adminThumbnail: ({ doc }) => doc.url || '',
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.files?.file) {
          const file = req.files.file

          // Загрузка в Cloudinary через Stream
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: process.env.CLOUDINARY_FOLDER || 'payload-uploads',
                resource_type: 'auto',
              },
              (error, result) => {
                if (error) reject(error)
                else resolve(result)
              },
            )

            streamifier.createReadStream(file.data).pipe(uploadStream)
          })

          return {
            ...data,
            url: result.secure_url,
            filename: file.name,
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
