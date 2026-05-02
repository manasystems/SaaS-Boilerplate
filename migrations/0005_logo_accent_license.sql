ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "accent_color" text;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "license_number" text;
