CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"newsletter_opt_in" boolean NOT NULL,
	"terms_accepted_at" timestamp with time zone NOT NULL,
	"failed_sign_in_count" integer DEFAULT 0 NOT NULL,
	"lockout_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255),
	"updated_by" varchar(255),
	CONSTRAINT "customer_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "password_reset_token" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255),
	"updated_by" varchar(255),
	CONSTRAINT "password_reset_token_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255),
	"updated_by" varchar(255),
	CONSTRAINT "session_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE cascade ON UPDATE no action;