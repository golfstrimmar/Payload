import type { CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'content',
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
      name: 'status',
      type: 'text',
      defaultValue: 'inactive',
      required: true,
      validate: (value) => {
        if (value !== 'active' && value !== 'inactive') {
          return 'Status must be either "active" or "inactive"'
        }
        return true
      },
    },
    {
      name: 'mediaUrls',
      type: 'array',
      required: false,
      label: 'Event Media URLs',
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'Media URL',
        },
      ],
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
