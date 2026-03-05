# ملخص تحديثات المشروع

يوثق هذا الملف الحالة الحالية لمشروع "Neon".
بما أن هذا يمثل لقطة (Snapshot) للكود الحالي، فهو يمثل جميع التعديلات التراكمية التي تمت حتى هذه اللحظة.

## الميزات المنفذة (بناءً على سجل التقدم)
1. **المصادقة (Authentication)**: تكامل مخصص مع NextAuth.
2. **قاعدة البيانات (Database)**: استخدام Drizzle ORM مع PostgreSQL.
   - الجداول: المستخدمين، الدورات، الوحدات، الدروس، التسجيلات، السلة، الطلبات، التحديات، الشهادات.
3. **نظام إدارة التعلم (LMS Core)**:
   - عرض الدورات والتفاصيل.
   - مشغل الدروس (فيديو، مقالات).
   - تتبع التقدم.
4. **التجارة الإلكترونية (Commerce)**:
   - سلة التسوق، الدفع، إدارة الطلبات.
5. **التفاعل (Interactive)**:
   - الاختبارات (Quizzes) والتحديات.
6. **التدويل (Internationalization)**:
   - دعم اللغتين العربية والإنجليزية عبر `app/[lang]`.

## برومت لتطبيق التعديلات (AI Prompt)

استخدم البرومت التالي لتحديث نسخة أخرى من الموقع لتتطابق مع هذه النسخة:

---
**Prompt:**

I need to update my Next.js project to match the latest version with the following specifications.
Please apply these changes to the codebase.

### 1. Technology Stack
- **Framework**: Next.js 15+ (App Router)
- **Database**: Drizzle ORM (PostgreSQL)
- **UI**: Tailwind CSS, Shadcn UI, Lucide React
- **Auth**: NextAuth v5 / Custom Auth

### 2. Dependencies
Ensure the following packages are installed:
```json
{
  "dependencies": {
    "@auth/drizzle-adapter": "^1.11.1",
    "@neondatabase/serverless": "1.0.2",
    "drizzle-orm": "0.45.1",
    "next": "16.0.10",
    "next-auth": "5.0.0-beta.30",
    "next-themes": "^0.4.6",
    "react": "19.2.0",
    "zod": "3.25.76",
    "lucide-react": "^0.454.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",
    "tailwindcss": "^4.1.9",
    "typescript": "^5"
  }
}
```

### 3. Database Schema (`lib/db/schema.ts`)
Update the schema file to include the following tables:
- **Users**: `id`, `email`, `role` (student/instructor/admin), `preferences` (jsonb).
- **Courses**: `title`, `slug`, `price`, `is_published`, `category_id`.
- **Modules & Lessons**: Hierarchical structure for course content.
- **Enrollments**: Tracks user access to courses.
- **Progress**: Tracks lesson completion and video timestamp.
- **Commerce**: `carts`, `cart_items`, `orders`, `order_items`.
- **Challenges**: `challenges`, `challenge_submissions`.

(Refer to the full Drizzle schema implementation for details on relations and types).

### 4. Folder Structure & Routing
Implement the following structure:
- `app/[lang]/`: Root for i18n routes.
- `app/[lang]/courses`: Course listing.
- `app/[lang]/courses/[courseId]/learn/[lessonId]`: Lesson player.
- `app/[lang]/admin`: Admin dashboard (protected).
- `app/api/`: API routes for webhooks/upload.
- `components/admin`: Admin forms (CourseForm, LessonForm).
- `lib/actions`: Server actions for mutations (e.g., `cart.ts`, `user.ts`).

### 5. Key Functionalities to Implement
- **I18n**: Use `LanguageContext` to toggle `dir="rtl"` and `dir="ltr"`.
- **Cart Logic**: Persist cart in database for logged-in users.
- **Lesson Player**: Sidebar with module list, video player, and "Complete" button.
- **Admin**: Tables to manage Users, Courses, and Orders.

Please verify that all imports in `app/` and `components/` are consistent with this structure.
---
