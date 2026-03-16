ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "storage" varchar(20) NOT NULL DEFAULT 'inline';
--> statement-breakpoint
ALTER TABLE "files" ALTER COLUMN "data" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "chunk_size" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "chunk_count" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "is_complete" boolean NOT NULL DEFAULT true;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "file_chunks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "file_id" uuid NOT NULL REFERENCES "files"("id") ON DELETE CASCADE,
  "chunk_index" integer NOT NULL,
  "data" text NOT NULL,
  "size" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "file_chunks_file_index_unique" ON "file_chunks" ("file_id","chunk_index");

