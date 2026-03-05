# Learning Management System (LMS) Architecture & Implementation Plan

## 1. System Architecture Overview

The system is designed as a modern, scalable **Monolithic** application using **Next.js 15 (App Router)** as the full-stack framework. It leverages Server-Side Rendering (SSR) for performance and SEO, and React Server Components (RSC) for efficient data fetching.

### Core Stack
-   **Frontend**: Next.js 15, React 19, Tailwind CSS, Lucide Icons, Shadcn UI.
-   **Backend**: Next.js Server Actions (API), Drizzle ORM.
-   **Database**: PostgreSQL (Neon/Supabase/Vercel Postgres).
-   **Authentication**: NextAuth.js (v5) with RBAC middleware.
-   **State Management**: React Context (for global auth/theme) + Server State (React Query or direct RSC).
-   **File Storage**: Cloudflare R2 or AWS S3 (for video/assets).
-   **Video Hosting**: Mux or Cloudflare Stream (abstracted in schema).

### High-Level Components
1.  **Public Gateway**: Marketing pages, Marketplace (browse/search), Auth pages.
2.  **Student Portal**: Dashboard, Learning Player (Lesson view), Profile, Progress Tracking.
3.  **Instructor Portal**: Course Studio (CRUD), Analytics Dashboard, Student Management.
4.  **Admin Portal**: User Management, Content Moderation, System Config, Audit Logs.
5.  **API Layer**: Secured endpoints for data access, enforcing RBAC at the route handler level.

---

## 2. Full Route Map

### Public (Marketing & Marketplace)
-   `/` - Landing Page (Hero, Features, Testimonials).
-   `/courses` - Course Marketplace (Search, Filter, Pagination).
-   `/courses/[courseId]` - Course Landing Page (Details, Syllabus, Instructor, Pricing).
-   `/categories` - List of all categories.
-   `/categories/[categoryId]` - Courses in a specific category.
-   `/instructors/[instructorId]` - Public Instructor Profile.
-   `/pricing` - Platform pricing plans.
-   `/about`, `/contact`, `/faq` - Static pages.

### Authentication
-   `/auth/login` - User login.
-   `/auth/register` - User registration (Student role default).
-   `/auth/forgot-password` - Password recovery request.
-   `/auth/reset-password` - Password reset form.
-   `/auth/verify-email` - Email verification.

### Student Portal (Protected: Student Role)
-   `/student/dashboard` - Overview (Resume learning, stats).
-   `/student/my-courses` - Enrolled courses list.
-   `/student/browse` - Internal marketplace view.
-   `/student/course/[courseId]` - Course specific dashboard (Overview, Progress).
-   `/student/learn/[courseId]/[lessonId]` - **Learning Player** (Video/Article/Quiz).
-   `/student/certificates` - Earned certificates list/download.
-   `/student/bookmarks` - Saved lessons.
-   `/student/notes` - Personal notes management.
-   `/student/profile` - Edit profile.
-   `/student/settings` - Account settings.

### Instructor Portal (Protected: Instructor Role)
-   `/instructor/dashboard` - Analytics summary (Revenue, Enrollments).
-   `/instructor/courses` - List of created courses.
-   `/instructor/courses/new` - Course creation wizard.
-   `/instructor/courses/[courseId]/edit` - Edit course details.
-   `/instructor/courses/[courseId]/curriculum` - **Curriculum Builder** (Sections/Lessons).
-   `/instructor/courses/[courseId]/students` - Student progress & list.
-   `/instructor/courses/[courseId]/analytics` - Deep dive analytics.
-   `/instructor/reviews` - Manage course reviews.
-   `/instructor/profile` - Edit public instructor profile.
-   `/instructor/settings` - Payout & notification settings.

### Admin Portal (Protected: Admin Role)
-   `/admin/dashboard` - Platform health, KPIs.
-   `/admin/users` - User management (Ban, Role change).
-   `/admin/users/[userId]` - User details & history.
-   `/admin/courses` - Course moderation (Approve/Reject).
-   `/admin/categories` - Taxonomy management.
-   `/admin/reviews` - Global review moderation.
-   `/admin/moderation` - Reported content queue.
-   `/admin/settings` - System configuration.
-   `/admin/audit-logs` - Security & Action logs.

---

## 3. Database Schema Design

### Key Entities

**Users**
- `id` (UUID, PK)
- `email`, `password_hash`, `name`, `role` (enum), `avatar_url`, `bio`
- `created_at`, `updated_at`

**Courses**
- `id` (UUID, PK)
- `instructor_id` (FK -> Users)
- `category_id` (FK -> Categories)
- `title`, `subtitle`, `description` (Rich Text), `slug`
- `level` (Beginner, Intermediate, Advanced)
- `price`, `currency`, `is_free`
- `thumbnail_url`, `preview_video_url`
- `status` (Draft, Published, Archived)
- `created_at`, `updated_at`

**Modules (Sections)**
- `id` (UUID, PK)
- `course_id` (FK -> Courses)
- `title`
- `order_index` (int)

**Lessons**
- `id` (UUID, PK)
- `module_id` (FK -> Modules)
- `title`, `description`
- `type` (Enum: VIDEO, ARTICLE, QUIZ, ASSIGNMENT)
- `content` (Rich Text for Article / JSON for Quiz)
- `video_url`, `video_provider` (Enum), `duration`
- `is_preview` (bool)
- `order_index` (int)
- `created_at`, `updated_at`

**Enrollments**
- `id` (UUID, PK)
- `user_id` (FK -> Users)
- `course_id` (FK -> Courses)
- `progress` (int %)
- `completed_at` (Timestamp, Nullable)
- `created_at`

**Progress (Detailed)**
- `id` (UUID, PK)
- `user_id`, `lesson_id`
- `is_completed` (bool)
- `last_position` (int, seconds for video)
- `updated_at`

**Certificates**
- `id` (UUID, PK)
- `user_id`, `course_id`
- `certificate_code` (Unique String)
- `issued_at`

**Reviews**
- `id` (UUID, PK)
- `user_id`, `course_id`
- `rating` (1-5), `comment`
- `created_at`

**AuditLogs**
- `id` (UUID, PK)
- `user_id`, `action`, `entity_type`, `entity_id`, `details` (JSON)
- `created_at`

---

## 4. API Endpoint Plan (Server Actions)

The system will primarily use **Server Actions** for mutations and data fetching, but REST API endpoints can be exposed for external integrations if needed.

### Auth
- `login(email, password)` -> Session
- `register(email, password, name)` -> User
- `logout()` -> Void

### Student Actions
- `getEnrolledCourses()` -> Course[]
- `getCourseProgress(courseId)` -> ProgressObj
- `markLessonComplete(lessonId)` -> Progress
- `saveVideoProgress(lessonId, timestamp)` -> Void
- `enrollInCourse(courseId)` -> Enrollment

### Instructor Actions
- `createCourse(data)` -> Course
- `updateCourse(id, data)` -> Course
- `createModule(courseId, title)` -> Module
- `createLesson(moduleId, data)` -> Lesson
- `reorderCurriculum(list)` -> Void
- `publishCourse(courseId)` -> Void

### Admin Actions
- `getAllUsers(filter)` -> User[]
- `updateUserRole(userId, role)` -> User
- `banUser(userId)` -> User
- `approveCourse(courseId)` -> Course

---

## 5. RBAC Matrix

| Action | Student | Instructor | Admin |
| :--- | :---: | :---: | :---: |
| **Browse Public Courses** | ✅ | ✅ | ✅ |
| **Enroll in Course** | ✅ | ✅ | ✅ |
| **View Own Progress** | ✅ | ✅ | ✅ |
| **Create Course** | ❌ | ✅ | ✅ |
| **Edit Own Course** | ❌ | ✅ | ✅ |
| **Edit Any Course** | ❌ | ❌ | ✅ |
| **View Instructor Analytics** | ❌ | ✅ (Own) | ✅ (All) |
| **Manage Users** | ❌ | ❌ | ✅ |
| **View Audit Logs** | ❌ | ❌ | ✅ |
| **Access Admin Panel** | ❌ | ❌ | ✅ |

---

## 6. UI Component Map

### Atoms (Shadcn UI)
- `Button`, `Input`, `Select`, `Checkbox`, `Dialog`, `Sheet`, `DropdownMenu`, `Avatar`, `Badge`, `Card`, `Table`, `Tabs`, `Toast`.

### Molecules (Custom)
- `CourseCard`: Displays thumbnail, title, rating, price.
- `LessonRow`: Displays lesson title, icon type, status, duration.
- `VideoPlayer`: Wrapper around video provider (e.g., HTML5/Mux) with progress tracking.
- `RichTextEditor`: For creating articles (Tiptap/Quill).
- `StarRating`: Interactive or static star display.
- `FileUpload`: Drag & drop zone for assignments.

### Organisms (Complex)
- `CurriculumAccordion`: Sidebar for course player.
- `CourseBuilder`: Drag-and-drop interface for instructors.
- `AnalyticsChart`: Recharts wrapper for dashboards.
- `DataTable`: Generic table with sort/filter/pagination (TanStack Table).

---

## 7. Deployment Plan

1.  **Database**: Deploy PostgreSQL on **Neon** or **Supabase**.
2.  **Storage**: Set up **AWS S3** or **Cloudflare R2** bucket for user uploads (avatars, course assets).
3.  **Application**: Deploy Next.js app to **Vercel**.
    -   Environment Variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`.
4.  **CI/CD**: GitHub Actions to run linting and type checking on push. Vercel automatically deploys main branch.

---

## 8. Checklist for Production Readiness

### Security
- [ ] **RBAC Enforcement**: Verify middleware blocks `/admin` for non-admins.
- [ ] **Data Access**: Verify API endpoints check `session.user.id` for private data (e.g., "my courses").
- [ ] **Input Validation**: Use Zod schemas for all form submissions.
- [ ] **Rate Limiting**: Implement Upstash Ratelimit for sensitive routes (auth, messages).

### Performance
- [ ] **Image Optimization**: Use `next/image` with proper sizing.
- [ ] **Database Indexing**: Add indices on foreign keys (`user_id`, `course_id`) and search columns.
- [ ] **Caching**: Use `unstable_cache` for heavy public queries (e.g., marketplace).

### Monitoring & Quality
- [ ] **Error Tracking**: Integrate Sentry.
- [ ] **Analytics**: Integrate Vercel Analytics or PostHog.
- [ ] **Audit Logs**: Ensure all critical write operations create an audit log entry.
