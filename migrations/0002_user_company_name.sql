CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_name" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
