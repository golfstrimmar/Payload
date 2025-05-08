import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const uploadPreset = formData.get('upload_preset')

    if (!file || !uploadPreset) {
      return NextResponse.json({ error: 'File or upload preset missing' }, { status: 400 })
    }

    // Получаем переменные окружения из .env
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET!) // Твой upload preset

    // Указание API-ключа и секрета (используем их из .env)
    const headers = {
      Authorization: `Basic ${Buffer.from(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`).toString('base64')}`,
    }

    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: form,
      headers,
    })

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file')
    }

    const data = await uploadResponse.json()

    // Возвращаем успешный ответ с URL загруженного файла
    return NextResponse.json({ url: data.secure_url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message || 'Error uploading file' }, { status: 500 })
  }
}
