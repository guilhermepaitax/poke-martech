CREATE TABLE "card_tags" (
	"card_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "card_tags_card_id_tag_id_pk" PRIMARY KEY("card_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_tags" ADD CONSTRAINT "card_tags_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_tags" ADD CONSTRAINT "card_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_tags_tag_id_idx" ON "card_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_normalized_name_idx" ON "tags" USING btree ("normalized_name");--> statement-breakpoint
ALTER TABLE "tags" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tags" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_tags" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "card_tags" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
-- anon and authenticated exist on Supabase and may be absent on local Postgres.
DO $$
DECLARE
  tbl text;
  role_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['public.tags', 'public.card_tags']
  LOOP
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated']
    LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE %s FROM %I', tbl, role_name);
      END IF;
    END LOOP;
    EXECUTE format('REVOKE ALL ON TABLE %s FROM PUBLIC', tbl);
  END LOOP;
END $$;
--> statement-breakpoint
-- Backfill from cards.tags. normalized_name mirrors foldText in src/lib/value-objects/card-tag.ts:
-- NFD, strip combining marks, lowercase, trim. The first spelling seen becomes the tag name.
CREATE TEMPORARY TABLE "legacy_card_tags" AS
SELECT
	"card_id",
	"name",
	"ord",
	lower(regexp_replace(normalize("name", NFD), '[\u0300-\u036f]', '', 'g')) AS "normalized_name"
FROM (
	SELECT
		c."id" AS "card_id",
		regexp_replace(regexp_replace(t."tag", '^\s+|\s+$', '', 'g'), '\s+', ' ', 'g') AS "name",
		t."ord"
	FROM "cards" c
	CROSS JOIN LATERAL unnest(c."tags") WITH ORDINALITY AS t("tag", "ord")
) raw
WHERE "name" <> '' AND length("name") <= 32 AND position(',' in "name") = 0;
--> statement-breakpoint
INSERT INTO "tags" ("name", "normalized_name")
SELECT DISTINCT ON ("normalized_name") "name", "normalized_name"
FROM "legacy_card_tags"
ORDER BY "normalized_name", "ord", "card_id";
--> statement-breakpoint
INSERT INTO "card_tags" ("card_id", "tag_id", "sort_order")
SELECT DISTINCT ON (l."card_id", t."id") l."card_id", t."id", (l."ord" - 1)::integer
FROM "legacy_card_tags" l
INNER JOIN "tags" t ON t."normalized_name" = l."normalized_name"
ORDER BY l."card_id", t."id", l."ord";
--> statement-breakpoint
DROP TABLE "legacy_card_tags";
--> statement-breakpoint
ALTER TABLE "cards" DROP COLUMN "tags";
