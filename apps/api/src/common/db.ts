import * as fs from "node:fs";
import * as path from "node:path";

import { BetterSQLite3Database, drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import Database = require("better-sqlite3");

import { schemas } from "@earthworm/schema";

export type DbType = BetterSQLite3Database<typeof schemas>;

let connection: Database.Database | null = null;
let migrated = false;

/**
 * Resolve a possibly-relative env path:
 * first against cwd, then against the repo root.
 */
function resolveEnvPath(dir: string | undefined, defaultCandidates: string[]): string {
  const candidates: string[] = [];
  if (dir) {
    if (path.isAbsolute(dir)) {
      candidates.push(dir);
    } else {
      candidates.push(path.resolve(process.cwd(), dir));
      // __dirname = apps/api/{src,dist/src}/common
      candidates.push(path.resolve(__dirname, "../../../../", dir));
      candidates.push(path.resolve(__dirname, "../../../", dir));
    }
  }
  candidates.push(...defaultCandidates.map((d) => path.resolve(__dirname, d)));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return candidates[0];
}

export function resolveMigrationsDir() {
  return resolveEnvPath(process.env.MIGRATIONS_DIR, [
    "../../../../packages/db/drizzle",
    "../../../packages/db/drizzle",
    "../../../../drizzle",
  ]);
}

export async function setupDB() {
  if (connection) return drizzle(connection, { schema: schemas });

  const dbPath = process.env.SQLITE_DB_PATH || "./data/elearn.db";
  const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.resolve(process.cwd(), dbPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  connection = new Database(resolvedPath);
  connection.pragma("journal_mode = WAL");

  return drizzle(connection, { schema: schemas });
}

export async function migrateDB(db: DbType) {
  if (migrated) return;
  migrated = true;
  migrate(db, { migrationsFolder: resolveMigrationsDir() });
}

export async function endDB() {
  connection?.close();
  connection = null;
}
