CREATE TYPE "public"."lesson_type" AS ENUM('video', 'article', 'quiz', 'assignment', 'resource');--> statement-breakpoint
CREATE TYPE "public"."video_provider" AS ENUM('upload', 'youtube', 'vimeo', 'mux');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"lesson_id" uuid,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"course_id" uuid,
	"product_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lesson_id" uuid NOT NULL,
	"content" text NOT NULL,
	"timestamp" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"is_published" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "subtitle_en" varchar(255);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "subtitle_ar" varchar(255);--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "preview_video_url" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "language" varchar(10) DEFAULT 'ar';--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "requirements" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "learning_outcomes" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "reviews_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "type" "lesson_type" DEFAULT 'video' NOT NULL;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "video_provider" "video_provider" DEFAULT 'upload';--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "quiz_config" jsonb;--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN "assignment_config" jsonb;--> statement-breakpoint
ALTER TABLE "progress" ADD COLUMN "last_time" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "headline" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "twitter_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" DROP COLUMN "video_url";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "content_markdown";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "content_type";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "thumbnail_url";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "free_preview";--> statement-breakpoint
ALTER TABLE "lessons" DROP COLUMN "prerequisites";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_slug_unique" UNIQUE("slug");--> statement-breakpoint
DROP TYPE "public"."artifact_type";--> statement-breakpoint
DROP TYPE "public"."booking_status";--> statement-breakpoint
DROP TYPE "public"."cohort_member_role";--> statement-breakpoint
DROP TYPE "public"."cohort_member_status";--> statement-breakpoint
DROP TYPE "public"."cohort_status";--> statement-breakpoint
DROP TYPE "public"."lab_difficulty";--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
DROP TYPE "public"."project_visibility";--> statement-breakpoint
DROP TYPE "public"."schedule_type";--> statement-breakpoint
DROP TYPE "public"."submission_verdict";