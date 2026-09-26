import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { course, coursePack, courseHistory, statement, userCourseProgress } from "@earthworm/schema";
import { importCoursePackData, sanitizeEnglish } from "../common/course-pack-import";
import { DB, DbType } from "../global/providers/db.provider";
import { CreateCourseDto, CreateCoursePackDto } from "./dto/create.dto";
import { ImportCoursePackDto } from "./dto/import.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";
import { UpdateCoursePackDto } from "./dto/update-course-pack.dto";
import { UpdateStatementDto } from "./dto/update-statement.dto";

@Injectable()
export class AdminService {
  constructor(@Inject(DB) private db: DbType) {}

  async findCoursePacks() {
    const rows = await this.db
      .select({
        id: coursePack.id,
        order: coursePack.order,
        title: coursePack.title,
        description: coursePack.description,
        courseCount: sql<number>`count(${course.id})`,
      })
      .from(coursePack)
      .leftJoin(course, eq(course.coursePackId, coursePack.id))
      .groupBy(coursePack.id)
      .orderBy(asc(coursePack.order));

    return rows;
  }

  async createCoursePack(dto: CreateCoursePackDto) {
    const [{ maxOrder }] = await this.db
      .select({ maxOrder: sql<number>`coalesce(max(${coursePack.order}), 0)` })
      .from(coursePack);

    const [entity] = await this.db
      .insert(coursePack)
      .values({
        order: Number(maxOrder) + 1,
        title: dto.title,
        description: dto.description ?? "",
        isFree: true,
        creatorId: "local",
        shareLevel: "public",
      })
      .returning();

    return { ...entity, courseCount: 0 };
  }

  async updateCoursePack(coursePackId: string, dto: UpdateCoursePackDto) {
    await this.findCoursePackOrThrow(coursePackId);

    const [entity] = await this.db
      .update(coursePack)
      .set(dto)
      .where(eq(coursePack.id, coursePackId))
      .returning();

    const [{ count }] = await this.db
      .select({ count: sql<number>`count(${course.id})` })
      .from(course)
      .where(eq(course.coursePackId, coursePackId));

    return { ...entity, courseCount: Number(count) };
  }

  async removeCoursePack(coursePackId: string) {
    await this.findCoursePackOrThrow(coursePackId);

    const courses = await this.db
      .select({ id: course.id })
      .from(course)
      .where(eq(course.coursePackId, coursePackId));
    const courseIds = courses.map((c) => c.id);

    await this.db.transaction((tx) => {
      if (courseIds.length > 0) {
        tx.delete(statement).where(inArray(statement.courseId, courseIds)).run();
      }
      tx.delete(userCourseProgress).where(eq(userCourseProgress.coursePackId, coursePackId)).run();
      tx.delete(courseHistory).where(eq(courseHistory.coursePackId, coursePackId)).run();
      tx.delete(course).where(eq(course.coursePackId, coursePackId)).run();
      tx.delete(coursePack).where(eq(coursePack.id, coursePackId)).run();
    });
  }

  async findCourses(coursePackId: string) {
    await this.findCoursePackOrThrow(coursePackId);

    return await this.db.query.course.findMany({
      where: eq(course.coursePackId, coursePackId),
      orderBy: [asc(course.order)],
      with: {
        statements: {
          orderBy: [asc(statement.order)],
        },
      },
    });
  }

  async createCourse(coursePackId: string, dto: CreateCourseDto) {
    await this.findCoursePackOrThrow(coursePackId);

    const [{ maxOrder }] = await this.db
      .select({ maxOrder: sql<number>`coalesce(max(${course.order}), 0)` })
      .from(course)
      .where(eq(course.coursePackId, coursePackId));

    const entity = await this.db.transaction((tx) => {
      const [courseEntity] = tx
        .insert(course)
        .values({
          order: Number(maxOrder) + 1,
          title: dto.title,
          description: "",
          coursePackId,
        })
        .returning()
        .all();

      if (dto.statements.length > 0) {
        tx.insert(statement).values(
          dto.statements
            .map((s, index) => ({
              order: index + 1,
              chinese: s.chinese,
              english: sanitizeEnglish(s.english),
              soundmark: s.soundmark,
              courseId: courseEntity.id,
            }))
            .filter((s) => s.english.length > 0),
        ).run();
      }

      return courseEntity;
    });

    return entity;
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    await this.findCourseOrThrow(courseId);

    const [entity] = await this.db.update(course).set(dto).where(eq(course.id, courseId)).returning();
    return entity;
  }

  async removeCourse(courseId: string) {
    await this.findCourseOrThrow(courseId);

    await this.db.transaction(async (tx) => {
      await tx.delete(statement).where(eq(statement.courseId, courseId));
      await tx.delete(course).where(eq(course.id, courseId));
    });
  }

  async updateStatement(statementId: string, dto: UpdateStatementDto) {
    await this.findStatementOrThrow(statementId);

    const set = { ...dto };
    if (dto.english !== undefined) {
      const cleaned = sanitizeEnglish(dto.english);
      if (!cleaned) {
        throw new BadRequestException("english 不能为空");
      }
      set.english = cleaned;
    }

    const [entity] = await this.db
      .update(statement)
      .set(set)
      .where(eq(statement.id, statementId))
      .returning();
    return entity;
  }

  async removeStatement(statementId: string) {
    await this.findStatementOrThrow(statementId);

    await this.db.delete(statement).where(eq(statement.id, statementId));
  }

  /**
   * 导入课程包：创建课程包 → 逐个建课程 → 批量插语句，整体在一个事务里，
   * 任一步骤失败（含校验外的数据问题）整体回滚。
   * better-sqlite3 的事务回调必须同步执行（不能 await）。
   */
  async importCoursePack(dto: ImportCoursePackDto) {
    return this.db.transaction((tx) => importCoursePackData(tx, dto));
  }

  /** 导出课程包：三层 JSON（包信息 → 课程信息 → 语句数组），可选字段仅在非空时输出 */
  async exportCoursePack(coursePackId: string) {
    const pack = await this.findCoursePackOrThrow(coursePackId);

    const courses = await this.db.query.course.findMany({
      where: eq(course.coursePackId, coursePackId),
      orderBy: [asc(course.order)],
      with: {
        statements: {
          orderBy: [asc(statement.order)],
        },
      },
    });

    return {
      title: pack.title,
      ...(pack.description ? { description: pack.description } : {}),
      courses: courses.map((c) => ({
        title: c.title,
        ...(c.description ? { description: c.description } : {}),
        ...(c.video ? { video: c.video } : {}),
        statements: c.statements.map((s) => ({
          chinese: s.chinese,
          english: s.english,
          soundmark: s.soundmark,
        })),
      })),
    };
  }

  private async findCoursePackOrThrow(coursePackId: string) {
    const entity = await this.db.query.coursePack.findFirst({
      where: eq(coursePack.id, coursePackId),
    });
    if (!entity) {
      throw new NotFoundException(`CoursePack with ID ${coursePackId} not found`);
    }
    return entity;
  }

  private async findCourseOrThrow(courseId: string) {
    const entity = await this.db.query.course.findFirst({
      where: eq(course.id, courseId),
    });
    if (!entity) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    return entity;
  }

  private async findStatementOrThrow(statementId: string) {
    const entity = await this.db.query.statement.findFirst({
      where: and(eq(statement.id, statementId)),
    });
    if (!entity) {
      throw new NotFoundException(`Statement with ID ${statementId} not found`);
    }
    return entity;
  }
}
