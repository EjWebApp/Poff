CREATE TABLE "routine_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"input_text" text DEFAULT '',
	"reflection" text DEFAULT '',
	"task_memos" jsonb DEFAULT '{}'::jsonb,
	"subtitle" text DEFAULT '오늘을 가볍게, 나답게 끝내기',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "routine_saves_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "routine_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"input_text" text DEFAULT '' NOT NULL,
	"reflection" text DEFAULT '',
	"task_memos" jsonb DEFAULT '{}'::jsonb,
	"subtitle" text DEFAULT '오늘을 가볍게, 나답게 끝내기',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "routine_saves" ADD CONSTRAINT "routine_saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_sessions" ADD CONSTRAINT "routine_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_routine_sessions_user_date" ON "routine_sessions" USING btree ("user_id","session_date");