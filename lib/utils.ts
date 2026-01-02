import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseId(id: string): number {
  const parsed = Number.parseInt(id, 10)
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid ID: ${id}`)
  }
  return parsed
}
