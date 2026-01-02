export interface DevLogEntry {
  scope: string
  timestamp: string
  data: Record<string, any>
}

const isDev = process.env.NODE_ENV === "development"

export function devLog(scope: string, data: Record<string, any>) {
  if (!isDev) return
  const timestamp = new Date().toISOString()
  console.log(`[DEV] ${scope} @ ${timestamp}:`, data)
}

export function devError(scope: string, error: any) {
  if (!isDev) return
  const timestamp = new Date().toISOString()
  console.error(`[DEV ERROR] ${scope} @ ${timestamp}:`, error)
}
