"use server"

import { and, desc, eq, count, sql, inArray, asc, getTableColumns, sum, not, or, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { 
  courses, enrollments, lessons, notes, users, bookmarks, modules, progress, 
  carts, cartItems, products, orders, orderItems, reviews,
  certificates, challenges, contests, categories, challengeSubmissions, contestParticipants,
  cohorts, cohortMembers, cohortCourses, cohortSchedule, cohortAnnouncements,
  mentors, bookings, bookingReviews, mentorAvailability
} from "@/lib/db/schema"

// Courses
export async function getAllCourses() {
  try {
    const allCourses = await db.query.courses.findMany({
      where: eq(courses.isPublished, true),
      with: {
        instructor: true,
        category: true,
      },
      orderBy: [desc(courses.createdAt)],
    })

    return allCourses.map(c => ({
      ...c,
      instructor_name: c.instructor.name,
      category_name_en: c.category?.nameEn,
      category_name_ar: c.category?.nameAr,
    }))
  } catch (error) {
    console.error("[v0] Error fetching courses:", error)
    return []
  }
}

export async function getCourseById(courseId: string) {
  try {
    if (!courseId) {
      console.warn("getCourseById called with empty courseId")
      return null
    }

    // Split query to avoid complexity issues
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        instructor: true,
        category: true,
      },
    })

    if (!course) return null

    const courseModules = await db.query.modules.findMany({
      where: eq(modules.courseId, courseId),
      orderBy: [asc(modules.orderIndex)],
      with: {
        lessons: {
          orderBy: [asc(lessons.orderIndex)],
        },
      },
    })

    return {
      ...course,
      modules: courseModules
    }
  } catch (error) {
    console.error("Error fetching course:", error)
    return null
  }
}

export async function getCourseContent(courseId: string) {
  return getCourseById(courseId)
}

export async function getLessonById(id: string) {
  try {
    const lesson = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
      with: {
        module: {
          with: {
            course: true
          }
        }
      }
    })
    return lesson
  } catch (error) {
    console.error("Error fetching lesson:", error)
    return null
  }
}

export async function getCourseModules(courseId: string) {
  try {
    return await db.query.modules.findMany({
      where: eq(modules.courseId, courseId),
      orderBy: [asc(modules.orderIndex)],
      with: {
        lessons: {
          orderBy: [asc(lessons.orderIndex)],
        },
      },
    })
  } catch (error) {
    console.error("Error fetching course modules:", error)
    return []
  }
}

export async function getCourseLessons(courseId: string) {
  try {
    return await db.query.lessons.findMany({
      where: eq(lessons.courseId, courseId),
      orderBy: [asc(lessons.orderIndex)],
      with: {
        module: true
      }
    })
  } catch (error) {
    console.error("Error fetching course lessons:", error)
    return []
  }
}

export async function getInstructors() {
  try {
    return await db.query.users.findMany({
      where: inArray(users.role, ["instructor", "admin"]),
    })
  } catch (error) {
    console.error("Error fetching instructors:", error)
    return []
  }
}

export async function getInstructorCourses(instructorId: string) {
  try {
    return await db.query.courses.findMany({
      where: eq(courses.instructorId, instructorId),
      orderBy: [desc(courses.createdAt)],
      with: {
        category: true,
      }
    })
  } catch (error) {
    console.error("Error fetching instructor courses:", error)
    return []
  }
}

export async function getCourseQuizzes(courseId: string, instructorId?: string) {
  try {
    const conditions = [eq(challenges.type, "quiz")]
    
    if (instructorId) {
      conditions.push(
        or(
          eq(challenges.courseId, courseId),
          and(isNull(challenges.courseId), eq(challenges.instructorId, instructorId))
        )!
      )
    } else {
      conditions.push(eq(challenges.courseId, courseId))
    }

    return await db.query.challenges.findMany({
      where: and(...conditions),
      orderBy: [desc(challenges.createdAt)],
    })
  } catch (error) {
    console.error("Error fetching course quizzes:", error)
    return []
  }
}

export async function getQuizById(quizId: string) {
  try {
    const quiz = await db.query.challenges.findFirst({
      where: eq(challenges.id, quizId),
    })
    return quiz
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return null
  }
}

export async function getQuizSubmission(challengeId: string, userId: string) {
  try {
    const submission = await db.query.challengeSubmissions.findFirst({
      where: and(
        eq(challengeSubmissions.challengeId, challengeId),
        eq(challengeSubmissions.userId, userId)
      ),
      orderBy: [desc(challengeSubmissions.submittedAt)]
    })
    return submission
  } catch (error) {
    console.error("Error fetching quiz submission:", error)
    return null
  }
}

export async function getInstructorStats(instructorId: string) {
  try {
    const coursesCount = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .then(res => res[0].count)

    const studentsCount = await db
      .select({ count: count() })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(courses.instructorId, instructorId))
      .then(res => res[0].count)

    const reviewsCount = await db
      .select({ count: count() })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .where(eq(courses.instructorId, instructorId))
      .then(res => res[0].count)

    const avgRating = await db
      .select({ avg: sql`AVG(${reviews.rating})` })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .where(eq(courses.instructorId, instructorId))
      .then(res => Number(res[0]?.avg || 0).toFixed(1))

    const avgInstructorRating = await db
      .select({ avg: sql`AVG(${reviews.instructorRating})` })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .where(eq(courses.instructorId, instructorId))
      .then(res => Number(res[0]?.avg || 0).toFixed(1))

    return {
      courses: coursesCount,
      students: studentsCount,
      reviews: reviewsCount,
      rating: avgRating,
      instructorRating: avgInstructorRating
    }
  } catch (error) {
    console.error("Error fetching instructor stats:", error)
    return {
      courses: 0,
      students: 0,
      reviews: 0,
      rating: "0.0",
      instructorRating: "0.0"
    }
  }
}

// User Profile
export async function getUserProfile(userId: string) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    return user
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return null
  }
}

export async function getStudentDashboardData(userId: string) {
  try {
    const enrolledCourses = await db.query.enrollments.findMany({
      where: eq(enrollments.userId, userId),
      with: {
        course: {
          with: {
            instructor: true,
            category: true,
          }
        }
      },
      orderBy: [desc(enrollments.lastAccessedAt)]
    })

    const completedCourses = enrolledCourses.filter(e => e.progress === 100).length
    const inProgressCourses = enrolledCourses.length - completedCourses
    
    // Calculate total learning hours (approximate from completed lessons duration)
    // This is complex without tracking time per lesson, so we'll just sum course durations for completed courses for now
    // or rely on progress table if we want to be precise.
    // For simplicity, let's use enrollment progress * course duration
    let totalLearningHours = 0
    enrolledCourses.forEach(e => {
      const courseDuration = e.course.duration || 0
      totalLearningHours += (courseDuration * (e.progress / 100)) / 60
    })

    return {
      enrolledCourses: enrolledCourses.map(e => ({
        ...e.course,
        progress: e.progress,
        lastAccessedAt: e.lastAccessedAt,
        enrollmentId: e.id
      })),
      stats: {
        completedCourses,
        inProgressCourses,
        certificates: completedCourses, // Assuming 1 cert per completed course
        learningHours: Math.round(totalLearningHours)
      }
    }
  } catch (error) {
    console.error("Error fetching student dashboard data:", error)
    return {
      enrolledCourses: [],
      stats: {
        completedCourses: 0,
        inProgressCourses: 0,
        certificates: 0,
        learningHours: 0
      }
    }
  }
}

export async function getInstructorDashboardData(instructorId: string) {
  const stats = await getInstructorStats(instructorId)
  const recentCourses = await getInstructorCourses(instructorId)
  
  // Get recent enrollments
  const recentEnrollments = await db
    .select({
      id: enrollments.id,
      user: users,
      course: courses,
      createdAt: enrollments.createdAt,
      progress: enrollments.progress
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(eq(courses.instructorId, instructorId))
    .orderBy(desc(enrollments.createdAt))
    .limit(5)

  return {
    stats,
    recentCourses: recentCourses.slice(0, 5),
    recentEnrollments: recentEnrollments.map(e => ({
      id: e.id,
      studentName: e.user.name,
      studentAvatar: e.user.avatarUrl,
      courseName: e.course.titleEn, // Or handle locale
      progress: e.progress,
      date: e.createdAt
    }))
  }
}

export async function getAllCategories() {
  try {
    return await db.query.categories.findMany({
      orderBy: [asc(categories.nameEn)]
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function getCourseEnrollments(courseId: string) {
  try {
    const courseEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.courseId, courseId),
      with: {
        user: true
      },
      orderBy: [desc(enrollments.createdAt)]
    })
    return courseEnrollments
  } catch (error) {
    console.error("Error fetching course enrollments:", error)
    return []
  }
}

export async function getEnrollment(userId: string, courseId: string) {
  try {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ),
    })
    return enrollment
  } catch (error) {
    console.error("Error fetching enrollment:", error)
    return null
  }
}

export async function getStudentCourses(userId: string) {
  try {
    const studentEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.userId, userId),
      with: {
        course: {
          with: {
            instructor: true,
            category: true,
          }
        }
      },
      orderBy: [desc(enrollments.createdAt)],
    })
    return studentEnrollments
  } catch (error) {
    console.error("Error fetching student courses:", error)
    return []
  }
}

// Reviews
export async function getInstructorReviews(instructorId: string) {
  try {
    const result = await db
      .select({
        review: reviews,
        user: users,
        course: courses
      })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(courses.instructorId, instructorId))
      .orderBy(desc(reviews.createdAt))
      
    return result.map(r => ({
      ...r.review,
      user: r.user,
      course: r.course
    }))
  } catch (error) {
    console.error("Error fetching instructor reviews:", error)
    return []
  }
}

export async function getAllReviews() {
  try {
    const result = await db.query.reviews.findMany({
      with: {
        user: true,
        course: {
          with: {
            instructor: true
          }
        }
      },
      orderBy: [desc(reviews.createdAt)],
    })
    return result
  } catch (error) {
    console.error("Error fetching all reviews:", error)
    return []
  }
}

// Bookmarks
export async function getUserBookmarks(userId: string) {
  try {
    const userBookmarks = await db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, userId),
      with: {
        course: {
          with: {
            instructor: true,
            category: true,
          }
        }
      },
      orderBy: [desc(bookmarks.createdAt)]
    })
    return userBookmarks
  } catch (error) {
    console.error("Error fetching user bookmarks:", error)
    return []
  }
}

export async function isBookmarked(userId: string, courseId: string) {
  try {
    const bookmark = await db.query.bookmarks.findFirst({
      where: and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.courseId, courseId)
      )
    })
    return !!bookmark
  } catch (error) {
    return false
  }
}

export async function toggleBookmark(userId: string, courseId: string) {
  try {
    const existing = await isBookmarked(userId, courseId)
    if (existing) {
      await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.courseId, courseId)))
      return false // Removed
    } else {
      await db.insert(bookmarks).values({ userId, courseId })
      return true // Added
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    throw error
  }
}

// Certificates
export async function getUserCertificates(userId: string) {
  try {
    return await db.query.certificates.findMany({
      where: eq(certificates.userId, userId),
      with: {
        course: true
      },
      orderBy: [desc(certificates.issuedAt)]
    })
  } catch (error) {
    console.error("Error fetching certificates:", error)
    return []
  }
}

// Notes
export async function createNote(userId: string, lessonId: string, content: string, timestamp?: number) {
  try {
    const [note] = await db.insert(notes).values({
      userId,
      lessonId,
      content,
      timestamp
    }).returning()
    return note
  } catch (error) {
    console.error("Error creating note:", error)
    return null
  }
}

export async function deleteNote(noteId: string, userId: string) {
   try {
     await db.delete(notes).where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
     return true
   } catch (error) {
     console.error("Error deleting note:", error)
     return false
   }
}

export async function getUserLessonNotes(userId: string, lessonId: string) {
  try {
    return await db.query.notes.findMany({
      where: and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)),
      orderBy: [desc(notes.createdAt)]
    })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return []
  }
}

// Learning Data
export async function getLearningData(userId: string, courseId: string, lessonId: string, role?: string) {
  try {
     // Get Course with Modules and Lessons
     const course = await getCourseById(courseId)
     if (!course) return { error: "Course not found" }

     // Get Enrollment
     let enrollment = await getEnrollment(userId, courseId)
     
     // If not enrolled and not instructor/admin, return error
     if (!enrollment && role !== "instructor" && role !== "admin") {
       return { error: "Not enrolled" }
     }

     // Get Current Lesson
     const currentLesson = await getLessonById(lessonId)
     
     // Calculate navigation
     // @ts-ignore
     const allLessons = course.modules?.flatMap((m: any) => m.lessons) || []
     // @ts-ignore
     const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId)
     const prev = currentIndex > 0 ? allLessons[currentIndex - 1] : null
     const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

     return {
       course,
       // @ts-ignore
       courseContent: course.modules || [],
       enrollment,
       currentLesson,
       userProgress: {
         progress: enrollment?.progress || 0,
         completedLessons: enrollment?.completedLessons || []
       },
       navigation: {
         prev,
         next
       }
     }
  } catch (error) {
    console.error("Error fetching learning data:", error)
    return { error: "Internal server error" }
  }
}

// Stats
export async function getPlatformStats() {
  try {
    const course_count = await db.select({ count: count() }).from(courses).then(res => res[0].count)
    const student_count = await db.select({ count: count() }).from(users).where(eq(users.role, 'student')).then(res => res[0].count)
    const enrollment_count = await db.select({ count: count() }).from(enrollments).then(res => res[0].count)
    const certified_student_count = await db.select({ count: count() }).from(certificates).then(res => res[0].count)
    const challenge_count = await db.select({ count: count() }).from(challenges).then(res => res[0].count)
    const contest_count = await db.select({ count: count() }).from(contests).then(res => res[0].count)
    
    return { 
      course_count, 
      student_count, 
      enrollment_count,
      certified_student_count,
      challenge_count,
      contest_count
    }
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return {
      course_count: 0,
      student_count: 0,
      enrollment_count: 0,
      certified_student_count: 0,
      challenge_count: 0,
      contest_count: 0
    }
  }
}

export async function getInstructorAnalytics(instructorId: string) {
  try {
    const stats = await getInstructorStats(instructorId)
    
    // Calculate total revenue (approximate based on enrollments * price)
    // In a real app, use orders table
    const courses = await getInstructorCourses(instructorId)
    let totalRevenue = 0
    
    for (const course of courses) {
      const enrollmentCount = await db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.courseId, course.id))
        .then(res => res[0].count)
        
      totalRevenue += enrollmentCount * Number(course.price || 0)
    }

    return {
      totalStudents: stats.students,
      totalCourses: stats.courses,
      totalReviews: stats.reviews,
      rating: stats.rating,
      instructorRating: stats.instructorRating,
      totalRevenue: totalRevenue || 0
    }
  } catch (error) {
    console.error("Error fetching instructor analytics:", error)
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalReviews: 0,
      rating: "0.0",
      instructorRating: "0.0",
      totalRevenue: 0
    }
  }
}

export async function getInstructorCoursePerformance(instructorId: string) {
  try {
    const instructorCourses = await getInstructorCourses(instructorId)
    
    const performanceData = await Promise.all(instructorCourses.map(async (course) => {
      const enrollmentCount = await db
        .select({ count: count() })
        .from(enrollments)
        .where(eq(enrollments.courseId, course.id))
        .then(res => res[0].count)

      const avgRating = await db
        .select({ avg: sql`AVG(${reviews.rating})` })
        .from(reviews)
        .where(eq(reviews.courseId, course.id))
        .then(res => Number(res[0]?.avg || 0).toFixed(1))

      return {
        ...course,
        enrollment_count: enrollmentCount,
        revenue: enrollmentCount * Number(course.price || 0),
        rating: avgRating
      }
    }))

    return performanceData.sort((a, b) => b.revenue - a.revenue)
  } catch (error) {
    console.error("Error fetching instructor course performance:", error)
    return []
  }
}
