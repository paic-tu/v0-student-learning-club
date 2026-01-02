"use server"

import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Courses
export async function getAllCourses() {
  try {
    const courses = await sql`
      SELECT 
        c.*,
        u.name as instructor_name,
        cat.name_en as category_name_en,
        cat.name_ar as category_name_ar
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.is_published = true
      ORDER BY c.created_at DESC
    `
    return courses
  } catch (error) {
    console.error("[v0] Error fetching courses:", error)
    return []
  }
}

export async function getCourseById(id: number) {
  try {
    const courses = await sql`
      SELECT 
        c.*,
        u.name as instructor_name,
        u.bio as instructor_bio,
        cat.name_en as category_name_en,
        cat.name_ar as category_name_ar
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.id = ${id}
      LIMIT 1
    `

    if (courses.length === 0) return null

    // Get lessons for this course
    const lessons = await sql`
      SELECT * FROM lessons
      WHERE course_id = ${id}
      ORDER BY order_index ASC
    `

    return { ...courses[0], lessons }
  } catch (error) {
    console.error("[v0] Error fetching course:", error)
    return null
  }
}

export async function getCourseLessons(courseId: number) {
  try {
    const lessons = await sql`
      SELECT * FROM lessons
      WHERE course_id = ${courseId}
      ORDER BY order_index ASC
    `
    return lessons
  } catch (error) {
    console.error("[v0] Error fetching lessons:", error)
    return []
  }
}

// Enrollments
export async function getUserEnrollments(userId: number) {
  try {
    const enrollments = await sql`
      SELECT 
        e.*,
        c.id as course_id,
        c.title_en,
        c.title_ar,
        c.thumbnail_url,
        c.difficulty,
        u.name as instructor_name,
        l.id as first_lesson_id,
        l.title_en as first_lesson_title_en,
        l.title_ar as first_lesson_title_ar
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN lessons l ON l.course_id = c.id AND l.order_index = 1 AND l.deleted_at IS NULL
      WHERE e.user_id = ${userId}
      ORDER BY e.last_accessed_at DESC NULLS LAST
    `
    return enrollments
  } catch (error) {
    console.error("[v0] Error fetching enrollments:", error)
    return []
  }
}

export async function getEnrollment(userId: number, courseId: number) {
  try {
    const result = await sql`
      SELECT * FROM enrollments
      WHERE user_id = ${userId} AND course_id = ${courseId}
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching enrollment:", error)
    return null
  }
}

export async function isUserEnrolled(userId: number, courseId: number) {
  try {
    const result = await sql`
      SELECT 1 FROM enrollments 
      WHERE user_id = ${userId} AND course_id = ${courseId}
      LIMIT 1
    `
    return result.length > 0
  } catch (error) {
    console.error("[v0] Error checking enrollment:", error)
    return false
  }
}

export async function createEnrollment(userId: number, courseId: number) {
  try {
    const alreadyEnrolled = await isUserEnrolled(userId, courseId)
    if (alreadyEnrolled) {
      console.log("[v0] User already enrolled in course")
      return { already_enrolled: true }
    }

    const result = await sql`
      INSERT INTO enrollments (user_id, course_id, progress, completed_lessons)
      VALUES (${userId}, ${courseId}, 0, '[]')
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating enrollment:", error)
    return null
  }
}

export async function updateEnrollmentProgress(
  userId: number,
  courseId: number,
  progress: number,
  completedLessons: number[],
) {
  try {
    await sql`
      UPDATE enrollments
      SET 
        progress = ${progress},
        completed_lessons = ${JSON.stringify(completedLessons)},
        last_accessed_at = NOW()
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `
    return true
  } catch (error) {
    console.error("[v0] Error updating enrollment:", error)
    return false
  }
}

export async function getLastAccessedLesson(userId: number, courseId: number) {
  try {
    const result = await sql`
      SELECT 
        l.id,
        l.title_en,
        l.title_ar,
        l.order_index
      FROM lessons l
      JOIN enrollments e ON e.course_id = l.course_id
      WHERE e.user_id = ${userId} 
        AND e.course_id = ${courseId}
        AND l.id = ANY(string_to_array(e.completed_lessons, ',')::int[])
      ORDER BY l.order_index DESC
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching last accessed lesson:", error)
    return null
  }
}

// Store Items
export async function getAllStoreItems() {
  try {
    const items = await sql`
      SELECT 
        s.*,
        cat.name_en as category_name_en,
        cat.name_ar as category_name_ar
      FROM store_items s
      LEFT JOIN categories cat ON s.category_id = cat.id
      WHERE s.is_active = true
      ORDER BY s.created_at DESC
    `
    return items
  } catch (error) {
    console.error("[v0] Error fetching store items:", error)
    return []
  }
}

export async function getStoreItemById(id: number) {
  try {
    const result = await sql`
      SELECT * FROM store_items
      WHERE id = ${id}
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching store item:", error)
    return null
  }
}

// Orders
export async function getUserOrders(userId: number) {
  try {
    const orders = await sql`
      SELECT * FROM orders
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return orders
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return []
  }
}

export async function createOrder(
  userId: number,
  items: any[],
  totalAmount: number,
  shippingAddress?: string,
  notes?: string,
) {
  try {
    const result = await sql`
      INSERT INTO orders (user_id, items, total_amount, status, shipping_address, notes)
      VALUES (
        ${userId},
        ${JSON.stringify(items)},
        ${totalAmount},
        'pending',
        ${shippingAddress || null},
        ${notes || null}
      )
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    return null
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  try {
    await sql`
      UPDATE orders
      SET 
        status = ${status}::order_status,
        completed_at = ${status === "completed" ? sql`NOW()` : null}
      WHERE id = ${orderId}
    `
    return true
  } catch (error) {
    console.error("[v0] Error updating order:", error)
    return false
  }
}

// Challenges
export async function getAllChallenges() {
  try {
    const challenges = await sql`
      SELECT 
        ch.*,
        cat.name_en as category_name_en,
        cat.name_ar as category_name_ar
      FROM challenges ch
      LEFT JOIN categories cat ON ch.category_id = cat.id
      WHERE ch.is_active = true
      ORDER BY ch.created_at DESC
    `
    return challenges
  } catch (error) {
    console.error("[v0] Error fetching challenges:", error)
    return []
  }
}

export async function getChallengeById(id: number) {
  try {
    const result = await sql`
      SELECT * FROM challenges
      WHERE id = ${id}
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching challenge:", error)
    return null
  }
}

export async function submitChallenge(
  userId: number,
  challengeId: number,
  code: string,
  score: number,
  isPassed: boolean,
) {
  try {
    const result = await sql`
      INSERT INTO challenge_submissions (user_id, challenge_id, code, score, is_passed)
      VALUES (${userId}, ${challengeId}, ${code}, ${score}, ${isPassed})
      RETURNING *
    `

    // Update user points if passed
    if (isPassed) {
      const challenge = await getChallengeById(challengeId)
      if (challenge) {
        await sql`
          UPDATE users
          SET points = points + ${challenge.points}
          WHERE id = ${userId}
        `
      }
    }

    return result[0]
  } catch (error) {
    console.error("[v0] Error submitting challenge:", error)
    return null
  }
}

// Contests
export async function getAllContests() {
  try {
    const contests = await sql`
      SELECT * FROM contests
      ORDER BY start_date DESC
    `
    return contests
  } catch (error) {
    console.error("[v0] Error fetching contests:", error)
    return []
  }
}

export async function getContestById(id: number) {
  try {
    const result = await sql`
      SELECT * FROM contests
      WHERE id = ${id}
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching contest:", error)
    return null
  }
}

export async function joinContest(userId: number, contestId: number) {
  try {
    const result = await sql`
      INSERT INTO contest_participants (user_id, contest_id, score)
      VALUES (${userId}, ${contestId}, 0)
      ON CONFLICT (user_id, contest_id) DO NOTHING
      RETURNING *
    `

    // Update participant count
    if (result.length > 0) {
      await sql`
        UPDATE contests
        SET participant_count = participant_count + 1
        WHERE id = ${contestId}
      `
    }

    return result[0] || null
  } catch (error) {
    console.error("[v0] Error joining contest:", error)
    return null
  }
}

// Certificates
export async function getUserCertificates(userId: number) {
  try {
    const certificates = await sql`
      SELECT 
        cert.*,
        c.title_en as course_title_en,
        c.title_ar as course_title_ar,
        con.title_en as contest_title_en,
        con.title_ar as contest_title_ar
      FROM certificates cert
      LEFT JOIN courses c ON cert.course_id = c.id
      LEFT JOIN contests con ON cert.contest_id = con.id
      WHERE cert.user_id = ${userId}
      AND cert.status = 'issued'
      ORDER BY cert.issued_at DESC
    `
    return certificates
  } catch (error) {
    console.error("[v0] Error fetching certificates:", error)
    return []
  }
}

export async function getCertificateByNumber(certNumber: string) {
  try {
    const result = await sql`
      SELECT 
        cert.*,
        u.name as user_name,
        c.title_en as course_title_en,
        c.title_ar as course_title_ar,
        con.title_en as contest_title_en,
        con.title_ar as contest_title_ar
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      LEFT JOIN courses c ON cert.course_id = c.id
      LEFT JOIN contests con ON cert.contest_id = con.id
      WHERE cert.certificate_number = ${certNumber}
      AND cert.status = 'issued'
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching certificate:", error)
    return null
  }
}

// Categories
export async function getAllCategories() {
  try {
    const categories = await sql`
      SELECT * FROM categories
      ORDER BY name_en ASC
    `
    return categories
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return []
  }
}

// Statistics
export async function getPlatformStats() {
  try {
    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as student_count,
        (SELECT COUNT(*) FROM courses WHERE is_published = true) as course_count,
        (SELECT COUNT(*) FROM enrollments) as enrollment_count,
        (SELECT COUNT(*) FROM certificates WHERE status = 'issued') as certificate_count,
        (SELECT COUNT(*) FROM challenges WHERE is_active = true) as challenge_count,
        (SELECT COUNT(*) FROM contests) as contest_count
    `
    return stats[0]
  } catch (error) {
    console.error("[v0] Error fetching stats:", error)
    return null
  }
}

// V3 Cohorts queries
export async function getAllCohorts() {
  try {
    const cohorts = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        COUNT(DISTINCT cm.id) FILTER (WHERE cm.status = 'active') as active_members,
        COUNT(DISTINCT cm.id) FILTER (WHERE cm.status = 'waitlist') as waitlist_members
      FROM cohorts c
      JOIN users u ON c.created_by = u.id
      LEFT JOIN cohort_members cm ON c.id = cm.cohort_id
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `
    return cohorts
  } catch (error) {
    console.error("[v0] Error fetching cohorts:", error)
    return []
  }
}

export async function getCohortById(id: number) {
  try {
    const result = await sql`
      SELECT 
        c.*,
        u.name as creator_name,
        u.email as creator_email
      FROM cohorts c
      JOIN users u ON c.created_by = u.id
      WHERE c.id = ${id}
      LIMIT 1
    `

    if (result.length === 0) return null

    // Get courses
    const courses = await sql`
      SELECT 
        cc.*,
        co.title_en,
        co.title_ar,
        co.thumbnail_url,
        co.difficulty
      FROM cohort_courses cc
      JOIN courses co ON cc.course_id = co.id
      WHERE cc.cohort_id = ${id}
      ORDER BY cc.order_index ASC
    `

    // Get members
    const members = await sql`
      SELECT 
        cm.*,
        u.name,
        u.email,
        u.avatar_url
      FROM cohort_members cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.cohort_id = ${id}
      ORDER BY cm.joined_at DESC
    `

    // Get schedule
    const schedule = await sql`
      SELECT *
      FROM cohort_schedule
      WHERE cohort_id = ${id}
      ORDER BY starts_at ASC
    `

    // Get announcements
    const announcements = await sql`
      SELECT 
        ca.*,
        u.name as author_name,
        u.avatar_url as author_avatar
      FROM cohort_announcements ca
      JOIN users u ON ca.created_by = u.id
      WHERE ca.cohort_id = ${id}
      ORDER BY ca.pinned DESC, ca.created_at DESC
    `

    return {
      ...result[0],
      courses,
      members,
      schedule,
      announcements,
    }
  } catch (error) {
    console.error("[v0] Error fetching cohort:", error)
    return null
  }
}

export async function getUserCohorts(userId: number) {
  try {
    const cohorts = await sql`
      SELECT 
        c.*,
        cm.role as user_role,
        cm.status as user_status,
        u.name as creator_name
      FROM cohorts c
      JOIN cohort_members cm ON c.id = cm.cohort_id
      JOIN users u ON c.created_by = u.id
      WHERE cm.user_id = ${userId}
      ORDER BY c.starts_at DESC
    `
    return cohorts
  } catch (error) {
    console.error("[v0] Error fetching user cohorts:", error)
    return []
  }
}

export async function joinCohort(userId: number, cohortId: number) {
  try {
    // Check if cohort is full
    const cohort = await sql`
      SELECT 
        c.*,
        COUNT(cm.id) FILTER (WHERE cm.status = 'active') as active_count
      FROM cohorts c
      LEFT JOIN cohort_members cm ON c.id = cm.cohort_id
      WHERE c.id = ${cohortId}
      GROUP BY c.id
    `

    if (cohort.length === 0) return { success: false, error: "Cohort not found" }

    const isFull = cohort[0].active_count >= cohort[0].capacity
    const status = isFull ? "waitlist" : "active"

    const result = await sql`
      INSERT INTO cohort_members (cohort_id, user_id, role, status)
      VALUES (${cohortId}, ${userId}, 'student', ${status}::cohort_member_status)
      ON CONFLICT (cohort_id, user_id) DO NOTHING
      RETURNING *
    `

    return { success: true, status, member: result[0] }
  } catch (error) {
    console.error("[v0] Error joining cohort:", error)
    return { success: false, error: "Failed to join cohort" }
  }
}

export async function createCohortAnnouncement(
  cohortId: number,
  createdBy: number,
  titleEn: string,
  titleAr: string,
  bodyEn: string,
  bodyAr: string,
  pinned = false,
) {
  try {
    const result = await sql`
      INSERT INTO cohort_announcements 
        (cohort_id, created_by, title_en, title_ar, body_en, body_ar, pinned)
      VALUES 
        (${cohortId}, ${createdBy}, ${titleEn}, ${titleAr}, ${bodyEn}, ${bodyAr}, ${pinned})
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating announcement:", error)
    return null
  }
}

// V3 Mentorship queries
export async function getAllMentors() {
  try {
    const mentors = await sql`
      SELECT 
        m.*,
        u.name,
        u.email,
        u.avatar_url,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') as completed_sessions
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN bookings b ON m.id = b.mentor_id
      WHERE m.is_active = true
      GROUP BY m.id, u.name, u.email, u.avatar_url
      ORDER BY m.rating DESC, m.total_sessions DESC
    `
    return mentors
  } catch (error) {
    console.error("[v0] Error fetching mentors:", error)
    return []
  }
}

export async function getMentorById(id: number) {
  try {
    const result = await sql`
      SELECT 
        m.*,
        u.name,
        u.email,
        u.avatar_url,
        u.bio as user_bio
      FROM mentors m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ${id}
      LIMIT 1
    `

    if (result.length === 0) return null

    // Get availability
    const availability = await sql`
      SELECT * FROM mentor_availability
      WHERE mentor_id = ${id}
      ORDER BY weekday ASC, start_time ASC
    `

    // Get reviews
    const reviews = await sql`
      SELECT 
        br.*,
        b.topic,
        b.start_at,
        u.name as student_name,
        u.avatar_url as student_avatar
      FROM booking_reviews br
      JOIN bookings b ON br.booking_id = b.id
      JOIN users u ON b.student_id = u.id
      WHERE b.mentor_id = ${id}
      ORDER BY br.created_at DESC
      LIMIT 10
    `

    return {
      ...result[0],
      availability,
      reviews,
    }
  } catch (error) {
    console.error("[v0] Error fetching mentor:", error)
    return null
  }
}

export async function getUserBookings(userId: number, role: "student" | "mentor" = "student") {
  try {
    const bookings = await sql`
      SELECT 
        b.*,
        ${role === "student" ? sql`m.user_id as mentor_user_id, u_mentor.name as mentor_name, u_mentor.avatar_url as mentor_avatar` : sql`u_student.name as student_name, u_student.avatar_url as student_avatar`}
      FROM bookings b
      ${role === "student" ? sql`JOIN mentors m ON b.mentor_id = m.id JOIN users u_mentor ON m.user_id = u_mentor.id` : sql`JOIN users u_student ON b.student_id = u_student.id`}
      WHERE ${role === "student" ? sql`b.student_id = ${userId}` : sql`b.mentor_id = (SELECT id FROM mentors WHERE user_id = ${userId})`}
      ORDER BY b.start_at DESC
    `
    return bookings
  } catch (error) {
    console.error("[v0] Error fetching bookings:", error)
    return []
  }
}

export async function createBooking(
  mentorId: number,
  studentId: number,
  startAt: Date,
  endAt: Date,
  topic: string,
  notes?: string,
) {
  try {
    const result = await sql`
      INSERT INTO bookings (mentor_id, student_id, start_at, end_at, topic, notes, status)
      VALUES (${mentorId}, ${studentId}, ${startAt.toISOString()}, ${endAt.toISOString()}, ${topic}, ${notes || null}, 'requested')
      RETURNING *
    `
    return result[0]
  } catch (error) {
    console.error("[v0] Error creating booking:", error)
    return null
  }
}

export async function updateBookingStatus(bookingId: number, status: string, meetingUrl?: string) {
  try {
    await sql`
      UPDATE bookings
      SET 
        status = ${status}::booking_status,
        meeting_url = ${meetingUrl || null},
        updated_at = NOW()
      WHERE id = ${bookingId}
    `
    return true
  } catch (error) {
    console.error("[v0] Error updating booking:", error)
    return false
  }
}

export async function createBookingReview(bookingId: number, rating: number, feedbackEn?: string, feedbackAr?: string) {
  try {
    const result = await sql`
      INSERT INTO booking_reviews (booking_id, rating, feedback_en, feedback_ar)
      VALUES (${bookingId}, ${rating}, ${feedbackEn || null}, ${feedbackAr || null})
      RETURNING *
    `

    // Update mentor rating
    await sql`
      UPDATE mentors m
      SET 
        rating = (
          SELECT AVG(br.rating)
          FROM booking_reviews br
          JOIN bookings b ON br.booking_id = b.id
          WHERE b.mentor_id = m.id
        ),
        total_sessions = total_sessions + 1
      WHERE id = (SELECT mentor_id FROM bookings WHERE id = ${bookingId})
    `

    return result[0]
  } catch (error) {
    console.error("[v0] Error creating review:", error)
    return null
  }
}

// Users
export async function getInstructors() {
  try {
    const instructors = await sql`
      SELECT id, name, email, avatar_url
      FROM users
      WHERE role IN ('instructor', 'admin')
      ORDER BY name ASC
    `
    return instructors
  } catch (error) {
    console.error("[v0] Error fetching instructors:", error)
    return []
  }
}
