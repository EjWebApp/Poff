ALTER TABLE "routine_saves" DROP CONSTRAINT "routine_saves_user_id_unique";--> statement-breakpoint
ALTER TABLE "routine_saves" ADD COLUMN "save_date" date NOT NULL DEFAULT current_date;--> statement-breakpoint
CREATE INDEX "idx_routine_saves_user_date" ON "routine_saves" USING btree ("user_id","save_date");--> statement-breakpoint
ALTER TABLE "routine_saves" ADD CONSTRAINT "routine_saves_user_id_save_date_unique" UNIQUE("user_id","save_date");