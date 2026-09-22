import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { hashPassword } from "better-auth/crypto";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { account, channelSubscriptions, channels, user } from "../drizzle/schema";

type PostgresClientOptions = NonNullable<Parameters<typeof postgres>[1]> & {
  max_pipeline?: number;
};

const ADMIN_EMAIL = "admin@cattube.test";
const ADMIN_PASSWORD = "AdminCats123!";
const ADMIN_NAME = "Admin Cat";

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
  const db = drizzle({ client });

  try {
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL))
      .limit(1);

    const userId = existing?.id ?? crypto.randomUUID();

    if (existing) {
      await db.update(user).set({ admin: true, name: ADMIN_NAME }).where(eq(user.id, userId));
      const password = await hashPassword(ADMIN_PASSWORD);
      await db
        .update(account)
        .set({ password })
        .where(eq(account.userId, userId));
    } else {
      await db.insert(user).values({
        id: userId,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        emailVerified: true,
        admin: true,
      });
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: await hashPassword(ADMIN_PASSWORD),
      });
    }

    const channelRows = await db
      .select({ id: channels.id })
      .from(channels)
      .orderBy(asc(channels.id))
      .limit(3);

    for (const channel of channelRows) {
      await db
        .insert(channelSubscriptions)
        .values({ userId, channelId: channel.id })
        .onConflictDoNothing();
    }

    console.log("Admin account ready");
    console.log(`  email: ${ADMIN_EMAIL}`);
    console.log(`  password: ${ADMIN_PASSWORD}`);
    console.log(`  admin: true`);
    console.log(`  subscribed channels: ${channelRows.length}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
