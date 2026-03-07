/**
 * Audit Logging System
 * Tracks all admin actions with before/after states
 */

"use server"

import { db } from "@/lib/db"
import { auditLogs, users } from "@/lib/db/schema"
import { getCurrentUser } from "@/lib/auth"
import { headers } from "next/headers"
import { desc, eq, and } from "drizzle-orm"

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "soft_delete"
  | "restore"
  | "publish"
  | "unpublish"
  | "approve"
  | "reject"
  | "refund"
  | "ban"
  | "unban"

export type AuditResource =
  | "user"
  | "course"
  | "module"
  | "lesson"
  | "enrollment"
  | "product"
  | "order"
  | "challenge"
  | "contest"
  | "certificate"
  | "setting"
  | "category"

interface AuditLogData {
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  userId?: string // Optional override for the user performing the action
  changes?: {
    before?: any
    after?: any
    [key: string]: any // Allow flexible structure
  }
  details?: any // Legacy support/alias for changes
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const user = data.userId ? { id: data.userId, email: "system" } : await getCurrentUser()
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    const changes = data.changes || data.details || {}

    await db.insert(auditLogs).values({
      userId: user?.id || null,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId ? data.resourceId : null,
      changes: changes,
      ipAddress: ipAddress,
      userAgent: userAgent,
    })

    console.log(`[Audit] ${user?.email || user?.id || "Unknown"} performed ${data.action} on ${data.resource}`)
  } catch (error) {
    console.error("[Audit] Failed to log audit event:", error)
    // Don't throw - audit logging failures shouldn't break the main operation
  }
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(options: {
  userId?: string
  resource?: AuditResource
  action?: AuditAction
  limit?: number
  offset?: number
}) {
  try {
    const filters = []
    
    if (options.userId) filters.push(eq(auditLogs.userId, options.userId))
    if (options.resource) filters.push(eq(auditLogs.resource, options.resource))
    if (options.action) filters.push(eq(auditLogs.action, options.action))

    const logs = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        changes: auditLogs.changes,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        user_email: users.email,
        user_name: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(...filters))
      .orderBy(desc(auditLogs.createdAt))
      .limit(options.limit || 50)
      .offset(options.offset || 0)

    return logs
  } catch (error) {
    console.error("[Audit] Failed to fetch audit logs:", error)
    return []
  }
}

