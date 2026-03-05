/**
 * Audit Logging System
 * Tracks all admin actions with before/after states
 */

"use server"

import { neon } from "@neondatabase/serverless"
import { getCurrentUser } from "@/lib/auth"
import { headers } from "next/headers"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

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
  | "lesson"
  | "enrollment"
  | "product"
  | "order"
  | "challenge"
  | "contest"
  | "certificate"
  | "setting"

interface AuditLogData {
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  changes?: {
    before?: any
    after?: any
  }
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const user = await getCurrentUser()
    const headersList = await headers()
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    await sql`
      INSERT INTO audit_logs (
        user_id,
        action,
        resource,
        resource_id,
        changes,
        ip_address,
        user_agent
      )
      VALUES (
        ${user?.id || null},
        ${data.action},
        ${data.resource},
        ${data.resourceId || null},
        ${JSON.stringify(data.changes || {})},
        ${ipAddress},
        ${userAgent}
      )
    `

    console.log(`[Audit] ${user?.email || "Unknown"} performed ${data.action} on ${data.resource}`)
  } catch (error) {
    console.error("[Audit] Failed to log audit event:", error)
    // Don't throw - audit logging failures shouldn't break the main operation
  }
}

/**
 * Get audit logs with filters
 * Fixed SQL syntax to use template literals instead of function call
 */
export async function getAuditLogs(options: {
  userId?: string
  resource?: AuditResource
  action?: AuditAction
  limit?: number
  offset?: number
}) {
  try {
    const { userId, resource, action, limit = 50, offset = 0 } = options

    // Build query with template literals for proper Neon support
    let query = sql`
      SELECT 
        al.*,
        u.email as user_email,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `

    // Apply filters if provided
    if (userId) {
      query = sql`
        SELECT 
          al.*,
          u.email as user_email,
          u.name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.user_id = ${userId}
      `
    }

    if (resource) {
      query = sql`
        SELECT 
          al.*,
          u.email as user_email,
          u.name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.resource = ${resource}
      `
    }

    if (action) {
      query = sql`
        SELECT 
          al.*,
          u.email as user_email,
          u.name as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action = ${action}
      `
    }

    // Get all logs ordered by date, apply limit/offset client-side for simplicity
    const result = await sql`
      SELECT 
        al.*,
        u.email as user_email,
        u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    return result
  } catch (error) {
    console.error("[Audit] Failed to fetch audit logs:", error)
    return []
  }
}
