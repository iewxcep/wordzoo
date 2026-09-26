import { sql } from "drizzle-orm";

import { course, coursePack, statement } from "@earthworm/schema";
import type { DbType } from "../global/providers/db.provider";

export interface CoursePackImportStatement {
  chinese: string;
  english: string;
  soundmark?: string;
}

export interface CoursePackImportCourse {
  title: string;
  description?: string;
  video?: string;
  statements: CoursePackImportStatement[];
}

export interface CoursePackImportPayload {
  title: string;
  description?: string;
  courses: CoursePackImportCourse[];
}

/** 事务回调中的同步 db（better-sqlite3 事务回调不能返回 promise） */
export type SyncTx = Parameters<Parameters<DbType["transaction"]>[0]>[0];

const STATEMENT_BATCH_SIZE = 100;

/**
 * english 字符白名单：字母/数字/空格/单引号/小数点（词尾小数点除外）。
 * 其余标点替换为空格，词尾句点直接删除；净化后为空的语句跳过。
 */
export function sanitizeEnglish(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N}\s'’.]/gu, " ")
    .replace(/\.+(?=\s|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 在事务内导入一个课程包（三层 JSON：包 → 课程 → 语句数组）。
 * AdminService（导入接口）与 SeedService（初始化数据）共用。
 */
export function importCoursePackData(tx: SyncTx, dto: CoursePackImportPayload) {
  const [{ maxOrder }] = tx
    .select({ maxOrder: sql<number>`coalesce(max(${coursePack.order}), 0)` })
    .from(coursePack)
    .all();

  const [packEntity] = tx
    .insert(coursePack)
    .values({
      order: Number(maxOrder) + 1,
      title: dto.title,
      description: dto.description ?? "",
      isFree: true,
      creatorId: "local",
      shareLevel: "public",
    })
    .returning()
    .all();

  let statementCount = 0;

  dto.courses.forEach((courseDto, courseIndex) => {
    const statements = courseDto.statements
      .map((s) => ({ ...s, english: sanitizeEnglish(s.english) }))
      .filter((s) => s.english.length > 0);
    if (statements.length === 0) return;

    const [courseEntity] = tx
      .insert(course)
      .values({
        order: courseIndex + 1,
        title: courseDto.title,
        description: courseDto.description ?? "",
        video: courseDto.video ?? "",
        coursePackId: packEntity.id,
      })
      .returning()
      .all();

    for (let start = 0; start < statements.length; start += STATEMENT_BATCH_SIZE) {
      const batch = statements.slice(start, start + STATEMENT_BATCH_SIZE).map((s, offset) => ({
        order: start + offset + 1,
        chinese: s.chinese,
        english: s.english,
        soundmark: s.soundmark ?? "",
        courseId: courseEntity.id,
      }));
      tx.insert(statement).values(batch).run();
      statementCount += batch.length;
    }
  });

  return { ...packEntity, courseCount: dto.courses.length, statementCount };
}
