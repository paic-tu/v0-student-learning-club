"use server"

import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL!
const sql = neon(databaseUrl)

export async function getContestParticipants(contestId: number) {
  console.log("[Action] getContestParticipants started", { contestId })
  try {
    const parts = await sql`
      SELECT 
        cp.*,
        u.name,
        u.avatar_url
      FROM contest_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.contest_id = ${contestId}
      ORDER BY cp.score DESC, cp.joined_at ASC
    `
    return parts
  } catch (error) {
    console.error("[Action] getContestParticipants error:", error)
    return []
  }
}

export async function getLeaderboard() {
  console.log("[Action] getLeaderboard started")
  try {
    // Get top users by points
    const users = await sql`
      SELECT 
        id, 
        name, 
        email, 
        points, 
        level,
        avatar_url
      FROM users
      WHERE role = 'student'
      ORDER BY points DESC
      LIMIT 50
    `
    return users
  } catch (error) {
    console.error("[Action] getLeaderboard error:", error)
    return []
  }
}
