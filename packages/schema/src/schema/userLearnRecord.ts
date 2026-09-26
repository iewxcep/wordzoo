import { createId } from "@paralleldrive/cuid2";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const userLearnRecord = sqliteTable(
  "user_learn_record",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id").notNull(),
    count: integer("count").notNull().default(0),
    day: text("day").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdateFn(
      () => new Date(),
    ),
  },
  (t) => ({
    unq: unique().on(t.userId, t.day),
  }),
);
