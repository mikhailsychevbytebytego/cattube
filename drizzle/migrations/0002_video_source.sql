ALTER TABLE "videos" ADD COLUMN "source_url" text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "source_url" DROP DEFAULT;
