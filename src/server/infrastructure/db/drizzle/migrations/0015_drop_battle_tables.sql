DROP TABLE IF EXISTS "battle_deck_cards" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "battle_decks" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "battle_opponent_cards" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "battle_opponents" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "battles" CASCADE;--> statement-breakpoint
ALTER TABLE "card_attacks" DROP COLUMN IF EXISTS "effects";