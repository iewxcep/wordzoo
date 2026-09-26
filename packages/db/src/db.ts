import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { schemas } from "@earthworm/schema";

const dbPath = process.env.SQLITE_DB_PATH ?? "./data/earthworm.db";

fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

console.log("sqlite db path: ", dbPath);

export const db = drizzle(sqlite, {
  schema: schemas,
});
