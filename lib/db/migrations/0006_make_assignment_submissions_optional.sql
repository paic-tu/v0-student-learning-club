ALTER TABLE "assignment_submissions" ADD COLUMN IF NOT EXISTS "text_content" text;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ALTER COLUMN "file_url" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ALTER COLUMN "file_name" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ALTER COLUMN "file_size" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ALTER COLUMN "mime_type" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ADD COLUMN IF NOT EXISTS "text_content" text;
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ALTER COLUMN "file_url" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ALTER COLUMN "file_name" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ALTER COLUMN "file_size" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ALTER COLUMN "mime_type" DROP NOT NULL;

