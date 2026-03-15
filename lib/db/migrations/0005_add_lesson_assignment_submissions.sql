CREATE TABLE IF NOT EXISTS "lesson_assignment_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lesson_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "file_url" text NOT NULL,
  "file_name" varchar(255) NOT NULL,
  "file_size" integer NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "status" varchar(50) DEFAULT 'submitted' NOT NULL,
  "submitted_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ADD CONSTRAINT "lesson_assignment_submissions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "lesson_assignment_submissions" ADD CONSTRAINT "lesson_assignment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_assignment_submissions_lesson_user_unique" ON "lesson_assignment_submissions" ("lesson_id","user_id");

