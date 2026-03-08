"use server"

import { db } from "@/lib/db"
import { users, contestParticipants } from "@/lib/db/schema"
import { eq, desc, asc } from "drizzle-orm"

export async function getContestParticipants(contestId: string) {
  console.log("[Action] getContestParticipants started", { contestId })
  try {
    const participants = await db.query.contestParticipants.findMany({
      where: eq(contestParticipants.contestId, contestId),
      with: {
        user: {
          columns: {
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: [desc(contestParticipants.score), asc(contestParticipants.joinedAt)]
    })
    
    // Flatten result to match previous return shape
    return participants.map(p => ({
      ...p,
      name: p.user.name,
      avatarUrl: p.user.avatarUrl
    }))
  } catch (error) {
    console.error("[Action] getContestParticipants error:", error)
    return []
  }
}

export async function getLeaderboard() {
  console.log("[Action] getLeaderboard started")
  try {
    // Get top users by points
    const topUsers = await db.query.users.findMany({
      where: eq(users.role, 'student'),
      columns: {
        id: true,
        name: true,
        email: true,
        points: true,
        level: true,
        avatarUrl: true
      },
      orderBy: [desc(users.points)],
      limit: 50
    })

    return topUsers.map(u => ({
      ...u,
      avatarUrl: u.avatarUrl
    }))
  } catch (error) {
    console.error("[Action] getLeaderboard error:", error)
    return []
  }
}
