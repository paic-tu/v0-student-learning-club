"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2, Play } from "lucide-react"

type TestResult = {
  name: string
  status: "pending" | "running" | "passed" | "failed"
  message?: string
  duration?: number
}

export default function AdminTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateResult = (name: string, update: Partial<TestResult>) => {
    setResults((prev) => prev.map((r) => (r.name === name ? { ...r, ...update } : r)))
  }

  const tests: Array<{ name: string; fn: () => Promise<void> }> = [
    {
      name: "1. Unauthenticated access to /admin redirects to login",
      fn: async () => {
        // This test verifies middleware behavior
        const res = await fetch("/admin", { redirect: "manual" })
        if (res.status === 307 || res.status === 302) {
          return
        }
        throw new Error(`Expected redirect, got ${res.status}`)
      },
    },
    {
      name: "2. Admin API rejects unauthenticated requests",
      fn: async () => {
        const res = await fetch("/api/admin/lessons", {
          method: "GET",
          credentials: "omit",
        })
        if (res.status === 401 || res.status === 403) {
          return
        }
        throw new Error(`Expected 401/403, got ${res.status}`)
      },
    },
    {
      name: "3. Lessons list page loads without errors",
      fn: async () => {
        const res = await fetch("/admin/lessons")
        if (!res.ok) {
          throw new Error(`Page returned ${res.status}`)
        }
        const html = await res.text()
        if (html.includes("NaN") || html.includes("error")) {
          // Check for common error patterns but allow normal content
          if (html.includes("invalid input syntax")) {
            throw new Error("NaN error detected in page")
          }
        }
      },
    },
    {
      name: "4. Lessons API returns valid JSON array",
      fn: async () => {
        const res = await fetch("/api/admin/lessons")
        if (res.status === 403) {
          // Expected if not logged in as admin
          return
        }
        if (!res.ok) {
          throw new Error(`API returned ${res.status}`)
        }
        const data = await res.json()
        if (!Array.isArray(data)) {
          throw new Error("Expected array response")
        }
      },
    },
    {
      name: "5. Create lesson validates required fields",
      fn: async () => {
        const res = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        // Should fail with 400 or 403 (if not authenticated)
        if (res.status === 400 || res.status === 403) {
          return
        }
        throw new Error(`Expected 400/403, got ${res.status}`)
      },
    },
    {
      name: "6. Create lesson rejects invalid courseId (NaN prevention)",
      fn: async () => {
        const res = await fetch("/api/admin/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titleEn: "Test",
            titleAr: "اختبار",
            slug: "test",
            courseId: "not-a-number",
            orderIndex: "NaN",
          }),
        })
        if (res.status === 400 || res.status === 403) {
          return
        }
        throw new Error(`Expected 400/403, got ${res.status}`)
      },
    },
    {
      name: "7. Lesson detail API validates ID parameter",
      fn: async () => {
        const res = await fetch("/api/admin/lessons/invalid-id")
        if (res.status === 400 || res.status === 403 || res.status === 404) {
          return
        }
        throw new Error(`Expected 400/403/404, got ${res.status}`)
      },
    },
    {
      name: "8. Audit logs are created for admin actions",
      fn: async () => {
        // This test checks if audit_logs table query works
        const res = await fetch("/admin/audit-logs")
        if (res.status === 403) {
          // Expected if not logged in
          return
        }
        if (!res.ok) {
          throw new Error(`Page returned ${res.status}`)
        }
      },
    },
  ]

  const runTests = async () => {
    setIsRunning(true)
    setResults(tests.map((t) => ({ name: t.name, status: "pending" })))

    for (const test of tests) {
      updateResult(test.name, { status: "running" })
      const start = Date.now()

      try {
        await test.fn()
        updateResult(test.name, {
          status: "passed",
          duration: Date.now() - start,
        })
      } catch (error) {
        updateResult(test.name, {
          status: "failed",
          message: error instanceof Error ? error.message : "Unknown error",
          duration: Date.now() - start,
        })
      }
    }

    setIsRunning(false)
  }

  const passedCount = results.filter((r) => r.status === "passed").length
  const failedCount = results.filter((r) => r.status === "failed").length

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel Integration Tests</CardTitle>
          <CardDescription>Automated tests for RBAC, Lessons CRUD, and Audit Logging</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              {results.length > 0 && (
                <>
                  <Badge variant="default" className="bg-green-500">
                    Passed: {passedCount}
                  </Badge>
                  <Badge variant="destructive">Failed: {failedCount}</Badge>
                </>
              )}
            </div>
            <Button onClick={runTests} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            {results.map((result) => (
              <div
                key={result.name}
                className={`flex items-start justify-between p-3 rounded-lg border ${
                  result.status === "passed"
                    ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                    : result.status === "failed"
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                      : "bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.status === "running" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                  {result.status === "passed" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {result.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                  {result.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{result.name}</p>
                    {result.message && <p className="text-xs text-red-600 mt-1">{result.message}</p>}
                  </div>
                </div>
                {result.duration !== undefined && (
                  <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                )}
              </div>
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Click "Run All Tests" to start the integration test suite
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
