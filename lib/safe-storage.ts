export function safeGetFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

export function safeSaveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error("[v0] Storage save failed:", error)
  }
}

export function safeRemoveFromStorage(key: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error("[v0] Storage remove failed:", error)
  }
}
