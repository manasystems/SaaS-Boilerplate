ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "default_overhead" numeric(6, 3) DEFAULT '10' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "default_profit" numeric(6, 3) DEFAULT '8' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "default_contingency" numeric(6, 3) DEFAULT '5' NOT NULL;
