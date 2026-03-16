ALTER TABLE "assignment_submissions" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ADD COLUMN IF NOT EXISTS "attachments" jsonb DEFAULT '[]'::jsonb;

