import * as fs from "node:fs";
import * as path from "node:path";

import { Inject, Injectable } from "@nestjs/common";
import { asc } from "drizzle-orm";

import { course, coursePack, statement } from "@earthworm/schema";
import { sanitizeEnglish } from "../common/course-pack-import";
import { DB, DbType } from "../global/providers/db.provider";

const DEFAULT_PACK_TITLE = "星荣零基础学英语";

interface SeedStatement {
  chinese: string;
  english: string;
  soundmark: string;
}

interface SeedCourseFile {
  fileName: string;
  statements: SeedStatement[];
}

/**
 * COURSES_DATA_DIR 指向一个课程包目录：01.json..NN.json，每个文件是一课，
 * 文件内容为 [{chinese, english, soundmark}] 数组。
 * 仅在 course_packs 表为空且目录存在时执行种子化。
 */
@Injectable()
export class SeedService {
  constructor(@Inject(DB) private db: DbType) {}

  async seedDefaultCoursePack() {
    const existingPack = await this.db.query.coursePack.findFirst();
    if (existingPack) return false;

    const dataDir = this.resolveCoursesDataDir();
    if (!dataDir) return false;

    const courseFiles = this.readCourseFiles(dataDir);
    if (courseFiles.length === 0) return false;

    await this.db.transaction((tx) => {
      const [pack] = tx
        .insert(coursePack)
        .values({
          order: 1,
          title: DEFAULT_PACK_TITLE,
          description: "",
          isFree: true,
          creatorId: "local",
          shareLevel: "public",
        })
        .returning()
        .all();

      let courseOrder = 1;
      for (const courseFile of courseFiles) {
        const courseTitle = this.courseTitleFromFileName(courseFile.fileName, courseOrder);
        const [courseEntity] = tx
          .insert(course)
          .values({
            order: courseOrder,
            title: courseTitle,
            description: "",
            coursePackId: pack.id,
          })
          .returning()
          .all();

        const seeded = courseFile.statements
          .map((s, index) => ({
            order: index + 1,
            chinese: s.chinese,
            english: sanitizeEnglish(s.english),
            soundmark: s.soundmark,
            courseId: courseEntity.id,
          }))
          .filter((s) => s.english.length > 0);
        if (seeded.length > 0) {
          tx.insert(statement).values(seeded).run();
        }

        courseOrder += 1;
      }
    });

    return true;
  }

  private readCourseFiles(dataDir: string): SeedCourseFile[] {
    const fileNames = fs
      .readdirSync(dataDir)
      .filter((name) => name.endsWith(".json"))
      .sort();

    const courseFiles: SeedCourseFile[] = [];
    for (const fileName of fileNames) {
      const raw = fs.readFileSync(path.join(dataDir, fileName), "utf-8");
      const statements = JSON.parse(raw) as SeedStatement[];
      courseFiles.push({ fileName, statements });
    }
    return courseFiles;
  }

  private courseTitleFromFileName(fileName: string, order: number) {
    const matched = fileName.match(/^(\d+)/);
    if (!matched) return `第${order}课`;
    return `第${parseInt(matched[1], 10)}课`;
  }

  private resolveCoursesDataDir(): string | null {
    const dir = process.env.COURSES_DATA_DIR;
    if (!dir) return null;

    const candidates = path.isAbsolute(dir)
      ? [dir]
      : [path.resolve(process.cwd(), dir), path.resolve(__dirname, "../../../../", dir), path.resolve(__dirname, "../../../", dir)];

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate) || !fs.statSync(candidate).isDirectory()) continue;
      if (this.hasJsonFiles(candidate)) return candidate;
      // 兼容 xingrong-courses 的实际布局：<data>/courses/01.json...
      const coursesDir = path.join(candidate, "courses");
      if (this.hasJsonFiles(coursesDir)) return coursesDir;
    }
    return null;
  }

  private hasJsonFiles(dir: string) {
    return fs.existsSync(dir) && fs.readdirSync(dir).some((name) => name.endsWith(".json"));
  }
}
