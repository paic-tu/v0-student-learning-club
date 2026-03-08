"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { conversations, conversationParticipants, messages, users, enrollments, courses } from "@/lib/db/schema"
import { eq, and, desc, or, sql, asc, gt, ne, count, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function getConversations() {
  try {
    const session = await auth()
    if (!session?.user?.id) return []

    // 1. Get conversations where the user is a participant
    // Instead of using db.query which generates complex lateral joins that fail on Neon/Vercel
    // we fetch IDs first and then fetch related data in parallel manually.
    const userParticipations = await db
      .select({
        conversationId: conversationParticipants.conversationId,
      })
      .from(conversationParticipants)
      .where(eq(conversationParticipants.userId, session.user.id))

    if (userParticipations.length === 0) return []

    const conversationIds = userParticipations.map(p => p.conversationId)

    // 2. Fetch conversations, participants, and latest messages in parallel
    const [convs, allParticipants, latestMessages, unreadCounts] = await Promise.all([
      // Get conversation details
      db.select().from(conversations).where(inArray(conversations.id, conversationIds)),

      // Get all participants for these conversations to determine names/avatars
      db.select({
        conversationId: conversationParticipants.conversationId,
        userId: conversationParticipants.userId,
        user: {
          id: users.id,
          name: users.name,
          avatarUrl: users.avatarUrl,
          email: users.email,
          role: users.role,
        }
      })
      .from(conversationParticipants)
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(inArray(conversationParticipants.conversationId, conversationIds)),

      // Get latest message for each conversation
      // Using DISTINCT ON to get the most recent message per conversation efficiently
      db.select()
        .distinctOn(messages.conversationId)
        .from(messages)
        .where(inArray(messages.conversationId, conversationIds))
        .orderBy(messages.conversationId, desc(messages.createdAt)),

      // Get unread counts
      db.select({
        conversationId: conversationParticipants.conversationId,
        count: count(),
      })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        eq(messages.conversationId, conversationParticipants.conversationId)
      )
      .where(
        and(
          eq(conversationParticipants.userId, session.user.id),
          ne(messages.senderId, session.user.id),
          inArray(messages.conversationId, conversationIds),
          gt(
            messages.createdAt,
            sql`COALESCE(${conversationParticipants.lastReadAt}, ${conversationParticipants.joinedAt})`
          )
        )
      )
      .groupBy(conversationParticipants.conversationId)
    ])

    // 3. Assemble the data
    const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u.count]))
    
    // Group participants by conversation
    const participantsByConv = new Map<string, typeof allParticipants>()
    allParticipants.forEach(p => {
      const list = participantsByConv.get(p.conversationId) || []
      list.push(p)
      participantsByConv.set(p.conversationId, list)
    })

    // Map latest messages
    const messageMap = new Map(latestMessages.map(m => [m.conversationId, m]))

    // Transform data for UI
    return convs.map((conv) => {
      const participants = participantsByConv.get(conv.id) || []
      const otherParticipants = participants.filter((p) => p.userId !== session.user.id)
      const lastMessage = messageMap.get(conv.id)

      let name = conv.name
      let image = null

      if (conv.type === "individual") {
        const otherUser = otherParticipants[0]?.user
        name = otherUser?.name || "Unknown User"
        image = otherUser?.avatarUrl
      } else if (conv.type === "community") {
        name = "Community Chat"
      }

      return {
        id: conv.id,
        type: conv.type,
        name,
        image,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
        } : null,
        updatedAt: conv.updatedAt,
        unreadCount: unreadMap.get(conv.id) || 0,
      }
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  } catch (error) {
    console.error("Failed to get conversations:", error)
    return []
  }
}

export async function getUnreadMessageCount() {
  try {
    const session = await auth()
    if (!session?.user?.id) return 0

    const result = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(
        conversationParticipants,
        eq(messages.conversationId, conversationParticipants.conversationId)
      )
      .where(
        and(
          eq(conversationParticipants.userId, session.user.id),
          ne(messages.senderId, session.user.id),
          gt(
            messages.createdAt,
            sql`COALESCE(${conversationParticipants.lastReadAt}, ${conversationParticipants.joinedAt})`
          )
        )
      )

    return Number(result[0]?.count || 0)
  } catch (error) {
    console.error("Failed to get unread message count:", error)
    return 0
  }
}

export async function markConversationAsRead(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await db.update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, session.user.id)
    ))
  
  revalidatePath("/student/chat")
  revalidatePath("/instructor/chat")
  revalidatePath("/admin/chat")
}


export async function getMessages(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  // Verify participation
  const participant = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, session.user.id)
    ),
  })

  if (!participant) return []

  // Fetch messages
  const chatMessages = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [asc(messages.createdAt)],
    with: {
      sender: {
        columns: {
          id: true,
          name: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  })

  return chatMessages
}

export async function sendMessage(conversationId: string, content: string, type: "text" | "image" | "file" | "gif" | "sticker" = "text", attachmentUrl?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  if (!content.trim() && !attachmentUrl) return { error: "Message cannot be empty" }

  // Verify participation
  const participant = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, session.user.id)
    ),
  })

  if (!participant) return { error: "You are not a participant of this conversation" }

  await db.insert(messages).values({
    conversationId,
    senderId: session.user.id,
    content,
    type,
    attachmentUrl,
  })

  await db.update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))

  revalidatePath("/student/chat", "page")
  revalidatePath("/instructor/chat", "page")
  revalidatePath("/admin/chat", "page")
  return { success: true }
}

export async function notifyTyping(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return

  await db.update(conversationParticipants)
    .set({ lastTypedAt: new Date() })
    .where(and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, session.user.id)
    ))
}

export async function getTypingUsers(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return []

  // Get users who typed in the last 3 seconds
  const threeSecondsAgo = new Date(Date.now() - 3000)

  const participants = await db.query.conversationParticipants.findMany({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      // Exclude current user
      ne(conversationParticipants.userId, session.user.id),
      // Typed recently
      gt(conversationParticipants.lastTypedAt, threeSecondsAgo)
    ),
    with: {
      user: {
        columns: {
          name: true,
        },
      },
    },
  })

  return participants.map((p) => p.user.name)
}

export async function joinCommunityChat() {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  // Find existing community chat
  let communityChat = await db.query.conversations.findFirst({
    where: eq(conversations.type, "community"),
  })

  // Create if not exists
  if (!communityChat) {
    const [newChat] = await db.insert(conversations).values({
      type: "community",
      name: "Community Chat",
    }).returning()
    communityChat = newChat
  }

  // Check if user is already a participant
  const participant = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, communityChat.id),
      eq(conversationParticipants.userId, session.user.id)
    ),
  })

  if (!participant) {
    await db.insert(conversationParticipants).values({
      conversationId: communityChat.id,
      userId: session.user.id,
    })
  }

  return { conversationId: communityChat.id }
}

// Helper to check if chat is allowed
async function canChat(userId1: string, userId2: string) {
  const [user1] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId1))
  const [user2] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId2))

  if (!user1 || !user2) return false

  // Admin can chat with anyone
  if (user1.role === "admin" || user2.role === "admin") return true

  // Check enrollment relationship
  const [enrollment] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(or(
      // user1 is instructor, user2 is student
      and(eq(courses.instructorId, userId1), eq(enrollments.userId, userId2)),
      // user1 is student, user2 is instructor
      and(eq(courses.instructorId, userId2), eq(enrollments.userId, userId1))
    ))
    .limit(1)

  if (enrollment) return true

  // Check if both are students in the same course
  if (user1.role === "student" && user2.role === "student") {
    // Check if they share any course enrollment
    const [sharedCourse] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .leftJoin(
        // Self-join enrollments table to find matching courseId for both users
        // Since Drizzle doesn't support easy self-join aliasing in query builder yet without creating alias table instance,
        // we can use a simpler approach: check if user1 has any courseId that user2 also has.
        // But a raw query or separate queries might be cleaner.
        // Let's use two separate checks or a subquery.
        // Actually, we can just check if there is an enrollment for user1 with courseId IN (enrollments of user2)
        courses, eq(enrollments.courseId, courses.id)
      )
      .where(and(
        eq(enrollments.userId, userId1),
        inArray(
          enrollments.courseId,
          db.select({ courseId: enrollments.courseId }).from(enrollments).where(eq(enrollments.userId, userId2))
        )
      ))
      .limit(1)
    
    if (sharedCourse) return true
  }

  return false
}

export async function createPrivateChat(otherUserId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  if (session.user.id === otherUserId) return { error: "Cannot chat with yourself" }

  // Check permission
  const allowed = await canChat(session.user.id, otherUserId)
  if (!allowed) return { error: "You can only chat with your instructors or classmates" }

  // Check if conversation already exists
  // This is tricky with Drizzle, we need to find a conversation where both users are participants and type is individual
  // A simple way is to fetch all individual conversations of current user and check if other user is in them
  
  const userConversations = await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.userId, session.user.id),
    with: {
      conversation: {
        with: {
          participants: true
        }
      }
    }
  })

  const existingConv = userConversations.find(p => 
    p.conversation.type === "individual" && 
    p.conversation.participants.some(cp => cp.userId === otherUserId)
  )

  if (existingConv) {
    return { conversationId: existingConv.conversationId }
  }

  // Create new conversation
  const [newConv] = await db.insert(conversations).values({
    type: "individual",
  }).returning()

  await db.insert(conversationParticipants).values([
    { conversationId: newConv.id, userId: session.user.id },
    { conversationId: newConv.id, userId: otherUserId },
  ])

  revalidatePath("/student/chat", "page")
  revalidatePath("/instructor/chat", "page")
  revalidatePath("/admin/chat", "page")
  return { conversationId: newConv.id }
}

export async function getAllUsers() {
    const session = await auth()
    if (!session?.user?.id) return []

    // Admins see everyone
    if (session.user.role === "admin") {
      return await db.query.users.findMany({
        where: ne(users.id, session.user.id),
        columns: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
        },
        limit: 50
      })
    }

    // Instructors see their students
    if (session.user.role === "instructor") {
      return await db
        .selectDistinct({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          role: users.role,
        })
        .from(users)
        .innerJoin(enrollments, eq(enrollments.userId, users.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(eq(courses.instructorId, session.user.id))
    }

    // Students see their instructors and classmates
    if (session.user.role === "student") {
      const instructors = await db
        .selectDistinct({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          role: users.role,
        })
        .from(users)
        .innerJoin(courses, eq(courses.instructorId, users.id))
        .innerJoin(enrollments, eq(enrollments.courseId, courses.id))
        .where(eq(enrollments.userId, session.user.id))

      const classmates = await db
        .selectDistinct({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          role: users.role,
        })
        .from(users)
        .innerJoin(enrollments, eq(enrollments.userId, users.id))
        .where(and(
          ne(users.id, session.user.id), // Exclude self
          inArray(
            enrollments.courseId,
            db.select({ courseId: enrollments.courseId }).from(enrollments).where(eq(enrollments.userId, session.user.id))
          )
        ))

      // Merge and remove duplicates by ID
      const allUsers = [...instructors, ...classmates]
      const uniqueUsers = Array.from(new Map(allUsers.map(u => [u.id, u])).values())
      
      return uniqueUsers
    }

    return []
}

export async function getPublicUserProfile(userId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      avatarUrl: true,
      role: true,
      bio: true,
      headline: true,
      websiteUrl: true,
      twitterUrl: true,
      linkedinUrl: true,
      points: true,
      level: true,
      createdAt: true,
    },
  })

  if (!user) return null

  // Get some stats
  const enrolledCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.userId, userId))
    .then((res) => res[0].count)

  const completedCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.status, "completed")))
    .then((res) => res[0].count)

  return {
    ...user,
    stats: {
      enrolled: enrolledCount,
      completed: completedCount,
    }
  }
}
