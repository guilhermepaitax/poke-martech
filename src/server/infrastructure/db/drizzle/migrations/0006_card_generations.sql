CREATE TABLE "card_generation_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" text NOT NULL,
	"person_name" text NOT NULL,
	"person_description" text NOT NULL,
	"person_image_url" text NOT NULL,
	"requested_count" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_generation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"source_url" text,
	"source_data" jsonb,
	"source_image_url" text,
	"image_prompt" text,
	"card_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"error" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_generation_batches" ADD CONSTRAINT "card_generation_batches_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_generation_items" ADD CONSTRAINT "card_generation_items_batch_id_card_generation_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."card_generation_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_generation_items" ADD CONSTRAINT "card_generation_items_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_generation_batches_created_at_idx" ON "card_generation_batches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "card_generation_items_batch_idx" ON "card_generation_items" USING btree ("batch_id");