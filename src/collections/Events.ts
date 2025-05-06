import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events', // Имя таблицы
  admin: {
    useAsTitle: 'content', // Поле content ("Gaby Level 5") как заголовок
  },
  access: {
    // Только владелец (пользователь) может читать свои события
    read: ({ req: { user } }) => {
      if (!user) return false
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Только владелец может создавать, обновлять или удалять
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
      // Автоматически задавать текущего пользователя при создании
      defaultValue: ({ user }) => user?.id,
      // Скрыть поле в админке, так как оно заполняется автоматически
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
          pickerAppearance: 'dayAndTime', // Выбор даты и времени
        },
      },
    },
    {
      name: 'content',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
