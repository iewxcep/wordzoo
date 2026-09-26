import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { db } from "./db";

async function main() {
  console.log("Running your migrations...");
  migrate(db, { migrationsFolder: "drizzle" });
  console.log("Woohoo! Migrations completed!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
