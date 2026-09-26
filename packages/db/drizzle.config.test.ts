import type { Config } from "drizzle-kit";

export default {
  schema: "../schema/src/schema/*",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.SQLITE_DB_PATH || "./data/earthworm.test.db",
  },
} satisfies Config;
