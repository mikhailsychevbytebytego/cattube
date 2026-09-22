import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../../drizzle/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

type PostgresClientOptions = NonNullable<Parameters<typeof postgres>[1]> & {
  max_pipeline?: number;
};

const globalForDb = globalThis as typeof globalThis & {
  postgres?: ReturnType<typeof postgres>;
};

// Disable prefetch as it is not supported for "Transaction" pool mode.
const clientOptions: PostgresClientOptions = {
  prepare: false,
  max: 10,
  max_pipeline: 0,
  ssl: "require",
};
const client = globalForDb.postgres ?? postgres(connectionString, clientOptions);

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgres = client;
}

export const db = drizzle({ client, schema });
export { schema };
