import {
  createManagedUser,
  getManagedUser,
  listManagedUsers,
  setManagedUserActive,
  updateManagedUser,
} from '../services/adminUserService.js'
import {
  validateManagedUserCreate,
  validateManagedUserUpdate,
  validatePagination,
  validateResourceId,
} from '../utils/adminValidation.js'

export function createManagedUserController({ collectionKey, label, resourceKey, role }) {
  return Object.freeze({
    async activate(request, response) {
      const user = await setManagedUserActive({
        actorId: request.user.userId,
        id: validateResourceId(request.params.id),
        isActive: true,
        role,
      })

      response.status(200).json({
        status: 'success',
        message: `${label} activated successfully.`,
        data: { [resourceKey]: user },
      })
    },

    async create(request, response) {
      const user = await createManagedUser({
        ...validateManagedUserCreate(request.body),
        actorId: request.user.userId,
        role,
      })

      response.status(201).json({
        status: 'success',
        message: `${label} created successfully. Password setup instructions were sent.`,
        data: { [resourceKey]: user },
      })
    },

    async deactivate(request, response) {
      const user = await setManagedUserActive({
        actorId: request.user.userId,
        id: validateResourceId(request.params.id),
        isActive: false,
        role,
      })

      response.status(200).json({
        status: 'success',
        message: `${label} deactivated successfully.`,
        data: { [resourceKey]: user },
      })
    },

    async getOne(request, response) {
      const user = await getManagedUser({
        id: validateResourceId(request.params.id),
        role,
      })

      response.status(200).json({
        status: 'success',
        data: { [resourceKey]: user },
      })
    },

    async list(request, response) {
      const { pagination, users } = await listManagedUsers({
        ...validatePagination(request.query),
        role,
      })

      response.status(200).json({
        status: 'success',
        data: { [collectionKey]: users, pagination },
      })
    },

    async update(request, response) {
      const user = await updateManagedUser({
        changes: validateManagedUserUpdate(request.body),
        id: validateResourceId(request.params.id),
        role,
      })

      response.status(200).json({
        status: 'success',
        message: `${label} updated successfully.`,
        data: { [resourceKey]: user },
      })
    },
  })
}
