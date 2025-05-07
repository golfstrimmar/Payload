import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      options: ['admin', 'user'],
      defaultValue: 'user',
      required: true,
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
  ],
  access: {
    create: () => true,
    delete: ({ req: { user } }) => user?.role === 'admin',
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { id: { equals: user?.id } }
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { id: { equals: user?.id } }
    },
  },
}
