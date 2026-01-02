import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { neon } from "@neondatabase/serverless"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const sql = neon(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!)

type DiagnosticResult = {
  name: string
  passed: boolean
  message: string
}

export default async function DiagnosticsPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== "admin") {
    redirect("/admin")
  }

  const results: DiagnosticResult[] = []

  // Test 1: DB Connectivity
  try {
    await sql`SELECT 1`
    results.push({ name: "Database Connectivity", passed: true, message: "Connected successfully" })
  } catch (error) {
    results.push({
      name: "Database Connectivity",
      passed: false,
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Test 2: Session validity
  try {
    if (user.id && user.role === "admin") {
      results.push({ name: "Session Valid & Admin Role", passed: true, message: `User ID: ${user.id}, Role: admin` })
    } else {
      results.push({ name: "Session Valid & Admin Role", passed: false, message: "Not admin" })
    }
  } catch (error) {
    results.push({ name: "Session Valid & Admin Role", passed: false, message: "Session error" })
  }

  // Test 3: Tables exist
  const tables = ["courses", "lessons", "users", "categories", "enrollments"]
  for (const table of tables) {
    try {
      await sql`SELECT COUNT(*) FROM ${sql(table)} LIMIT 1`
      results.push({ name: `Table: ${table}`, passed: true, message: "Exists" })
    } catch (error) {
      results.push({ name: `Table: ${table}`, passed: false, message: "Does not exist" })
    }
  }

  const passedCount = results.filter((r) => r.passed).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Diagnostics</h1>
        <p className="text-muted-foreground">System health check and API validation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Overall Status
            <Badge variant={passedCount === results.length ? "default" : "destructive"}>
              {passedCount}/{results.length} PASSED
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {results.map((result) => (
          <Card key={result.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">{result.name}</CardTitle>
              <Badge variant={result.passed ? "default" : "destructive"}>{result.passed ? "PASS" : "FAIL"}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.message}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
