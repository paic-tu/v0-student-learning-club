"use server"

import { and, desc, eq, count, sql, inArray, asc, getTableColumns, sum, not } from "drizzle-orm"
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

export async function getCourseById(id: string) {
  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        instructor: true,
        category: true,
        modules: {
          orderBy: [asc(modules.orderIndex)],
          with: {
            lessons: {
              orderBy: [asc(lessons.orderIndex)],
            },
          },
        },
      },
    })
    return course
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

export async function getInstructorStats(instructorId: string) {
  try {
    const coursesCount = await db
      .select({ count: count() })
      .from(courses)
      .where(eq(courses.instructorId, instructorId))
      .then((res) => res[0].count)

    const enrollmentsCount = await db
      .select({ count: count() })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(courses.instructorId, instructorId))
      .then((res) => res[0].count)

    // Calculate total revenue (mock calculation for now as we don't have transaction amount linked directly easily without more joins)
    // Assuming we can sum up order items for courses owned by instructor
    // For now returning 0 or mock
    const totalRevenue = 0 

    // Average rating
    const reviewsData = await db
        .select({ rating: reviews.rating })
        .from(reviews)
        .innerJoin(courses, eq(reviews.courseId, courses.id))
        .where(eq(courses.instructorId, instructorId))
    
    const averageRating = reviewsData.length > 0 
        ? reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / reviewsData.length 
        : 0

    return {
      totalStudents: enrollmentsCount,
      totalCourses: coursesCount,
      totalRevenue: totalRevenue,
      averageRating: averageRating
    }
  } catch (error) {
    console.error("Error fetching instructor stats:", error)
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalRevenue: 0,
      averageRating: 0
    }
  }
}

export async function getInstructorAnalytics(instructorId: string) {
  return getInstructorStats(instructorId)
}

export async function getInstructorCoursePerformance(instructorId: string) {
  try {
    const instructorCourses = await db.query.courses.findMany({
      where: eq(courses.instructorId, instructorId),
      orderBy: [desc(courses.createdAt)],
    })

    // For each course, get enrollment count and average rating
    const performanceData = await Promise.all(instructorCourses.map(async (course) => {
        const enrollmentsCount = await db
            .select({ count: count() })
            .from(enrollments)
            .where(eq(enrollments.courseId, course.id))
            .then((res) => res[0].count)

        const reviewsData = await db
            .select({ rating: reviews.rating })
            .from(reviews)
            .where(eq(reviews.courseId, course.id))
        
        const averageRating = reviewsData.length > 0
            ? reviewsData.reduce((acc, curr) => acc + curr.rating, 0) / reviewsData.length
            : 0

        return {
            ...course,
            enrollments: enrollmentsCount,
            rating: averageRating,
            revenue: 0 // Mock
        }
    }))

    return performanceData
  } catch (error) {
    console.error("Error fetching instructor course performance:", error)
    return []
  }
}

export async function getEnrollment(userId: string, courseId: string) {
  try {
    return await db.query.enrollments.findFirst({
      where: and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      with: {
        course: true
      }
    })
  } catch (error) {
    console.error("Error fetching enrollment:", error)
    return null
  }
}

export async function checkEnrollmentStatus(userId: string, courseId: string) {
  return getEnrollment(userId, courseId)
}

// Store & Cart
export async function getAllStoreItems() {
  return getProducts()
}

export async function addToCart(userId: string, data: any) {
  try {
    // Get or create cart
    let cart = await db.query.carts.findFirst({
        where: eq(carts.userId, userId)
    })
    
    if (!cart) {
        const [newCart] = await db.insert(carts).values({ userId }).returning()
        cart = newCart
    }

    // Check if item exists
    const existingItem = await db.query.cartItems.findFirst({
        where: and(
            eq(cartItems.cartId, cart.id),
            data.courseId ? eq(cartItems.courseId, data.courseId) : eq(cartItems.productId, data.productId)
        )
    })

    if (existingItem) {
        // Update quantity
        await db.update(cartItems)
            .set({ quantity: existingItem.quantity + (data.quantity || 1) })
            .where(eq(cartItems.id, existingItem.id))
    } else {
        // Add new item
        await db.insert(cartItems).values({
            cartId: cart.id,
            ...data,
            quantity: data.quantity || 1
        })
    }

    return { success: true }
  } catch (error) {
    console.error("Error adding to cart:", error)
    return { success: false, error: "Failed to add to cart" }
  }
}

export async function getCartWithItems(userId: string) {
  try {
    const cart = await db.query.carts.findFirst({
      where: eq(carts.userId, userId),
      with: {
        items: {
          with: {
            course: true,
            product: true
          }
        }
      }
    })
    return cart
  } catch (error) {
    console.error("Error fetching cart:", error)
    return null
  }
}

export async function clearCart(userId: string) {
  try {
    const cart = await db.query.carts.findFirst({
        where: eq(carts.userId, userId)
    })
    if (cart) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id))
    }
    return { success: true }
  } catch (error) {
    console.error("Error clearing cart:", error)
    return { success: false, error: "Failed to clear cart" }
  }
}

export async function createOrder(userId: string, data: any) {
  try {
    const cart = await getCartWithItems(userId)
    if (!cart || !cart.items || cart.items.length === 0) {
        return { success: false, error: "Cart is empty" }
    }

    // Calculate total
    let total = 0
    cart.items.forEach(item => {
        if (item.course) total += Number(item.course.price) * item.quantity
        if (item.product) total += Number(item.product.price) * item.quantity
    })

    // Create order
    const [newOrder] = await db.insert(orders).values({
        userId,
        totalAmount: total.toString(),
        status: "pending",
        ...data
    }).returning()

    // Create order items
    for (const item of cart.items) {
        await db.insert(orderItems).values({
            orderId: newOrder.id,
            productId: item.productId,
            courseId: item.courseId,
            quantity: item.quantity,
            price: (item.course ? item.course.price : item.product?.price) || "0"
        })
    }

    // Clear cart
    await clearCart(userId)

    return { success: true, orderId: newOrder.id }
  } catch (error) {
    console.error("Error creating order:", error)
    return { success: false, error: "Failed to create order" }
  }
}

// Categories
export async function getAllCategories() {
  try {
    return await db.query.categories.findMany()
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

export async function getCategoryById(id: string) {
  try {
    return await db.query.categories.findFirst({ where: eq(categories.id, id) })
  } catch (error) {
    console.error("Error fetching category:", error)
    return null
  }
}

export async function createCategory(data: any) {
  try {
    await db.insert(categories).values(data)
    return { success: true }
  } catch (error) {
    console.error("Error creating category:", error)
    return { success: false, error: "Failed to create category" }
  }
}

export async function updateCategory(id: string, data: any) {
  try {
    await db.update(categories).set(data).where(eq(categories.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error updating category:", error)
    return { success: false, error: "Failed to update category" }
  }
}

export async function deleteCategory(id: string) {
  try {
    await db.delete(categories).where(eq(categories.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    return { success: false, error: "Failed to delete category" }
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

export async function updateUserProfile(userId: string, data: any) {
  try {
    await db.update(users).set(data).where(eq(users.id, userId))
    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

export async function getInstructorDashboardData(userId: string) {
  try {
    const coursesData = await db
      .select({
        count: count(),
        enrollments: sum(courses.enrollmentCount),
      })
      .from(courses)
      .where(eq(courses.instructorId, userId))
      .then((res) => res[0])

    const coursesList = await db.query.courses.findMany({
      where: eq(courses.instructorId, userId),
      columns: { id: true },
    })
    
    const courseIds = coursesList.map(c => c.id)
    
    let reviewsCount = 0
    let averageRating = 0

    if (courseIds.length > 0) {
      const reviewsData = await db
        .select({
          count: count(),
          avgRating: sql<number>`avg(${reviews.rating})`,
        })
        .from(reviews)
        .where(inArray(reviews.courseId, courseIds))
        .then((res) => res[0])
      
      reviewsCount = reviewsData.count
      averageRating = Number(reviewsData.avgRating) || 0
    }

    return {
      stats: {
        courses: coursesData.count || 0,
        students: Number(coursesData.enrollments) || 0,
        reviews: reviewsCount,
        rating: averageRating,
      }
    }
  } catch (error) {
    console.error("Error fetching instructor dashboard data:", error)
    return {
      stats: { courses: 0, students: 0, reviews: 0, rating: 0 }
    }
  }
}

// Student Dashboard
export async function getStudentDashboardData(userId: string) {
  try {
    const activeCourses = await db
      .select({ count: count() })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.status, "active")))
      .then((res) => res[0].count)

    const completedCourses = await db
      .select({ count: count() })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.status, "completed")))
      .then((res) => res[0].count)

    const certificatesCount = await db
      .select({ count: count() })
      .from(certificates)
      .where(eq(certificates.userId, userId))
      .then((res) => res[0].count)

    // Last Activity Logic
    const lastEnrollment = await db.query.enrollments.findFirst({
        where: eq(enrollments.userId, userId),
        orderBy: [desc(enrollments.lastAccessedAt)],
        with: {
            course: true
        }
    })
    
    // Fetch enrolled courses for the list
    const enrolledCourses = await db.query.enrollments.findMany({
        where: eq(enrollments.userId, userId),
        with: {
            course: {
                with: {
                    instructor: true,
                    category: true
                }
            }
        },
        orderBy: [desc(enrollments.lastAccessedAt)],
        limit: 5
    })
    
    let lastActivity = null
    if (lastEnrollment) {
         // Try to find the last accessed lesson
         const lastProgress = await db.query.progress.findFirst({
             where: eq(progress.userId, userId),
             orderBy: [desc(progress.lastAccessed)],
             with: {
                 lesson: true
             }
         })

         // Verify the progress belongs to the last accessed course
         if (lastProgress && lastProgress.lesson && lastProgress.lesson.courseId === lastEnrollment.courseId) {
              lastActivity = {
                  courseId: lastEnrollment.courseId,
                  courseTitleEn: lastEnrollment.course.titleEn,
                  courseTitleAr: lastEnrollment.course.titleAr,
                  lessonId: lastProgress.lessonId,
                  lessonTitleEn: lastProgress.lesson.titleEn,
                  lessonTitleAr: lastProgress.lesson.titleAr,
                  progress: lastEnrollment.progress
              }
         } else {
              // Fallback to first lesson
              const firstModule = await db.query.modules.findFirst({
                  where: eq(modules.courseId, lastEnrollment.courseId),
                  with: { lessons: { limit: 1, orderBy: [asc(lessons.orderIndex)] } },
                  orderBy: [asc(modules.orderIndex)]
              })
              
              if (firstModule && firstModule.lessons && firstModule.lessons.length > 0) {
                  lastActivity = {
                      courseId: lastEnrollment.courseId,
                      courseTitleEn: lastEnrollment.course.titleEn,
                      courseTitleAr: lastEnrollment.course.titleAr,
                      lessonId: firstModule.lessons[0].id,
                      lessonTitleEn: firstModule.lessons[0].titleEn,
                      lessonTitleAr: firstModule.lessons[0].titleAr,
                      progress: lastEnrollment.progress
                  }
              }
         }
    }

    return {
      stats: {
        activeCourses,
        completedCourses,
        certificates: certificatesCount,
      },
      lastActivity,
      enrolledCourses
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return {
      stats: { activeCourses: 0, completedCourses: 0, certificates: 0 },
      lastActivity: null,
      enrolledCourses: []
    }
  }
}

export async function getStudentCourses(userId: string) {
    try {
        const userEnrollments = await db.query.enrollments.findMany({
            where: eq(enrollments.userId, userId),
            with: {
                course: {
                    with: {
                        instructor: true,
                        category: true
                    }
                }
            },
            orderBy: [desc(enrollments.lastAccessedAt)]
        })
        return userEnrollments
    } catch (error) {
        console.error("Error fetching student courses:", error)
        return []
    }
}

// Enrollments & Learning
export async function getUserEnrollments(userId: string) {
  try {
    const userEnrollments = await db.query.enrollments.findMany({
      where: eq(enrollments.userId, userId),
      with: {
        course: {
          with: {
            instructor: true,
            category: true,
          }
        }
      },
      orderBy: [desc(enrollments.lastAccessedAt)],
    })

    const enrollmentsWithDetails = await Promise.all(userEnrollments.map(async (enrollment) => {
      const firstModule = await db.query.modules.findFirst({
        where: eq(modules.courseId, enrollment.courseId),
        orderBy: [asc(modules.orderIndex)],
        with: {
          lessons: {
            orderBy: [asc(lessons.orderIndex)],
            limit: 1
          }
        }
      })
      
      const firstLesson = firstModule?.lessons[0]

      return {
        ...enrollment,
        course_title_en: enrollment.course.titleEn,
        course_title_ar: enrollment.course.titleAr,
        course_thumbnail: enrollment.course.thumbnailUrl,
        instructor_name: enrollment.course.instructor.name,
        first_lesson_id: firstLesson?.id,
        first_lesson_title_en: firstLesson?.titleEn,
        first_lesson_title_ar: firstLesson?.titleAr,
      }
    }))

    return enrollmentsWithDetails
  } catch (error) {
    console.error("[v0] Error fetching user enrollments:", error)
    return []
  }
}

export async function getUserLessonNotes(userId: string, lessonId: string) {
  try {
    const userNotes = await db.query.notes.findMany({
      where: and(
        eq(notes.userId, userId),
        eq(notes.lessonId, lessonId)
      ),
      orderBy: [desc(notes.createdAt)],
    })
    return userNotes
  } catch (error) {
    console.error("[v0] Error fetching lesson notes:", error)
    return []
  }
}

export async function getUserNotes(userId: string) {
  try {
    const userNotes = await db.query.notes.findMany({
      where: eq(notes.userId, userId),
      with: {
        lesson: {
            with: {
                course: true
            }
        }
      },
      orderBy: [desc(notes.createdAt)],
    })
    
    return userNotes.map(note => ({
      ...note,
      courseId: note.lesson.courseId,
      courseTitleEn: note.lesson.course.titleEn,
      courseTitleAr: note.lesson.course.titleAr,
      lessonTitleEn: note.lesson.titleEn,
      lessonTitleAr: note.lesson.titleAr,
      lessonSlug: note.lesson.slug,
    }))
  } catch (error) {
    console.error("[v0] Error fetching user notes:", error)
    return []
  }
}

export async function getLearningData(userId: string, courseId: string, lessonId: string, role: string) {
  try {
    if (role === "student") {
      const enrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, courseId)
        )
      })
      if (!enrollment) {
        return { error: "Not enrolled" }
      }
    }

    const course = await db.query.courses.findFirst({
      where: eq(courses.id, courseId),
      with: {
        instructor: true
      }
    })

    if (!course) return { error: "Course not found" }

    const courseModules = await db.query.modules.findMany({
      where: eq(modules.courseId, courseId),
      orderBy: [asc(modules.orderIndex)],
      with: {
        lessons: {
          orderBy: [asc(lessons.orderIndex)]
        }
      }
    })

    let currentLesson = null
    let prevLesson = null
    let nextLesson = null
    let allLessons: any[] = []

    courseModules.forEach(m => {
      if (m.lessons) {
        allLessons.push(...m.lessons)
      }
    })

    const currentIndex = allLessons.findIndex(l => l.id === lessonId)
    
    if (currentIndex !== -1) {
      currentLesson = allLessons[currentIndex]
      prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
      nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
    } else {
       if (allLessons.length > 0) {
         currentLesson = allLessons[0]
         nextLesson = allLessons.length > 1 ? allLessons[1] : null
       }
    }

    const userProgress = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    })

    return {
      course,
      courseContent: courseModules,
      currentLesson,
      userProgress,
      navigation: {
        prev: prevLesson,
        next: nextLesson
      }
    }

  } catch (error) {
    console.error("[v0] Error fetching learning data:", error)
    return { error: "Internal server error" }
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
            category: true,
            instructor: true,
          }
        }
      },
      orderBy: [desc(bookmarks.createdAt)],
    })
    return userBookmarks
  } catch (error) {
    console.error("[v0] Error fetching bookmarks:", error)
    return []
  }
}

// Certificates
export async function getUserCertificates(userId: string) {
    try {
        const userCertificates = await db.query.certificates.findMany({
            where: eq(certificates.userId, userId),
            with: {
                course: true
            },
            orderBy: [desc(certificates.issuedAt)]
        })
        return userCertificates
    } catch (error) {
        console.error("Error fetching certificates:", error)
        return []
    }
}

// Reviews
export async function getInstructorReviews(userId: string) {
  try {
    const instructorCourses = await db.query.courses.findMany({
      where: eq(courses.instructorId, userId),
      columns: { id: true }
    })
    const courseIds = instructorCourses.map(c => c.id)
    if (courseIds.length === 0) return []
    const instructorReviews = await db.query.reviews.findMany({
      where: inArray(reviews.courseId, courseIds),
      with: {
        user: true,
        course: true
      },
      orderBy: [desc(reviews.createdAt)],
    })
    return instructorReviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.createdAt,
      user_name: review.user.name,
      user_avatar: review.user.avatarUrl,
      course_title_en: review.course.titleEn,
      course_title_ar: review.course.titleAr,
    }))
  } catch (error) {
    console.error("[v0] Error fetching instructor reviews:", error)
    return []
  }
}

// Contests
export async function createNote(data: any) {
  try {
    const [note] = await db.insert(notes).values(data).returning()
    return note
  } catch (error) {
    console.error("Error creating note:", error)
    return null
  }
}

export async function deleteNote(id: string) {
  try {
    await db.delete(notes).where(eq(notes.id, id))
    return { success: true }
  } catch (error) {
    console.error("Error deleting note:", error)
    return { success: false, error: "Failed to delete note" }
  }
}

export async function getAllCohorts() {
  try {
    return await db.query.cohorts.findMany({
      orderBy: [desc(cohorts.createdAt)],
      with: {
        creator: true
      }
    })
  } catch (error) {
    console.error("Error fetching cohorts:", error)
    return []
  }
}

export async function getAllContests() {
  return getContests()
}

export async function getAllMentors() {
  return getMentors()
}

export async function getContests() {
  try {
    return await db.query.contests.findMany({
      orderBy: [desc(contests.startDate)],
    })
  } catch (error) {
    console.error("Error fetching contests:", error)
    return []
  }
}

export async function getContestParticipants(contestId: string) {
  try {
    return await db.query.contestParticipants.findMany({
      where: eq(contestParticipants.contestId, contestId),
      with: {
        user: true,
      },
    })
  } catch (error) {
    console.error("Error fetching contest participants:", error)
    return []
  }
}

export async function getContestById(id: string) {
    try {
        return await db.query.contests.findFirst({
            where: eq(contests.id, id)
        })
    } catch (error) {
        console.error("Error fetching contest:", error)
        return null
    }
}

export async function joinContest(userId: string, contestId: string) {
    try {
        await db.insert(contestParticipants).values({
            userId,
            contestId,
            score: 0
        })
        return { success: true }
    } catch (error) {
        console.error("Error joining contest:", error)
        return { success: false, error: "Failed to join contest" }
    }
}

// Cohorts
export async function joinCohort(userId: string, cohortId: string) {
  try {
    const cohort = await db.query.cohorts.findFirst({
      where: eq(cohorts.id, cohortId),
    })
    if (!cohort) {
      return { success: false, error: "Cohort not found" }
    }
    if (cohort.status === "ended") {
      return { success: false, error: "Cohort has ended" }
    }
    const existingMember = await db.query.cohortMembers.findFirst({
      where: and(eq(cohortMembers.cohortId, cohortId), eq(cohortMembers.userId, userId))
    })
    if (existingMember) {
      return { success: false, error: "Already a member of this cohort" }
    }
    const memberCount = await db
      .select({ count: count() })
      .from(cohortMembers)
      .where(eq(cohortMembers.cohortId, cohortId))
      .then(res => res[0].count)
    let status: "active" | "waitlist" | "removed" = "active"
    if (memberCount >= cohort.capacity) {
      status = "waitlist"
    }
    await db.insert(cohortMembers).values({
      cohortId,
      userId,
      role: "student",
      status,
    })
    return { success: true, status }
  } catch (error) {
    console.error("[v0] Error joining cohort:", error)
    return { success: false, error: "Failed to join cohort" }
  }
}

export async function getProducts() {
  try {
    return await db.query.products.findMany({
      where: eq(products.isActive, true),
      orderBy: [desc(products.createdAt)],
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

export async function getProductById(id: string) {
  try {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export async function getMentors() {
  try {
    return await db.query.mentors.findMany({
      where: eq(mentors.isActive, true),
      with: {
        user: true,
      },
    })
  } catch (error) {
    console.error("Error fetching mentors:", error)
    return []
  }
}

export async function getMentorById(id: string) {
  try {
    return await db.query.mentors.findFirst({
      where: eq(mentors.id, id),
      with: {
        user: true,
      },
    })
  } catch (error) {
    console.error("Error fetching mentor:", error)
    return null
  }
}

export async function getCohortById(id: string) {
  try {
    return await db.query.cohorts.findFirst({
      where: eq(cohorts.id, id),
      with: {
        courses: {
          with: {
            course: true
          }
        },
        members: {
            with: {
                user: true
            }
        }
      }
    })
  } catch (error) {
    console.error("Error fetching cohort:", error)
    return null
  }
}

// Orders
export async function getUserOrders(userId: string) {
    try {
        return await db.query.orders.findMany({
            where: eq(orders.userId, userId),
            orderBy: [desc(orders.createdAt)],
            with: {
                items: {
                    with: {
                        course: true,
                        product: true
                    }
                }
            }
        })
    } catch (error) {
        console.error("Error fetching orders:", error)
        return []
    }
}

// Bookings
export async function createBooking(data: any) {
    try {
        await db.insert(bookings).values(data)
        return { success: true }
    } catch (error) {
        console.error("Error creating booking:", error)
        return { success: false }
    }
}

export async function getUserBookings(userId: string, role: string) {
    try {
        if (role === "student") {
            return await db.query.bookings.findMany({
                where: eq(bookings.studentId, userId),
                with: { mentor: { with: { user: true } } },
                orderBy: [desc(bookings.startAt)]
            })
        } else {
             // For mentor, need to find mentorId first
             const mentor = await db.query.mentors.findFirst({
                 where: eq(mentors.userId, userId)
             })
             if (!mentor) return []
             return await db.query.bookings.findMany({
                 where: eq(bookings.mentorId, mentor.id),
                 with: { student: true },
                 orderBy: [desc(bookings.startAt)]
             })
        }
    } catch (error) {
        console.error("Error fetching bookings:", error)
        return []
    }
}

export async function updateBookingStatus(bookingId: string, status: any) {
    try {
        await db.update(bookings).set({ status }).where(eq(bookings.id, bookingId))
        return { success: true }
    } catch (error) {
        console.error("Error updating booking:", error)
        return { success: false }
    }
}

// Platform Stats
export async function getPlatformStats() {
  try {
    const studentCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "student"))
      .then((res) => res[0].count)

    const courseCount = await db
      .select({ count: count() })
      .from(courses)
      .then((res) => res[0].count)

    const enrollmentCount = await db
      .select({ count: count() })
      .from(enrollments)
      .then((res) => res[0].count)

    const certificateCount = await db
      .select({ count: count() })
      .from(certificates)
      .then((res) => res[0].count)

    const certifiedStudentCount = await db
      .select({ count: sql<number>`count(distinct ${certificates.userId})` })
      .from(certificates)
      .where(eq(certificates.status, "issued"))
      .then((res) => Number(res[0].count))
      
    const challengeCount = await db
      .select({ count: count() })
      .from(challenges)
      .then((res) => res[0].count)

    const contestCount = await db
      .select({ count: count() })
      .from(contests)
      .then((res) => res[0].count)

    return {
      student_count: studentCount,
      course_count: courseCount,
      enrollment_count: enrollmentCount,
      certificate_count: certificateCount,
      certified_student_count: certifiedStudentCount,
      challenge_count: challengeCount,
      contest_count: contestCount,
    }
  } catch (error) {
    console.error("Error fetching platform stats:", error)
    return null
  }
}

// Bookmarks Logic
export async function isBookmarked(userId: string, courseId: string) {
  try {
    const bookmark = await db.query.bookmarks.findFirst({
      where: and(eq(bookmarks.userId, userId), eq(bookmarks.courseId, courseId)),
    })
    return !!bookmark
  } catch (error) {
    console.error("Error checking bookmark status:", error)
    return false
  }
}

export async function toggleBookmark(userId: string, courseId: string) {
  try {
    const existing = await db.query.bookmarks.findFirst({
      where: and(eq(bookmarks.userId, userId), eq(bookmarks.courseId, courseId)),
    })

    if (existing) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id))
      return { bookmarked: false }
    } else {
      await db.insert(bookmarks).values({
        userId,
        courseId,
      })
      return { bookmarked: true }
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error)
    throw error
  }
}
