import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'content',
    defaultColumns: ['title', 'content', 'date', 'mediaUrls'],
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
    create: ({ req: { user } }) => !!user,
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
  hooks: {
    beforeChange: [
      ({ data }) => {
        console.log('<==== Payload beforeChange: mediaUrls ====>', data.mediaUrls)
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        console.log('<==== Payload afterChange: mediaUrls ====>', doc.mediaUrls)
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
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
      name: 'mediaUrls',
      type: 'json', // Хранит массив строк как JSONB
      required: false,
      label: 'Event Media URLs',
      admin: {
        description: 'Array of media URLs (e.g., ["url1", "url2"])',
      },
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          name: 'coordinates',
          type: 'point',
          required: false,
          admin: {
            description: 'Click on the map to set location',
          },
        },
        {
          name: 'address',
          type: 'text',
          required: false,
        },
      ],
    },
  ],
}
