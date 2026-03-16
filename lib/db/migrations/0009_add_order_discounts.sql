ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "original_amount" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(10, 2);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_ids" jsonb;

