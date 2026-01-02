import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

// Enums
export const roleEnum = pgEnum("role", ["student", "instructor", "admin"])
export const difficultyEnum = pgEnum("difficulty", ["beginner", "intermediate", "advanced"])
export const challengeTypeEnum = pgEnum("challenge_type", ["quiz", "coding", "project"])
export const orderStatusEnum = pgEnum("order_status", ["pending", "completed", "cancelled"])
export const certificateStatusEnum = pgEnum("certificate_status", ["pending", "issued", "revoked"])
export const contestStatusEnum = pgEnum("contest_status", ["upcoming", "active", "completed"])
export const cohortStatusEnum = pgEnum("cohort_status", ["draft", "open", "running", "ended"])
export const cohortMemberRoleEnum = pgEnum("cohort_member_role", ["student", "mentor", "instructor"])
export const cohortMemberStatusEnum = pgEnum("cohort_member_status", ["active", "waitlist", "removed"])
export const scheduleTypeEnum = pgEnum("schedule_type", ["live", "deadline", "exam", "workshop"])
export const bookingStatusEnum = pgEnum("booking_status", ["requested", "confirmed", "completed", "cancelled"])
export const labDifficultyEnum = pgEnum("lab_difficulty", ["easy", "medium", "hard", "expert"])
export const submissionVerdictEnum = pgEnum("submission_verdict", ["correct", "wrong"])
export const notificationTypeEnum = pgEnum("notification_type", [
  "order",
  "certificate",
  "cohort",
  "booking",
  "lab",
  "project",
  "system",
])
export const projectVisibilityEnum = pgEnum("project_visibility", ["private", "public", "club"])
export const artifactTypeEnum = pgEnum("artifact_type", ["link", "file"])

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("student"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  points: integer("points").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Sessions table for authentication
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Courses table
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  videoUrl: text("video_url"),
  instructorId: integer("instructor_id")
    .notNull()
    .references(() => users.id),
  categoryId: integer("category_id").references(() => categories.id),
  difficulty: difficultyEnum("difficulty").notNull().default("beginner"),
  duration: integer("duration"), // in minutes
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("0"),
  isFree: boolean("is_free").notNull().default(true),
  isPublished: boolean("is_published").notNull().default(false),
  enrollmentCount: integer("enrollment_count").notNull().default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

// Lessons table
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  trackId: integer("track_id").references(() => tracks.id), // Added track reference
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(), // Added slug field
  contentEn: text("content_en"),
  contentAr: text("content_ar"),
  contentMarkdown: text("content_markdown"), // Added markdown content
  contentType: varchar("content_type", { length: 50 }).notNull().default("video"), // video/article/quiz/assignment
  videoUrl: text("video_url"),
  attachments: jsonb("attachments").$type<Array<{ name: string; url: string }>>().default([]), // Added attachments
  duration: integer("duration"), // in minutes
  durationMinutes: integer("duration_minutes"), // Explicit duration field
  orderIndex: integer("order_index").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft/published
  isPreview: boolean("is_preview").notNull().default(false),
  freePreview: boolean("free_preview").notNull().default(false), // Added freePreview
  prerequisites: jsonb("prerequisites").$type<number[]>().default([]), // Array of lesson IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // Soft delete support
})

// Tracks table for learning paths
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  thumbnailUrl: text("thumbnail_url"),
  difficulty: difficultyEnum("difficulty").notNull().default("beginner"),
  isPublished: boolean("is_published").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
})

// Store Items table
export const storeItems = pgTable("store_items", {
  id: serial("id").primaryKey(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  imageUrl: text("image_url"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  pointsCost: integer("points_cost"),
  stock: integer("stock").notNull().default(0),
  categoryId: integer("category_id").references(() => categories.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  items: jsonb("items").$type<Array<{ itemId: number; quantity: number; price: string }>>().notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum("status").notNull().default("pending"),
  shippingAddress: text("shipping_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
})

// Challenges table
export const challenges = pgTable("challenges", {
  id: serial("id").primaryKey(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  type: challengeTypeEnum("type").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  points: integer("points").notNull(),
  timeLimit: integer("time_limit"), // in minutes
  testCases: jsonb("test_cases"),
  solution: text("solution"),
  categoryId: integer("category_id").references(() => categories.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Challenge Submissions table
export const challengeSubmissions = pgTable("challenge_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenges.id, { onDelete: "cascade" }),
  code: text("code"),
  result: jsonb("result"),
  score: integer("score"),
  isPassed: boolean("is_passed").notNull().default(false),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
})

// Contests table
export const contests = pgTable("contests", {
  id: serial("id").primaryKey(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionAr: text("description_ar").notNull(),
  imageUrl: text("image_url"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: contestStatusEnum("status").notNull().default("upcoming"),
  prizePool: text("prize_pool"),
  maxParticipants: integer("max_participants"),
  participantCount: integer("participant_count").notNull().default(0),
  rules: jsonb("rules"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Contest Participants table
export const contestParticipants = pgTable("contest_participants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  contestId: integer("contest_id")
    .notNull()
    .references(() => contests.id, { onDelete: "cascade" }),
  score: integer("score").notNull().default(0),
  rank: integer("rank"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
})

// Certificates table
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id").references(() => courses.id),
  contestId: integer("contest_id").references(() => contests.id),
  certificateNumber: varchar("certificate_number", { length: 255 }).notNull().unique(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  status: certificateStatusEnum("status").notNull().default("issued"),
  imageUrl: text("image_url"),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
})

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 255 }).notNull(), // create, update, delete, etc.
  resource: varchar("resource", { length: 255 }).notNull(), // users, courses, orders, etc.
  resourceId: integer("resource_id"),
  changes: jsonb("changes"), // before/after state
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Permissions table for granular access control
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(), // e.g., "users:read", "courses:write"
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Role Permissions mapping
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: roleEnum("role").notNull(),
  permissionId: integer("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Coupons table for discount management
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 255 }).notNull(),
  nameAr: varchar("name_ar", { length: 255 }).notNull(),
  discountType: varchar("discount_type", { length: 50 }).notNull(), // percentage/fixed
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  applicableToProducts: jsonb("applicable_to_products").$type<number[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

const deletedAtColumn = timestamp("deleted_at")

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("enrolled"), // enrolled/completed/dropped
  completedLessons: text("completed_lessons").notNull().default("[]"), // JSON array of lesson IDs
  progress: integer("progress").notNull().default(0), // Progress percentage 0-100
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
})

export const cohorts = pgTable("cohorts", {
  id: serial("id").primaryKey(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  thumbnailUrl: text("thumbnail_url"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  capacity: integer("capacity").notNull().default(30),
  status: cohortStatusEnum("status").notNull().default("draft"),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const cohortCourses = pgTable("cohort_courses", {
  id: serial("id").primaryKey(),
  cohortId: integer("cohort_id")
    .notNull()
    .references(() => cohorts.id, { onDelete: "cascade" }),
  courseId: integer("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const cohortMembers = pgTable("cohort_members", {
  id: serial("id").primaryKey(),
  cohortId: integer("cohort_id")
    .notNull()
    .references(() => cohorts.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: cohortMemberRoleEnum("role").notNull().default("student"),
  status: cohortMemberStatusEnum("status").notNull().default("active"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
})

export const cohortSchedule = pgTable("cohort_schedule", {
  id: serial("id").primaryKey(),
  cohortId: integer("cohort_id")
    .notNull()
    .references(() => cohorts.id, { onDelete: "cascade" }),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  type: scheduleTypeEnum("type").notNull(),
  locationUrl: text("location_url"),
  notesEn: text("notes_en"),
  notesAr: text("notes_ar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const cohortAnnouncements = pgTable("cohort_announcements", {
  id: serial("id").primaryKey(),
  cohortId: integer("cohort_id")
    .notNull()
    .references(() => cohorts.id, { onDelete: "cascade" }),
  createdBy: integer("created_by")
    .notNull()
    .references(() => users.id),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  bodyEn: text("body_en").notNull(),
  bodyAr: text("body_ar").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const mentors = pgTable("mentors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  bioEn: text("bio_en"),
  bioAr: text("bio_ar"),
  skills: jsonb("skills").$type<string[]>().default([]),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalSessions: integer("total_sessions").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const mentorAvailability = pgTable("mentor_availability", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id")
    .notNull()
    .references(() => mentors.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(), // 0-6 (Sunday-Saturday)
  startTime: varchar("start_time", { length: 10 }).notNull(), // HH:MM
  endTime: varchar("end_time", { length: 10 }).notNull(), // HH:MM
  timezone: varchar("timezone", { length: 50 }).notNull().default("Asia/Riyadh"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id")
    .notNull()
    .references(() => mentors.id, { onDelete: "cascade" }),
  studentId: integer("student_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  status: bookingStatusEnum("status").notNull().default("requested"),
  topic: varchar("topic", { length: 255 }).notNull(),
  notes: text("notes"),
  meetingUrl: text("meeting_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const bookingReviews = pgTable("booking_reviews", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookings.id, { onDelete: "cascade" })
    .unique(),
  rating: integer("rating").notNull(), // 1-5
  feedbackEn: text("feedback_en"),
  feedbackAr: text("feedback_ar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const labTracks = pgTable("lab_tracks", {
  id: serial("id").primaryKey(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  thumbnailUrl: text("thumbnail_url"),
  level: labDifficultyEnum("level").notNull().default("easy"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const labs = pgTable("labs", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id")
    .notNull()
    .references(() => labTracks.id, { onDelete: "cascade" }),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  objectiveEn: text("objective_en").notNull(),
  objectiveAr: text("objective_ar").notNull(),
  stepsEn: text("steps_en").notNull(), // markdown
  stepsAr: text("steps_ar").notNull(), // markdown
  flagHash: varchar("flag_hash", { length: 255 }).notNull(), // bcrypt hash
  points: integer("points").notNull().default(100),
  difficulty: labDifficultyEnum("difficulty").notNull().default("easy"),
  isPublished: boolean("is_published").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const labAttempts = pgTable("lab_attempts", {
  id: serial("id").primaryKey(),
  labId: integer("lab_id")
    .notNull()
    .references(() => labs.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  score: integer("score").notNull().default(0),
  attemptsCount: integer("attempts_count").notNull().default(0),
})

export const labSubmissions = pgTable("lab_submissions", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id")
    .notNull()
    .references(() => labAttempts.id, { onDelete: "cascade" }),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  submittedFlagHash: varchar("submitted_flag_hash", { length: 255 }).notNull(),
  verdict: submissionVerdictEnum("verdict").notNull(),
})

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  bodyEn: text("body_en"),
  bodyAr: text("body_ar"),
  href: varchar("href", { length: 500 }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  inAppEnabled: boolean("in_app_enabled").notNull().default(true),
  language: varchar("language", { length: 10 }).notNull().default("ar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  titleAr: varchar("title_ar", { length: 255 }).notNull(),
  summaryEn: text("summary_en"),
  summaryAr: text("summary_ar"),
  tags: jsonb("tags").$type<string[]>().default([]),
  visibility: projectVisibilityEnum("visibility").notNull().default("private"),
  coverImageUrl: text("cover_image_url"),
  githubUrl: text("github_url"),
  demoUrl: text("demo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const projectArtifacts = pgTable("project_artifacts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: artifactTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const projectReviews = pgTable("project_reviews", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  reviewerId: integer("reviewer_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rubricJson: jsonb("rubric_json"),
  score: integer("score").notNull(),
  feedbackEn: text("feedback_en"),
  feedbackAr: text("feedback_ar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  enrollments: many(enrollments),
  orders: many(orders),
  challengeSubmissions: many(challengeSubmissions),
  contestParticipants: many(contestParticipants),
  certificates: many(certificates),
  instructorCourses: many(courses),
  cohortMemberships: many(cohortMembers),
  mentorReviews: many(bookingReviews),
  projectOwnerships: many(projects),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  instructor: one(users, {
    fields: [courses.instructorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  lessons: many(lessons),
  enrollments: many(enrollments),
  certificates: many(certificates),
  cohortCourses: many(cohortCourses),
}))

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}))

export const tracksRelations = relations(tracks, ({ many }) => ({
  lessons: many(lessons),
  cohortCourses: many(cohortCourses),
}))

export const lessonsRelations = relations(lessons, ({ one }) => ({
  course: one(courses, {
    fields: [lessons.courseId],
    references: [courses.id],
  }),
  track: one(tracks, {
    fields: [lessons.trackId],
    references: [tracks.id],
  }),
}))

export const cohortsRelations = relations(cohorts, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [cohorts.createdBy],
    references: [users.id],
  }),
  courses: many(cohortCourses),
  members: many(cohortMembers),
  schedule: many(cohortSchedule),
  announcements: many(cohortAnnouncements),
}))

export const mentorsRelations = relations(mentors, ({ one, many }) => ({
  user: one(users, {
    fields: [mentors.userId],
    references: [users.id],
  }),
  availability: many(mentorAvailability),
  bookings: many(bookings),
}))

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  mentor: one(mentors, {
    fields: [bookings.mentorId],
    references: [mentors.id],
  }),
  student: one(users, {
    fields: [bookings.studentId],
    references: [users.id],
  }),
  review: many(bookingReviews),
}))

export const labTracksRelations = relations(labTracks, ({ many }) => ({
  labs: many(labs),
}))

export const labsRelations = relations(labs, ({ one, many }) => ({
  track: one(labTracks, {
    fields: [labs.trackId],
    references: [labTracks.id],
  }),
  attempts: many(labAttempts),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  artifacts: many(projectArtifacts),
  reviews: many(projectReviews),
}))
