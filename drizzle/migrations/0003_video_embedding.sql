CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "embedding" vector(512);
--> statement-breakpoint
CREATE INDEX "videos_embedding_hnsw_idx" ON "videos" USING hnsw ("embedding" vector_cosine_ops);
