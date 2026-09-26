import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const userLearningActivities = sqliteTable(
  "user_learning_activities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    date: text("date").notNull(),
    activityType: text("activity_type").notNull(),
    courseId: text("course_id"),
    duration: integer("duration").notNull(),
    metadata: text("metadata", { mode: "json" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdateFn(
      () => new Date(),
    ),
  },
  (t) => ({
    unq: unique().on(t.userId, t.date, t.activityType),
  }),
);
