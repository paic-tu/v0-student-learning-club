export function debugLog(scope: string, data: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[${scope}]`, typeof data === "object" ? JSON.stringify(data, null, 2) : data)
  }
}

export function debugError(scope: string, error: unknown) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${scope}]`, error instanceof Error ? error.message : error)
  }
}
