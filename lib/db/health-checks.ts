"use server"

import { client } from "@/lib/db"

export interface HealthCheck {
  name: string
  status: "PASS" | "FAIL"
  details?: string
  timestamp: string
}

export async function checkEnvironment(): Promise<HealthCheck> {
  const checks = [
    { key: "DATABASE_URL", present: !!process.env.DATABASE_URL },
    { key: "DATABASE_URL_POOLED", present: !!process.env.DATABASE_URL_POOLED },
    { key: "NODE_ENV", present: !!process.env.NODE_ENV },
  ]

  const allPresent = checks.every((c) => c.present)

  return {
    name: "Environment Variables",
    status: allPresent ? "PASS" : "FAIL",
    details: checks.map((c) => `${c.key}: ${c.present ? "✓" : "✗"}`).join(" | "),
    timestamp: new Date().toISOString(),
  }
}

export async function checkDatabase(): Promise<HealthCheck> {
  try {
    // Test connection
    await client`SELECT 1`

    // Check schema tables
    const tables = await client`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    const requiredTables = ["users", "sessions", "courses", "enrollments", "orders", "challenges", "certificates"]
    const tableNames = (tables as any[]).map((t: any) => t.table_name)
    const allPresent = requiredTables.every((t) => tableNames.includes(t))

    if (!allPresent) {
      // Find missing tables
      const missing = requiredTables.filter((t) => !tableNames.includes(t))
      
      // If we found some tables but not all, it's a FAIL
      // But if tableNames is empty, maybe the query format is different in Neon/Postgres?
      // standard information_schema should work.
      
      return {
        name: "Database Schema",
        status: "FAIL",
        details: `Missing tables: ${missing.join(", ")}`,
        timestamp: new Date().toISOString(),
      }
    }

    // Check sample data
    const courseCount = await client`SELECT COUNT(*) as count FROM courses`
    const userCount = await client`SELECT COUNT(*) as count FROM users`

    return {
      name: "Database",
      status: "PASS",
      details: `Courses: ${courseCount[0].count} | Users: ${userCount[0].count}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name: "Database",
      status: "FAIL",
      details: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function checkAuth(): Promise<HealthCheck> {
  try {
    // Check if sessions table has data
    const sessions = await client`SELECT COUNT(*) as count FROM sessions`

    return {
      name: "Authentication",
      status: "PASS",
      details: `Active sessions: ${sessions[0].count}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name: "Authentication",
      status: "FAIL",
      details: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function checkCoreFlows(): Promise<HealthCheck> {
  try {
    // Check enrollments
    const enrollments = await db.execute(sql`SELECT COUNT(*) as count FROM enrollments`)

    // Check orders
    const orders = await db.execute(sql`SELECT COUNT(*) as count FROM orders`)

    // Check certificates
    const certificates = await db.execute(sql`SELECT COUNT(*) as count FROM certificates`)

    const details = `Enrollments: ${enrollments[0].count} | Orders: ${orders[0].count} | Certificates: ${certificates[0].count}`

    return {
      name: "Core Flows",
      status: "PASS",
      details,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name: "Core Flows",
      status: "FAIL",
      details: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function checkChallenges(): Promise<HealthCheck> {
  try {
    const challenges = await db.execute(sql`SELECT COUNT(*) as count FROM challenges`)
    const submissions = await db.execute(sql`SELECT COUNT(*) as count FROM challenge_submissions`)

    return {
      name: "Challenges",
      status: "PASS",
      details: `Problems: ${challenges[0].count} | Submissions: ${submissions[0].count}`,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      name: "Challenges",
      status: "FAIL",
      details: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function runAllChecks() {
  const checks = await Promise.all([
    checkEnvironment(),
    checkDatabase(),
    checkAuth(),
    checkCoreFlows(),
    checkChallenges(),
  ])

  return {
    timestamp: new Date().toISOString(),
    checks,
    overallStatus: checks.every((c) => c.status === "PASS") ? "HEALTHY" : "UNHEALTHY",
  }
}
