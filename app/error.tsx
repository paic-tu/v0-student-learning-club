"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { useEffect } from "react"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[v0] Error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive" />
        <h1 className="text-2xl font-bold">حدث خطأ / Something went wrong</h1>
        <p className="text-muted-foreground">{error.message}</p>
        <Button onClick={reset}>حاول مرة أخرى / Try again</Button>
      </div>
    </div>
  )
}
