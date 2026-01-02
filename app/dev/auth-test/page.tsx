"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type TestResult = {
  name: string
  status: "pending" | "running" | "pass" | "fail"
  message?: string
  duration?: number
}

export default function AuthTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)
  const [testEmail, setTestEmail] = useState(`test-${Date.now()}@example.com`)
  const [testPassword, setTestPassword] = useState("testpassword123")

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults((prev) => prev.map((r, i) => (i === index ? { ...r, ...update } : r)))
  }

  const runTests = async () => {
    setRunning(true)
    const newEmail = `test-${Date.now()}@example.com`
    setTestEmail(newEmail)

    const tests: TestResult[] = [
      { name: "1. Register new user", status: "pending" },
      { name: "2. Login with new user", status: "pending" },
      { name: "3. Get current user session", status: "pending" },
      { name: "4. Login with demo account (student@neon.edu)", status: "pending" },
      { name: "5. Logout", status: "pending" },
      { name: "6. Verify session cleared", status: "pending" },
    ]
    setResults(tests)

    let registeredUser: any = null
    let sessionValid = false

    // Test 1: Register
    updateResult(0, { status: "running" })
    const start1 = Date.now()
    try {
      const { register } = await import("@/lib/auth")
      const result = await register(newEmail, testPassword, "Test User")
      if (result.success && result.user) {
        registeredUser = result.user
        updateResult(0, {
          status: "pass",
          message: `User created: ${result.user.email}`,
          duration: Date.now() - start1,
        })
      } else {
        updateResult(0, {
          status: "fail",
          message: result.error || "Registration failed",
          duration: Date.now() - start1,
        })
      }
    } catch (e: any) {
      updateResult(0, { status: "fail", message: e.message, duration: Date.now() - start1 })
    }

    // Test 2: Login with new user
    updateResult(1, { status: "running" })
    const start2 = Date.now()
    try {
      const { login } = await import("@/lib/auth")
      const result = await login(newEmail, testPassword)
      if (result.success && result.user) {
        updateResult(1, { status: "pass", message: `Logged in as: ${result.user.name}`, duration: Date.now() - start2 })
      } else {
        updateResult(1, { status: "fail", message: result.error || "Login failed", duration: Date.now() - start2 })
      }
    } catch (e: any) {
      updateResult(1, { status: "fail", message: e.message, duration: Date.now() - start2 })
    }

    // Test 3: Get current user
    updateResult(2, { status: "running" })
    const start3 = Date.now()
    try {
      const { getCurrentUser } = await import("@/lib/auth")
      const user = await getCurrentUser()
      if (user) {
        sessionValid = true
        updateResult(2, { status: "pass", message: `Session valid for: ${user.email}`, duration: Date.now() - start3 })
      } else {
        updateResult(2, { status: "fail", message: "No session found", duration: Date.now() - start3 })
      }
    } catch (e: any) {
      updateResult(2, { status: "fail", message: e.message, duration: Date.now() - start3 })
    }

    // Test 4: Login with demo account
    updateResult(3, { status: "running" })
    const start4 = Date.now()
    try {
      const { login } = await import("@/lib/auth")
      const result = await login("student@neon.edu", "password")
      if (result.success && result.user) {
        updateResult(3, {
          status: "pass",
          message: `Demo login OK: ${result.user.role}`,
          duration: Date.now() - start4,
        })
      } else {
        updateResult(3, { status: "fail", message: result.error || "Demo login failed", duration: Date.now() - start4 })
      }
    } catch (e: any) {
      updateResult(3, { status: "fail", message: e.message, duration: Date.now() - start4 })
    }

    // Test 5: Logout
    updateResult(4, { status: "running" })
    const start5 = Date.now()
    try {
      const { logout } = await import("@/lib/auth")
      await logout()
      updateResult(4, { status: "pass", message: "Logout completed", duration: Date.now() - start5 })
    } catch (e: any) {
      updateResult(4, { status: "fail", message: e.message, duration: Date.now() - start5 })
    }

    // Test 6: Verify session cleared
    updateResult(5, { status: "running" })
    const start6 = Date.now()
    try {
      const { getCurrentUser } = await import("@/lib/auth")
      const user = await getCurrentUser()
      if (!user) {
        updateResult(5, { status: "pass", message: "Session properly cleared", duration: Date.now() - start6 })
      } else {
        updateResult(5, { status: "fail", message: "Session still active after logout", duration: Date.now() - start6 })
      }
    } catch (e: any) {
      updateResult(5, { status: "fail", message: e.message, duration: Date.now() - start6 })
    }

    setRunning(false)
  }

  const passCount = results.filter((r) => r.status === "pass").length
  const failCount = results.filter((r) => r.status === "fail").length

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth System Test Suite</CardTitle>
            <CardDescription>Automated tests for signup, login, session management, and logout flows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test Email</Label>
                <Input value={testEmail} readOnly className="text-xs" />
              </div>
              <div>
                <Label>Test Password</Label>
                <Input value={testPassword} readOnly className="text-xs" />
              </div>
            </div>

            <Button onClick={runTests} disabled={running} className="w-full">
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run All Tests"
              )}
            </Button>

            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600">
                    Passed: {passCount}
                  </Badge>
                  <Badge variant="outline" className="bg-red-500/10 text-red-600">
                    Failed: {failCount}
                  </Badge>
                </div>

                <div className="space-y-2 mt-4">
                  {results.map((result, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        {result.status === "pass" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                        {result.status === "fail" && <XCircle className="h-5 w-5 text-red-500" />}
                        {result.status === "running" && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                        {result.status === "pending" && <div className="h-5 w-5 rounded-full border-2 border-muted" />}
                        <div>
                          <p className="font-medium text-sm">{result.name}</p>
                          {result.message && <p className="text-xs text-muted-foreground">{result.message}</p>}
                        </div>
                      </div>
                      {result.duration && <span className="text-xs text-muted-foreground">{result.duration}ms</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bug Fixes Applied</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Replaced SHA-256 with bcrypt</p>
                <p className="text-xs text-muted-foreground">Password hashing now uses bcrypt with 10 salt rounds</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Fixed password verification</p>
                <p className="text-xs text-muted-foreground">
                  Login now uses bcrypt.compare() instead of hash equality check
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Updated seed password hashes</p>
                <p className="text-xs text-muted-foreground">
                  Demo accounts now have valid bcrypt hashes for &quot;password&quot;
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
