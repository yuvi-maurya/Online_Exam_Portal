import { prisma } from '../config/prisma.js'

export const AuditAction = Object.freeze({
  SUBJECT_DELETED: 'SUBJECT_DELETED',
  USER_CREATED: 'USER_CREATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_REACTIVATED: 'USER_REACTIVATED',
})

export const AuditEntityType = Object.freeze({
  SUBJECT: 'SUBJECT',
  USER: 'USER',
})

const AUDIT_LOG_SELECT = {
  action: true,
  actor: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  actorId: true,
  createdAt: true,
  entityId: true,
  entityType: true,
  id: true,
  metadata: true,
}

export function recordAuditLog(
  { action, actorId, entityId, entityType, metadata },
  client = prisma,
) {
  return client.auditLog.create({
    data: {
      action,
      actorId,
      entityId,
      entityType,
      metadata,
    },
    select: { id: true },
  })
}

export async function listAuditLogs({ action, actorId, limit, page }) {
  const where = {
    ...(action ? { action } : {}),
    ...(actorId ? { actorId } : {}),
  }
  const skip = (page - 1) * limit
  const [auditLogs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: AUDIT_LOG_SELECT,
      skip,
      take: limit,
      where,
    }),
    prisma.auditLog.count({ where }),
  ])

  return {
    auditLogs,
    pagination: {
      limit,
      page,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
