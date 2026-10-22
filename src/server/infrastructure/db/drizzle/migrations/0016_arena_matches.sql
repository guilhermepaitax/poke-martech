CREATE TABLE "arena_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"difficulty" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"reward" integer
);
--> statement-breakpoint
ALTER TABLE "arena_matches" ADD CONSTRAINT "arena_matches_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "arena_matches_user_finished_idx" ON "arena_matches" USING btree ("user_id","finished_at");--> statement-breakpoint
ALTER TABLE "arena_matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "arena_matches" FORCE ROW LEVEL SECURITY;