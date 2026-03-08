"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { runAllChecks, type HealthCheck } from "@/lib/db/health-checks"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function HealthPage() {
  const { lang } = useParams() as { lang: string }
  const { user } = useAuth()
  const { toast } = useToast()
  const [checks, setChecks] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user && user.role !== "admin") {
      window.location.href = "/"
    }
  }, [user])

  const performChecks = async () => {
    setLoading(true)
    try {
      const result = await runAllChecks()
      setChecks(result)
      toast({
        title: "Checks Complete",
        description: `Status: ${result.overallStatus}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run checks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLoginStudent = async () => {
    try {
      const { error } = await authClient.signIn.email({
        email: "student@demo.com",
        password: "password123",
      })
      if (!error) {
        toast({ title: "Success", description: "Signed in as student" })
        window.location.reload()
      } else {
        toast({ title: "Error", description: error.message || "Login failed", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Login failed", variant: "destructive" })
    }
  }

  const handleLoginAdmin = async () => {
    try {
      const { error } = await authClient.signIn.email({
        email: "admin@demo.com",
        password: "password123",
      })
      if (!error) {
        toast({ title: "Success", description: "Signed in as admin" })
        window.location.reload()
      } else {
        toast({ title: "Error", description: error.message || "Login failed", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Error", description: "Login failed", variant: "destructive" })
    }
  }

  const handleLogout = async () => {
    await authClient.signOut()
    toast({ title: "Success", description: "Logged out" })
    window.location.reload()
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You must be logged in as an admin to access the health dashboard.
            </p>
            <Button onClick={handleLoginAdmin} className="w-full">
              Sign in as Admin
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">System Health Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive Neon Platform V2 Status Report</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Logged in: {user?.name}</p>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Health Status */}
        {checks && (
          <Card>
            <CardHeader>
              <CardTitle>Overall Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {checks.overallStatus === "HEALTHY" ? (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    HEALTHY
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    UNHEALTHY
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Last checked: {checks.timestamp}</p>
            </CardContent>
          </Card>
        )}

        {/* Individual Checks */}
        {checks && (
          <Card>
            <CardHeader>
              <CardTitle>Health Checks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checks.checks.map((check: HealthCheck) => (
                <div key={check.name} className="flex items-start justify-between p-3 bg-muted/50 rounded">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{check.name}</div>
                    {check.details && <div className="text-xs text-muted-foreground mt-1">{check.details}</div>}
                  </div>
                  {check.status === "PASS" ? (
                    <Badge className="ml-2 bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      PASS
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="ml-2">
                      <XCircle className="h-3 w-3 mr-1" />
                      FAIL
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={performChecks} disabled={loading} className="w-full">
                {loading ? "Running..." : "Execute Health Check"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleLoginStudent} variant="outline" className="w-full text-sm bg-transparent">
                Sign in as Student
              </Button>
              <Button onClick={handleLoginAdmin} variant="outline" className="w-full text-sm bg-transparent">
                Sign in as Admin
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href={`/${lang}/courses`}>
                  <Button variant="outline" className="w-full text-sm bg-transparent">
                    Courses
                  </Button>
                </Link>
                <Link href={`/${lang}/admin`}>
                  <Button variant="outline" className="w-full text-sm bg-transparent">
                    Admin Panel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
