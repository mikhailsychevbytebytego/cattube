import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { videos } from "../drizzle/schema";
import { embedThumbnail } from "../src/lib/clip-embed";

type PostgresClientOptions = NonNullable<Parameters<typeof postgres>[1]> & {
  max_pipeline?: number;
};

function loadDotEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(?:"([^"]*)"|'([^']*)'|(.+))$/);
      if (!match?.[1]) continue;
      if (process.env[match[1]] !== undefined) continue;
      process.env[match[1]] = match[2] ?? match[3] ?? match[4] ?? "";
    }
  } catch {
    // Use already-exported environment variables.
  }
}

async function main() {
  loadDotEnv();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const clientOptions: PostgresClientOptions = {
    prepare: false,
    max: 1,
    max_pipeline: 0,
    ssl: "require",
  };
  const client = postgres(connectionString, clientOptions);
  const db = drizzle({ client, schema: { videos } });

  try {
    const rows = await db
      .select({ id: videos.id, slug: videos.slug, thumbnail: videos.thumbnail })
      .from(videos)
      .where(isNull(videos.embedding));

    console.log(`Embedding ${rows.length} video thumbnail${rows.length === 1 ? "" : "s"}`);

    for (const row of rows) {
      console.log(`CLIP ${row.slug}`);
      const embedding = await embedThumbnail(row.thumbnail);
      await db.update(videos).set({ embedding }).where(eq(videos.id, row.id));
    }

    console.log(JSON.stringify({ embedded: rows.length }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
