-- Close the PostgREST Data API. The app connects as postgres, which bypasses RLS.
-- Every new table in public must repeat ENABLE + FORCE ROW LEVEL SECURITY in its own migration.
-- rls_enabled_no_policy is the intended deny-all posture. Do not add policies.
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "session" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "account" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "verification" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "wallets" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "coin_ledger" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "coin_ledger" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "user_cards" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pack_openings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pack_openings" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pack_opening_cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pack_opening_cards" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_generation_batches" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_generation_batches" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_generation_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_generation_items" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_decks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_decks" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_deck_cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_deck_cards" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battles" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "follows" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "follows" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "trade_proposals" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "trade_proposals" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "cards" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_attacks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_attacks" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pokemon_types" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pokemon_types" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "boosters" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "boosters" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "booster_cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "booster_cards" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rarity_weights" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "rarity_weights" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_opponents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_opponents" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_opponent_cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "battle_opponent_cards" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- anon and authenticated exist on Supabase and may be absent on local Postgres.
DO $$
DECLARE
  tbl text;
  role_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'public."user"',
    'public."session"',
    'public.account',
    'public.verification',
    'public.wallets',
    'public.coin_ledger',
    'public.user_cards',
    'public.pack_openings',
    'public.pack_opening_cards',
    'public.card_generation_batches',
    'public.card_generation_items',
    'public.battle_decks',
    'public.battle_deck_cards',
    'public.battles',
    'public.follows',
    'public.trade_proposals',
    'public.cards',
    'public.card_attacks',
    'public.pokemon_types',
    'public.boosters',
    'public.booster_cards',
    'public.rarity_weights',
    'public.battle_opponents',
    'public.battle_opponent_cards'
  ]
  LOOP
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE %s FROM %I', tbl, role_name);
      END IF;
    END LOOP;
    EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC', tbl);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM authenticated';
  END IF;
  EXECUTE 'ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC';
END $$;
