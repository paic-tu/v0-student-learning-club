"use server"

import { neon } from "@neondatabase/serverless"
import { and, desc, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { courses, enrollments, lessons, notes, users, bookmarks, modules, progress, carts, cartItems, products, orders, orderItems, reviews } from "@/lib/db/schema"

const sql = neon(process.env.DATABASE_URL!)

let cachedUsersColumns: Set<string> | null = null

async function getUsersColumns() {
  if (cachedUsersColumns) return cachedUsersColumns
  const rows = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
  `
  cachedUsersColumns = new Set(rows.map((r: any) => r.column_name))
  return cachedUsersColumns
}

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

export async function getUserBookmarks(userId: string) {
  try {
    const userBookmarks = await sql`
      SELECT 
        b.id,
        b.course_id as "courseId",
        b.created_at,
        c.title_en as "courseTitleEn",
        c.title_ar as "courseTitleAr",
        c.thumbnail_url as "thumbnailUrl",
        c.price,
        c.is_free as "isFree",
        cat.name_en as "categoryNameEn",
        cat.name_ar as "categoryNameAr",
        u.name as "instructorName"
      FROM bookmarks b
      JOIN courses c ON b.course_id = c.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE b.user_id = ${userId}
      ORDER BY b.created_at DESC
    `
    
    // Map to expected structure
    return userBookmarks.map(b => ({
      id: b.id,
      courseId: b.courseId,
      createdAt: b.created_at,
      course: {
        titleEn: b.courseTitleEn,
        titleAr: b.courseTitleAr,
        thumbnailUrl: b.thumbnailUrl,
        price: b.price,
        isFree: b.isFree,
        category: {
          nameEn: b.categoryNameEn,
          nameAr: b.categoryNameAr
        },
        instructor: {
          name: b.instructorName
        }
      }
    }))
  } catch (error) {
    console.error("[v0] Error fetching bookmarks:", error)
    return []
  }
}

export async function toggleBookmark(userId: string, courseId: string) {
  try {
    const existing = await sql`
      SELECT id FROM bookmarks 
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `
    
    if (existing.length > 0) {
      await sql`
        DELETE FROM bookmarks 
        WHERE user_id = ${userId} AND course_id = ${courseId}
      `
      return { bookmarked: false }
    } else {
      await sql`
        INSERT INTO bookmarks (user_id, course_id)
        VALUES (${userId}, ${courseId})
      `
      return { bookmarked: true }
    }
  } catch (error) {
    console.error("[v0] Error toggling bookmark:", error)
    throw error
  }
}

export async function isBookmarked(userId: string, courseId: string) {
  try {
    const result = await sql`
      SELECT 1 FROM bookmarks 
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `
    return result.length > 0
  } catch (error) {
    console.error("[v0] Error checking bookmark:", error)
    return false
  }
}

export async function getLearningData(userId: string, courseId: string, lessonId: string, userRole: string) {
  try {
    // 1. Check enrollment if not instructor/admin
    if (userRole === 'student') {
      const isEnrolled = await checkEnrollmentStatus(userId, courseId)
      if (!isEnrolled) {
        return { error: "Not enrolled" }
      }
    }

    // 2. Fetch Course
    const course = await getCourseById(courseId)
    if (!course) return { error: "Course not found" }

    // 3. Fetch Content (Modules + Lessons)
    const modulesList = await getCourseModules(courseId)
    const lessonsList = await getCourseLessons(courseId)
    
    // Nest lessons into modules
    const courseContent = modulesList.map((mod: any) => ({
      ...mod,
      lessons: lessonsList.filter((l: any) => l.module_id === mod.id)
    }))
    
    // Also handle lessons without module?
    const orphans = lessonsList.filter((l: any) => !l.module_id)
    if (orphans.length > 0) {
      courseContent.push({
        id: "uncategorized",
        title_en: "Other Lessons",
        title_ar: "دروس أخرى",
        lessons: orphans
      })
    }

    // 4. Current Lesson
    const currentLesson = lessonsList.find((l: any) => l.id === lessonId)
    if (!currentLesson) return { error: "Lesson not found", course, courseContent }

    // 5. User Progress
    const enrollment = await sql`
      SELECT completed_lessons, progress FROM enrollments
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `
    const completedLessons = enrollment[0]?.completed_lessons || []
    const progress = Number.parseInt(enrollment[0]?.progress ?? "0", 10) || 0
    
    // 6. Navigation
    const sortedLessons = []
    for (const mod of courseContent) {
      sortedLessons.push(...mod.lessons)
    }
    
    const currentIndex = sortedLessons.findIndex((l: any) => l.id === lessonId)
    const prev = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null
    const next = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null

    return {
      course,
      courseContent,
      currentLesson,
      userProgress: { completedLessons, progress },
      navigation: { prev, next }
    }

  } catch (error) {
    console.error("[v0] Error fetching learning data:", error)
    return { error: "Internal server error" }
  }
}

// Store
export async function getAllStoreItems() {
  try {
    const items = await sql`
      SELECT * FROM products
      WHERE is_active = true
      ORDER BY created_at DESC
    `
    return items
  } catch (error) {
    console.error("[v0] Error fetching store items:", error)
    return []
  }
}

// Cart
export async function addToCart(userId: string, itemId: string, type: 'course' | 'product') {
  try {
    // Check if cart exists
    const cart = await sql`SELECT id FROM carts WHERE user_id = ${userId}`
    let cartId
    
    if (cart.length === 0) {
      const newCart = await sql`INSERT INTO carts (user_id) VALUES (${userId}) RETURNING id`
      cartId = newCart[0].id
    } else {
      cartId = cart[0].id
    }
    
    // Add item
    if (type === 'course') {
      await sql`
        INSERT INTO cart_items (cart_id, course_id, quantity)
        VALUES (${cartId}, ${itemId}, 1)
        ON CONFLICT DO NOTHING
      `
    } else {
       await sql`
        INSERT INTO cart_items (cart_id, product_id, quantity)
        VALUES (${cartId}, ${itemId}, 1)
        ON CONFLICT DO NOTHING
      `
    }
    return { success: true }
  } catch (error) {
    console.error("[v0] Error adding to cart:", error)
    return { error: "Failed to add to cart" }
  }
}

export async function getCartWithItems(userId: string) {
  try {
    const cart = await sql`SELECT id FROM carts WHERE user_id = ${userId}`
    if (cart.length === 0) return null
    
    const cartId = cart[0].id
    
    const items = await sql`
      SELECT 
        ci.*,
        c.title_en as course_title_en,
        c.title_ar as course_title_ar,
        c.price as course_price,
        c.thumbnail_url as course_image,
        p.name_en as product_name_en,
        p.name_ar as product_name_ar,
        p.price as product_price,
        p.image_url as product_image
      FROM cart_items ci
      LEFT JOIN courses c ON ci.course_id = c.id
      LEFT JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = ${cartId}
    `
    
    return {
      id: cartId,
      items: items.map(item => ({
        id: item.id,
        courseId: item.course_id,
        productId: item.product_id,
        quantity: item.quantity,
        titleEn: item.course_title_en || item.product_name_en,
        titleAr: item.course_title_ar || item.product_name_ar,
        price: item.course_price || item.product_price,
        image: item.course_image || item.product_image,
        type: item.course_id ? 'course' : 'product'
      }))
    }
  } catch (error) {
    console.error("[v0] Error fetching cart:", error)
    return null
  }
}

export async function clearCart(userId: string) {
  try {
    const cart = await sql`SELECT id FROM carts WHERE user_id = ${userId}`
    if (cart.length > 0) {
      await sql`DELETE FROM cart_items WHERE cart_id = ${cart[0].id}`
    }
    return true
  } catch (error) {
    console.error("[v0] Error clearing cart:", error)
    return false
  }
}

// Orders
export async function createOrder(userId: string, data: any) {
   try {
    const { totalAmount, items } = data
    
    const order = await sql`
      INSERT INTO orders (user_id, total_amount, status)
      VALUES (${userId}, ${totalAmount}, 'paid')
      RETURNING id
    `
    
    for (const item of items) {
      if (item.type === 'course') {
         await sql`
          INSERT INTO order_items (order_id, course_id, price, quantity)
          VALUES (${order[0].id}, ${item.courseId}, ${item.price}, ${item.quantity})
        `
        // Enroll user
        await createEnrollment(userId, item.courseId)
      } else {
         await sql`
          INSERT INTO order_items (order_id, product_id, price, quantity)
          VALUES (${order[0].id}, ${item.productId}, ${item.price}, ${item.quantity})
        `
      }
    }
    
    await clearCart(userId)
    return order[0]
   } catch (error) {
    console.error("[v0] Error creating order:", error)
    return null
   }
}

// Instructor
export async function getInstructorCourses(instructorId: string) {
  try {
    const courses = await sql`
      SELECT * FROM courses
      WHERE instructor_id = ${instructorId}
      ORDER BY created_at DESC
    `
    return courses
  } catch (error) {
    console.error("[v0] Error fetching instructor courses:", error)
    return []
  }
}

export async function getInstructorAnalytics(instructorId: string) {
  try {
    const totalStudents = await sql`
      SELECT COUNT(DISTINCT e.user_id) as count
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE c.instructor_id = ${instructorId}
    `
    
    const totalCourses = await sql`
      SELECT COUNT(*) as count FROM courses WHERE instructor_id = ${instructorId}
    `
    
    const totalReviews = await sql`
      SELECT COUNT(*) as count 
      FROM reviews r
      JOIN courses c ON r.course_id = c.id
      WHERE c.instructor_id = ${instructorId}
    `

    const averageRatingResult = await sql`
      SELECT COALESCE(AVG(r.rating), 0) as avg
      FROM reviews r
      JOIN courses c ON r.course_id = c.id
      WHERE c.instructor_id = ${instructorId} AND r.is_published = true
    `
    const averageRating = Math.round((Number(averageRatingResult[0]?.avg ?? 0) || 0) * 10) / 10
    
    return {
      totalStudents: parseInt(totalStudents[0].count),
      totalCourses: parseInt(totalCourses[0].count),
      totalReviews: parseInt(totalReviews[0].count),
      totalRevenue: 0,
      averageRating
    }
  } catch (error) {
    console.error("[v0] Error fetching analytics:", error)
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalReviews: 0,
      totalRevenue: 0,
      averageRating: 0
    }
  }
}

export async function getInstructorReviews(instructorId: string) {
  try {
    const reviews = await sql`
      SELECT r.*, u.name as user_name, u.avatar_url, c.title_en as course_title
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN courses c ON r.course_id = c.id
      WHERE c.instructor_id = ${instructorId}
      ORDER BY r.created_at DESC
    `
    return reviews
  } catch (error) {
    console.error("[v0] Error fetching reviews:", error)
    return []
  }
}

export async function getCourseById(id: string) {
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

export async function getCourseLessons(courseId: string) {
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

export async function getCourseModules(courseId: string) {
  try {
    const modules = await sql`
      SELECT * FROM modules
      WHERE course_id = ${courseId}
      ORDER BY order_index ASC
    `
    return modules
  } catch (error) {
    console.error("[v0] Error fetching modules:", error)
    return []
  }
}

// Enrollments
export async function getUserEnrollments(userId: string) {
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
      LEFT JOIN lessons l ON l.course_id = c.id AND l.order_index = 1
      WHERE e.user_id = ${userId}
      ORDER BY e.last_accessed_at DESC NULLS LAST
    `
    return enrollments
  } catch (error) {
    console.error("[v0] Error fetching enrollments:", error)
    return []
  }
}

export async function getEnrollment(userId: string, courseId: string) {
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

export async function isUserEnrolled(userId: string, courseId: string) {
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

export async function createEnrollment(userId: string, courseId: string) {
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
  userId: string,
  courseId: string,
  progress: number,
  completedLessons: string[],
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

export async function getLastAccessedLesson(userId: string, courseId: string) {
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
        AND l.id = ANY(string_to_array(e.completed_lessons, ',')::uuid[])
      ORDER BY l.order_index DESC
      LIMIT 1
    `
    return result[0] || null
  } catch (error) {
    console.error("[v0] Error fetching last accessed lesson:", error)
    return null
  }
}

// Orders
export async function getUserOrders(userId: string) {
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

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    await sql`
      UPDATE orders
      SET 
        status = ${status}::order_status,
        updated_at = NOW()
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

export async function getChallengeById(id: string) {
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
  userId: string,
  challengeId: string,
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

export async function getContestById(id: string) {
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

export async function joinContest(userId: string, contestId: string) {
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
export async function getUserCertificates(userId: string) {
  try {
    const certificates = await sql`
      SELECT 
        c.*,
        co.title_en as course_title_en,
        co.title_ar as course_title_ar,
        co.duration as course_duration,
        u.name as instructor_name
      FROM certificates c
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON co.instructor_id = u.id
      WHERE c.user_id = ${userId}
      ORDER BY c.issued_at DESC
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
        c.duration as course_duration,
        i.name as instructor_name
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      LEFT JOIN courses c ON cert.course_id = c.id
      LEFT JOIN users i ON c.instructor_id = i.id
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

export async function getCohortById(id: string) {
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

export async function getUserCohorts(userId: string) {
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

export async function joinCohort(userId: string, cohortId: string) {
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

export async function getMentorById(id: string) {
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

export async function getUserBookings(userId: string, role: "student" | "mentor" = "student") {
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
  mentorId: string,
  studentId: string,
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

export async function updateBookingStatus(bookingId: string, status: string, meetingUrl?: string) {
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

export async function createBookingReview(bookingId: string, rating: number, feedbackEn?: string, feedbackAr?: string) {
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

// Student Dashboard
export async function getStudentDashboardData(userId: string) {
  try {
    const enrolledCoursesCount = await sql`
      SELECT COUNT(*) as count FROM enrollments WHERE user_id = ${userId} AND status = 'active'
    `
    const completedCourses = await sql`
      SELECT COUNT(*) as count FROM enrollments WHERE user_id = ${userId} AND status = 'completed'
    `
    const certificates = await sql`
      SELECT COUNT(*) as count FROM certificates WHERE user_id = ${userId}
    `
    const totalPoints = await sql`
      SELECT points FROM users WHERE id = ${userId}
    `

    // Get enrolled courses for dashboard list
    const enrolledCourses = await sql`
      SELECT 
        e.id, 
        e.course_id as "courseId", 
        e.progress, 
        c.title_en as "courseTitleEn", 
        c.title_ar as "courseTitleAr",
        c.thumbnail_url as "thumbnailUrl",
        u.name as "instructorName"
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE e.user_id = ${userId}
      ORDER BY e.last_accessed_at DESC
      LIMIT 5
    `
    
    const formattedEnrolledCourses = enrolledCourses.map(e => ({
      id: e.id,
      courseId: e.courseId,
      progress: e.progress,
      course: {
        titleEn: e.courseTitleEn,
        titleAr: e.courseTitleAr,
        thumbnailUrl: e.thumbnailUrl,
        instructor: {
          name: e.instructorName
        }
      }
    }))

    // Get last activity from progress table
    const lastProgress = await sql`
        SELECT p.*, l.title_en, l.title_ar, l.course_id, c.title_en as course_title_en, c.title_ar as course_title_ar
        FROM progress p
        JOIN lessons l ON p.lesson_id = l.id
        JOIN courses c ON l.course_id = c.id
        WHERE p.user_id = ${userId}
        ORDER BY p.last_accessed DESC NULLS LAST
        LIMIT 1
    `

    let lastActivity = null
    if (lastProgress.length > 0) {
        const lp = lastProgress[0]
        const enrollment = await sql`SELECT progress FROM enrollments WHERE user_id = ${userId} AND course_id = ${lp.course_id}`
        
        lastActivity = {
            courseId: lp.course_id,
            lessonId: lp.lesson_id,
            courseTitleEn: lp.course_title_en,
            courseTitleAr: lp.course_title_ar,
            lessonTitleEn: lp.title_en,
            lessonTitleAr: lp.title_ar,
            progress: enrollment[0]?.progress || 0,
            courseTitle: lp.course_title_en, // fallback
            lessonTitle: lp.title_en // fallback
        }
    }

    return {
      stats: {
        activeCourses: Number(enrolledCoursesCount[0]?.count || 0),
        completedCourses: Number(completedCourses[0]?.count || 0),
        certificates: Number(certificates[0]?.count || 0),
        totalPoints: Number(totalPoints[0]?.points || 0),
      },
      lastActivity,
      enrolledCourses: formattedEnrolledCourses 
    }
  } catch (error) {
    console.error("[Query] getStudentDashboardData error:", error)
    return {
      stats: { activeCourses: 0, completedCourses: 0, certificates: 0, totalPoints: 0 },
      lastActivity: null,
      enrolledCourses: []
    }
  }
}

export async function getStudentCourses(userId: string) {
  try {
    const rows = await sql`
      SELECT 
        e.id as enrollment_id,
        e.progress,
        e.status as enrollment_status,
        e.last_accessed_at,
        c.id as course_id,
        c.title_en,
        c.title_ar,
        c.thumbnail_url,
        c.slug,
        u.name as instructor_name,
        cat.name_en as category_name_en,
        cat.name_ar as category_name_ar
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE e.user_id = ${userId}
      ORDER BY e.last_accessed_at DESC
    `
    return rows.map((r: any) => ({
      id: r.enrollment_id,
      courseId: r.course_id,
      progress: r.progress,
      status: r.enrollment_status,
      lastAccessedAt: r.last_accessed_at,
      course: {
        id: r.course_id,
        titleEn: r.title_en,
        titleAr: r.title_ar,
        thumbnailUrl: r.thumbnail_url,
        slug: r.slug,
        category: {
          nameEn: r.category_name_en,
          nameAr: r.category_name_ar,
        },
        instructor: {
          name: r.instructor_name,
        },
      },
    }))
  } catch (error) {
    console.error("[v0] Error fetching student courses:", error)
    return []
  }
}

export async function getUserProfile(userId: string) {
  try {
    const cols = await getUsersColumns()

    const selectCols: any = {
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      headline: users.headline,
      websiteUrl: users.websiteUrl,
      twitterUrl: users.twitterUrl,
      linkedinUrl: users.linkedinUrl,
      points: users.points,
      level: users.level,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }

    if (cols.has("phone_number")) {
      selectCols.phoneNumber = users.phoneNumber
    }

    const rows = await db.select(selectCols).from(users).where(eq(users.id, userId)).limit(1)
    return rows[0] ?? null
  } catch (error) {
    console.error("[v0] Error fetching user profile:", error)
    return null
  }
}

export async function updateUserProfile(userId: string, data: {
  name?: string
  bio?: string
  headline?: string
  websiteUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  avatarUrl?: string
  phoneNumber?: string | null
}) {
  try {
    const cols = await getUsersColumns()
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    }

    if ("phoneNumber" in updateData && !cols.has("phone_number")) {
      delete updateData.phoneNumber
    }

    const returnCols: any = {
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatarUrl: users.avatarUrl,
      bio: users.bio,
      headline: users.headline,
      websiteUrl: users.websiteUrl,
      twitterUrl: users.twitterUrl,
      linkedinUrl: users.linkedinUrl,
      points: users.points,
      level: users.level,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }

    if (cols.has("phone_number")) {
      returnCols.phoneNumber = users.phoneNumber
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning(returnCols)
    
    return updatedUser[0]
  } catch (error) {
    console.error("[v0] Error updating user profile:", error)
    return null
  }
}

export async function getUserNotes(userId: string) {
  try {
    const userNotes = await db
      .select({
        id: notes.id,
        content: notes.content,
        timestamp: notes.timestamp,
        createdAt: notes.createdAt,
        lessonId: notes.lessonId,
        lessonTitleEn: lessons.titleEn,
        lessonTitleAr: lessons.titleAr,
        courseId: lessons.courseId,
        courseTitleEn: courses.titleEn,
        courseTitleAr: courses.titleAr,
      })
      .from(notes)
      .leftJoin(lessons, eq(notes.lessonId, lessons.id))
      .leftJoin(courses, eq(lessons.courseId, courses.id))
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.createdAt));
      
    return userNotes;
  } catch (error) {
    console.error("[v0] Error fetching user notes:", error);
    return [];
  }
}

export async function getUserLessonNotes(userId: string, lessonId: string) {
  try {
    const lessonNotes = await db
      .select({
        id: notes.id,
        content: notes.content,
        timestamp: notes.timestamp,
        createdAt: notes.createdAt,
      })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
      .orderBy(desc(notes.createdAt));
      
    return lessonNotes;
  } catch (error) {
    console.error("[v0] Error fetching lesson notes:", error);
    return [];
  }
}

export async function createNote(userId: string, lessonId: string, content: string, timestamp?: number) {
  try {
    const [newNote] = await db.insert(notes).values({
      userId,
      lessonId,
      content,
      timestamp,
    }).returning();
    return newNote;
  } catch (error) {
    console.error("[v0] Error creating note:", error);
    return null;
  }
}

export async function deleteNote(noteId: string, userId: string) {
    try {
        await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)));
        return true;
    } catch (error) {
        console.error("[v0] Error deleting note:", error);
        return false;
    }
}

export async function checkEnrollmentStatus(userId: string, courseId: string) {
  try {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    })
    return !!enrollment
  } catch (error) {
    console.error("[Query] checkEnrollmentStatus error:", error)
    return false
  }
}
