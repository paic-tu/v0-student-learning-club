/**
 * Server-side permission enforcement utilities
 */

"use server"

import { getCurrentUser } from "@/lib/auth"
import { hasPermission, type Permission } from "./permissions"
import { UnauthorizedError, ForbiddenError } from "./errors"

/**
 * Require user to be authenticated
 * Throws UnauthorizedError if not logged in
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new UnauthorizedError("Authentication required")
  }
  return user
}

/**
 * Require user to have a specific permission
 * Throws UnauthorizedError if not logged in
 * Throws ForbiddenError if insufficient permissions
 */
export async function requirePermission(permission: Permission) {
  const user = await requireAuth()

  if (!hasPermission(user.role as any, permission)) {
    throw new ForbiddenError(`Permission required: ${permission}`)
  }

  return user
}

/**
 * Require user to have admin role
 */
export async function requireAdmin() {
  const user = await requireAuth()

  if (user.role !== "admin") {
    throw new ForbiddenError("Admin access required")
  }

  return user
}

/**
 * Require user to have any of the specified roles
 */
export async function requireRole(...roles: string[]) {
  const user = await requireAuth()

  if (!roles.includes(user.role)) {
    throw new ForbiddenError(`Required role: ${roles.join(" or ")}`)
  }

  return user
}
