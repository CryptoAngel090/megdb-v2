CREATE TYPE "public"."media_type" AS ENUM('movie', 'series', 'cartoon', 'tvshow');--> statement-breakpoint
CREATE TYPE "public"."reaction_type" AS ENUM('like', 'dislike');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."watch_status" AS ENUM('watching', 'completed', 'planned');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"media_type" "media_type",
	"filters" json,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"body" text NOT NULL,
	"parent_id" integer,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "genres_tmdb_id_unique" UNIQUE("tmdb_id"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_id" integer NOT NULL,
	"type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"original_title" text,
	"overview" text DEFAULT '',
	"tagline" text,
	"poster_path" text,
	"backdrop_path" text,
	"release_date" timestamp,
	"runtime" integer,
	"vote_average" real DEFAULT 0,
	"vote_count" integer DEFAULT 0,
	"popularity" real DEFAULT 0,
	"status" text,
	"adult" boolean DEFAULT false,
	"synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "media_tmdb_id_unique" UNIQUE("tmdb_id")
);
--> statement-breakpoint
CREATE TABLE "media_genres" (
	"media_id" integer NOT NULL,
	"genre_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_persons" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" text,
	"character" text,
	"department" text,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "media_videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"site" text DEFAULT 'YouTube',
	"type" text DEFAULT 'Trailer',
	"official" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "movie_feedback_votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_movie_id" integer NOT NULL,
	"visitor_id" text NOT NULL,
	"vote" "reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" serial PRIMARY KEY NOT NULL,
	"tmdb_id" integer NOT NULL,
	"name" text NOT NULL,
	"profile_path" text,
	"biography" text,
	"birthday" timestamp,
	"known_for_department" text,
	"popularity" real DEFAULT 0,
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "persons_tmdb_id_unique" UNIQUE("tmdb_id")
);
--> statement-breakpoint
CREATE TABLE "reactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"type" "reaction_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"media_id" integer NOT NULL,
	"status" "watch_status" DEFAULT 'planned',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_genres" ADD CONSTRAINT "media_genres_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_genres" ADD CONSTRAINT "media_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_persons" ADD CONSTRAINT "media_persons_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_persons" ADD CONSTRAINT "media_persons_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_videos" ADD CONSTRAINT "media_videos_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_media_idx" ON "comments" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "comments_user_idx" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_type_idx" ON "media" USING btree ("type");--> statement-breakpoint
CREATE INDEX "media_popularity_idx" ON "media" USING btree ("popularity");--> statement-breakpoint
CREATE INDEX "media_vote_idx" ON "media" USING btree ("vote_average");--> statement-breakpoint
CREATE INDEX "media_release_idx" ON "media" USING btree ("release_date");--> statement-breakpoint
CREATE UNIQUE INDEX "media_genre_unique" ON "media_genres" USING btree ("media_id","genre_id");--> statement-breakpoint
CREATE INDEX "media_persons_media_idx" ON "media_persons" USING btree ("media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movie_feedback_unique_vote" ON "movie_feedback_votes" USING btree ("tmdb_movie_id","visitor_id");--> statement-breakpoint
CREATE INDEX "movie_feedback_tmdb_idx" ON "movie_feedback_votes" USING btree ("tmdb_movie_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reactions_unique" ON "reactions" USING btree ("user_id","media_id");--> statement-breakpoint
CREATE UNIQUE INDEX "watchlist_unique" ON "watchlist" USING btree ("user_id","media_id");--> statement-breakpoint
CREATE INDEX "watchlist_user_idx" ON "watchlist" USING btree ("user_id");