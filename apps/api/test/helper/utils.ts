import { sql } from "drizzle-orm";
import type { TestingModule } from "@nestjs/testing";

import type { DbType } from "../../src/global/providers/db.provider";
import { GlobalModule } from "../../src/global/global.module";

const CLEAN_TABLES = [
  "statements",
  "courses",
  "course_packs",
  "user_course_progress",
  "course_history",
  "user_learning_activities",
  "mastered_elements",
  "app_settings",
];

export async function cleanDB(db: DbType) {
  for (const table of CLEAN_TABLES) {
    await db.run(sql.raw(`DELETE FROM ${table};`));
  }
}

export const testImportModules = [GlobalModule];
