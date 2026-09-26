import fs from "node:fs";
import path from "node:path";

import { db } from "@earthworm/db";
import {
  coursePack,
  course as courseSchema,
  statement as statementSchema,
} from "@earthworm/schema";

type Statement = typeof statementSchema.$inferInsert;

const BATCH_SIZE = 500;

const courses = fs.readdirSync(path.resolve(__dirname, "../data/courses"));

(async function () {
  db.transaction((tx) => {
    tx.delete(statementSchema).run();
    tx.delete(courseSchema).run();
    tx.delete(coursePack).run();
  });

  const [coursePackEntity] = await db
    .insert(coursePack)
    .values({
      order: 1,
      title: "星荣零基础学英语",
      description: "最适合零基础入门的课程",
      creatorId: "local",
      shareLevel: "public",
      isFree: true,
      cover:
        "https://earthworm-prod-1312884695.cos.ap-beijing.myqcloud.com/course-packs/xingrong.jpg",
    })
    .returning();

  const courseList = await Promise.all(
    courses.map(async (courseFileName, index) => {
      const courseName = path.parse(courseFileName).name;
      const [course] = await db
        .insert(courseSchema)
        .values({
          coursePackId: coursePackEntity.id,
          // Index starts from 0
          order: index + 1,
          title: convertToChineseNumber(courseName),
        })
        .returning({ id: courseSchema.id, order: courseSchema.order, title: courseSchema.title });

      console.log(`创建: id-${course.id} order-${course.order} title-${course.title}`);

      return {
        ...course,
        meta: {
          courseFileName,
          courseName,
        },
      };
    }),
  );

  for (const course of courseList) {
    const { id: courseId, meta } = course;

    const courseDataJsonText = fs.readFileSync(
      path.resolve(__dirname, `../data/courses/${meta.courseFileName}`),
      "utf-8",
    );

    const statementList = JSON.parse(courseDataJsonText) as Statement[];

    let order = 1;
    const statementValues = statementList.map((statement) => ({
      ...statement,
      order: order++,
      courseId,
    }));

    console.log(`courseName: ${meta.courseFileName} 开始上传`);
    for (let i = 0; i < statementValues.length; i += BATCH_SIZE) {
      const chunk = statementValues.slice(i, i + BATCH_SIZE);
      db.transaction((tx) => {
        tx.insert(statementSchema).values(chunk).run();
      });
    }
    console.log(`courseName: ${meta.courseFileName} 全部上传成功`);
  }

  console.log("全部创建完成");
  process.exit(0);
})();

function convertToChineseNumber(numStr: string): string {
  const chineseNumbers = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  let chineseStr = "第";
  if (parseInt(numStr) >= 10) {
    const [tens, ones] = numStr.split("");
    if (tens !== "1") {
      chineseStr += chineseNumbers[parseInt(tens, 10)];
    }
    chineseStr += "十";
    if (ones !== "0") {
      chineseStr += chineseNumbers[parseInt(ones, 10)];
    }
  } else {
    chineseStr += chineseNumbers[parseInt(numStr, 10)];
  }
  chineseStr += "课";
  return chineseStr;
}
