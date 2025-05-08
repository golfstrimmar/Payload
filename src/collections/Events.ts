import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events', // Имя таблицы
  admin: {
    useAsTitle: 'content', // Поле content ("Gaby Level 5") как заголовок
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: ({ req: { user } }) => !!user, // Только авторизованные
    update: ({ req: { user } }) => {
      if (!user) return false
      return {
        user: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return {
        user: {
          equals: user.id,
        },
      }
    },
  },
  fields: [
    {
      name: 'user', // Поле, связывающее событие с пользователем
      type: 'relationship',
      relationTo: 'users', // Связь с коллекцией users
      required: true,
      defaultValue: ({ user }) => user?.id,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'content',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'mediaUrls', // Обновлено на массив для хранения нескольких URL-ов
      type: 'array',
      required: false,
      label: 'Event Media URLs', // Подсказка в админке
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'Media URL',
        },
      ],
    },
  ],
}
