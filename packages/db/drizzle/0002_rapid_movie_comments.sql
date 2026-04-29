CREATE TYPE "public"."comment_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "movie_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_movie_id" integer NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text NOT NULL,
	"body" text NOT NULL,
	"status" "comment_status" DEFAULT 'pending' NOT NULL,
	"moderation_token" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);--> statement-breakpoint
CREATE UNIQUE INDEX "movie_comments_token_unique" ON "movie_comments" USING btree ("moderation_token");--> statement-breakpoint
CREATE INDEX "movie_comments_tmdb_idx" ON "movie_comments" USING btree ("tmdb_movie_id");--> statement-breakpoint
CREATE INDEX "movie_comments_status_idx" ON "movie_comments" USING btree ("status");
