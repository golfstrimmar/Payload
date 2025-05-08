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
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: 'user',
      required: true,
      access: {
        update: ({ req: { user } }) => {
          console.log('Role update access:', {
            userId: user?.id,
            email: user?.email,
            role: user?.role,
          })
          return true // Временно разрешаем всем изменять роль
        },
      },
    },
  ],
  access: {
    create: () => true,
    delete: ({ req: { user } }) => {
      console.log('Delete access:', { userId: user?.id, email: user?.email, role: user?.role })
      return true // Временно разрешаем всем удалять
    },
    read: ({ req: { user } }) => {
      console.log('Users read access:', { userId: user?.id, email: user?.email, role: user?.role })
      return true // Временно разрешаем всем видеть всех пользователей
    },
    update: ({ req: { user } }) => {
      console.log('Update access:', { userId: user?.id, email: user?.email, role: user?.role })
      return true // Временно разрешаем всем обновлять
    },
    admin: ({ req: { user } }) => {
      console.log('Admin access check:', { userId: user?.id, email: user?.email, role: user?.role })
      return user?.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      async ({ req, data, operation, context }) => {
        if (operation !== 'create') return data

        const existingAdmins = await req.payload.find({
          collection: 'users',
          where: {
            role: {
              equals: 'admin',
            },
          },
          limit: 1, // достаточно одного
        })

        if (existingAdmins.totalDocs > 0) {
          console.log('🔒 Admin already exists. Forcing new user role to "user".')
          return {
            ...data,
            role: 'user', // принудительно ставим user
          }
        }

        console.log('👑 No admin exists yet. Allowing custom role assignment.')
        return data
      },
    ],
    afterRead: [
      ({ doc }) => {
        console.log('User data from DB:', { id: doc.id, email: doc.email, role: doc.role })
        return doc
      },
    ],
    afterLogin: [
      ({ req, user }) => {
        console.log('User after login:', { id: user.id, email: user.email, role: user.role })
        return {
          ...user,
          role: user.role,
        }
      },
    ],
  },
}
