"use client"

import { useEffect } from "react"
import { initDb } from "@/lib/mockDb"

export function DbInitializer() {
  useEffect(() => {
    initDb()
  }, [])
  return null
}
