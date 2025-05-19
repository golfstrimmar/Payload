import { CollectionConfig } from 'payload/types'
import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'

// Конфигурация Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    disableLocalStorage: true, // Отключаем локальное хранение
    adminThumbnail: ({ doc }) => doc.url || '', // Превью из Cloudinary URL
    mimeTypes: ['image/*'],
    staticURL: '', // Убираем staticURL
    staticDir: '', // Убираем staticDir
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        crop: 'fill',
      },
      {
        name: 'card',
        width: 768,
        height: 576,
        crop: 'fit',
      },
    ],
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.files?.file) {
          const file = req.files.file

          // Загрузка изображения в Cloudinary
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'payload-media',
                resource_type: 'image',
              },
              (error, result) => {
                if (error) reject(error)
                else resolve(result)
              },
            )
            streamifier.createReadStream(file.data).pipe(uploadStream)
          })

          // Генерация URL для размеров
          const thumbnailUrl = cloudinary.url(uploadResult.public_id, {
            width: 400,
            height: 300,
            crop: 'fill',
          })
          const cardUrl = cloudinary.url(uploadResult.public_id, {
            width: 768,
            height: 576,
            crop: 'fit',
          })

          return {
            ...data,
            url: uploadResult.secure_url,
            filename: file.name, // Сохраняем имя файла для совместимости
            sizes: {
              thumbnail: { url: thumbnailUrl },
              card: { url: cardUrl },
            },
          }
        }
        return data
      },
    ],
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
    read: () => true, // Публичный доступ к медиа
  },
}
