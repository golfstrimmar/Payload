import { CollectionConfig } from 'payload/types'
import cloudinary from 'cloudinary'
import { v2 as cloudinaryV2 } from 'cloudinary'
import streamifier from 'streamifier'

// Кастомная функция загрузки в Cloudinary
const cloudinaryUpload = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryV2.uploader.upload_stream(
      { ...options, folder: 'your-app-name' },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      },
    )
    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })
}

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, crop: 'fit' },
      { name: 'card', width: 768, height: 576, crop: 'fit' },
    ],
    mimeTypes: ['image/*'],
  },
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.files?.file) {
          const file = req.files.file
          const result = await cloudinaryUpload(file.buffer, {
            public_id: file.filename,
            resource_type: 'image',
          })
          return {
            ...data,
            url: result.secure_url,
            thumbnailURL: result.secure_url.replace('/upload/', '/upload/w_400,h_300,c_fit/'),
          }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'url', type: 'text', required: true },
    { name: 'thumbnailURL', type: 'text' },
    { name: 'alt', type: 'text' },
  ],
}
