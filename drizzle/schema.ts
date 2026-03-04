import {
  date,
  index,
  jsonb,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/** task_memos: { [taskId: string]: string } */
export type TaskMemos = Record<string, string>;

const authSchema = pgSchema("auth");

/** auth.users (Supabase 관리) - FK 참조용 */
const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

/** routine_saves: 사용자별 저장 데이터 (1인 1행, upsert) */
export const routineSaves = pgTable(
  "routine_saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    inputText: text("input_text").default(""),
    reflection: text("reflection").default(""),
    taskMemos: jsonb("task_memos").$type<TaskMemos>().default({}),
    subtitle: text("subtitle").default("오늘을 가볍게, 나답게 끝내기"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.userId)]
);

/** routine_sessions: [시작] 버튼 누를 때마다 1행 추가 (일자별 여러 번 가능) */
export const routineSessions = pgTable(
  "routine_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    sessionDate: date("session_date").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    inputText: text("input_text").notNull().default(""),
    reflection: text("reflection").default(""),
    taskMemos: jsonb("task_memos").$type<TaskMemos>().default({}),
    subtitle: text("subtitle").default("오늘을 가볍게, 나답게 끝내기"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    index("idx_routine_sessions_user_date").on(t.userId, t.sessionDate),
  ]
);
