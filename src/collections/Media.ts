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
    disableLocalStorage: true, // Важно для Vercel
    adminThumbnail: ({ doc }) => doc.cloudinaryURL || '',
    mimeTypes: ['image/*'],
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.files?.file) {
          const file = req.files.file

          // Загрузка в Cloudinary
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: process.env.CLOUDINARY_FOLDER || 'payload-media',
                transformation: [
                  { width: 2000, height: 2000, crop: 'limit' }, // Основное изображение
                  { width: 400, height: 300, crop: 'fill', quality: 'auto', fetch_format: 'auto' }, // Для thumbnail
                ],
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
            cloudinaryURL: result.secure_url,
            thumbnailURL: cloudinary.url(result.public_id, {
              width: 400,
              height: 300,
              crop: 'fill',
              quality: 'auto',
              fetch_format: 'auto',
            }),
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'cloudinaryURL',
      type: 'text',
      required: true,
    },
    {
      name: 'thumbnailURL',
      type: 'text',
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
