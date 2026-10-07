CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booster_cards" (
	"booster_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"weight_override" integer
);
--> statement-breakpoint
CREATE TABLE "boosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"description" text DEFAULT '' NOT NULL,
	"price" integer NOT NULL,
	"cards_per_pack" integer DEFAULT 5 NOT NULL,
	"stock" integer,
	"featured_slot_min_rarity" text,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "card_attacks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"name" text NOT NULL,
	"damage" integer,
	"effect_text" text DEFAULT '' NOT NULL,
	"energy_cost" jsonb NOT NULL,
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"image_url" text,
	"hp" integer NOT NULL,
	"energy_type" text NOT NULL,
	"stage" text NOT NULL,
	"evolves_from_id" uuid,
	"retreat_cost" integer NOT NULL,
	"weakness_type" text,
	"weakness_modifier" integer DEFAULT 20 NOT NULL,
	"rarity" text NOT NULL,
	"flavor_text" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coin_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_opening_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pack_opening_id" uuid NOT NULL,
	"user_card_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"slot" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pack_openings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"booster_id" uuid NOT NULL,
	"coins_spent" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rarity_weights" (
	"rarity" text PRIMARY KEY NOT NULL,
	"weight" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "user_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"card_id" uuid NOT NULL,
	"booster_id" uuid,
	"obtained_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"user_id" text PRIMARY KEY NOT NULL,
	"coins" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booster_cards" ADD CONSTRAINT "booster_cards_booster_id_boosters_id_fk" FOREIGN KEY ("booster_id") REFERENCES "public"."boosters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booster_cards" ADD CONSTRAINT "booster_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_attacks" ADD CONSTRAINT "card_attacks_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coin_ledger" ADD CONSTRAINT "coin_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_opening_cards" ADD CONSTRAINT "pack_opening_cards_pack_opening_id_pack_openings_id_fk" FOREIGN KEY ("pack_opening_id") REFERENCES "public"."pack_openings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_opening_cards" ADD CONSTRAINT "pack_opening_cards_user_card_id_user_cards_id_fk" FOREIGN KEY ("user_card_id") REFERENCES "public"."user_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_opening_cards" ADD CONSTRAINT "pack_opening_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pack_openings" ADD CONSTRAINT "pack_openings_booster_id_boosters_id_fk" FOREIGN KEY ("booster_id") REFERENCES "public"."boosters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_booster_id_boosters_id_fk" FOREIGN KEY ("booster_id") REFERENCES "public"."boosters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booster_cards_pk" ON "booster_cards" USING btree ("booster_id","card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "boosters_slug_idx" ON "boosters" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "card_attacks_card_id_idx" ON "card_attacks" USING btree ("card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cards_slug_idx" ON "cards" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "coin_ledger_user_id_idx" ON "coin_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "pack_opening_cards_opening_idx" ON "pack_opening_cards" USING btree ("pack_opening_id");--> statement-breakpoint
CREATE INDEX "pack_openings_user_id_idx" ON "pack_openings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_cards_user_id_idx" ON "user_cards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_cards_user_card_idx" ON "user_cards" USING btree ("user_id","card_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");