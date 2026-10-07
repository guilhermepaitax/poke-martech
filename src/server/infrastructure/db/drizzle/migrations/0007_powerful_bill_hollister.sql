CREATE TABLE "battle_deck_cards" (
	"deck_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"copies" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"energy_types" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_opponent_cards" (
	"opponent_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"copies" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_opponents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"avatar_url" text,
	"description" text DEFAULT '' NOT NULL,
	"difficulty" text DEFAULT 'normal' NOT NULL,
	"reward_coins" integer DEFAULT 10 NOT NULL,
	"energy_types" jsonb NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"opponent_id" uuid NOT NULL,
	"deck_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"state" jsonb NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"reward_coins" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "card_attacks" ADD COLUMN "effects" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "battle_deck_cards" ADD CONSTRAINT "battle_deck_cards_deck_id_battle_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."battle_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_deck_cards" ADD CONSTRAINT "battle_deck_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_decks" ADD CONSTRAINT "battle_decks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_opponent_cards" ADD CONSTRAINT "battle_opponent_cards_opponent_id_battle_opponents_id_fk" FOREIGN KEY ("opponent_id") REFERENCES "public"."battle_opponents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battle_opponent_cards" ADD CONSTRAINT "battle_opponent_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_opponent_id_battle_opponents_id_fk" FOREIGN KEY ("opponent_id") REFERENCES "public"."battle_opponents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "battles" ADD CONSTRAINT "battles_deck_id_battle_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."battle_decks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "battle_deck_cards_pk" ON "battle_deck_cards" USING btree ("deck_id","card_id");--> statement-breakpoint
CREATE INDEX "battle_decks_user_id_idx" ON "battle_decks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "battle_opponent_cards_pk" ON "battle_opponent_cards" USING btree ("opponent_id","card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "battle_opponents_slug_idx" ON "battle_opponents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "battles_user_status_idx" ON "battles" USING btree ("user_id","status");