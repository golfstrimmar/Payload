import { CollectionConfig } from 'payload'

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
    description: 'Collection for storing location names and coordinates.',
  },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      label: 'Location Name',
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Created By',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'coordinates',
      type: 'array',
      label: 'Coordinates',
      minRows: 1,
      maxRows: 1,
      fields: [
        {
          name: 'latitude',
          type: 'number',
          required: true,
          label: 'Latitude',
        },
        {
          name: 'longitude',
          type: 'number',
          required: true,
          label: 'Longitude',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        if (req.user) {
          data.user = req.user.id
        }
        return data
      },
    ],
  },
}
