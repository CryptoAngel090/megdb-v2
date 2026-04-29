ALTER TABLE "movie_comments" ADD COLUMN "media_type" "media_type" DEFAULT 'movie' NOT NULL;--> statement-breakpoint
CREATE INDEX "movie_comments_media_type_idx" ON "movie_comments" USING btree ("media_type");
