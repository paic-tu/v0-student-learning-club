/**
 * Authorization error classes
 */

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden - insufficient permissions") {
    super(message)
    this.name = "ForbiddenError"
  }
}
