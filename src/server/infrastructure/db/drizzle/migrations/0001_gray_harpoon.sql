CREATE TABLE "pokemon_types" (
	"code" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
INSERT INTO "pokemon_types" ("code", "name") VALUES
	('careca', 'Careca'),
	('devops', 'DevOps'),
	('ux-ui', 'UX/UI'),
	('full-stack', 'Full Stack'),
	('frontend', 'Frontend'),
	('qa', 'QA'),
	('backend', 'Backend'),
	('testes-automatizados', 'Testes Automatizados'),
	('admin-generico', 'Admin Genérico'),
	('ia', 'IA');
--> statement-breakpoint
UPDATE "cards" SET "energy_type" = CASE "energy_type"
	WHEN 'grass' THEN 'careca'
	WHEN 'fire' THEN 'devops'
	WHEN 'water' THEN 'ux-ui'
	WHEN 'lightning' THEN 'full-stack'
	WHEN 'psychic' THEN 'frontend'
	WHEN 'fighting' THEN 'qa'
	WHEN 'darkness' THEN 'backend'
	WHEN 'metal' THEN 'testes-automatizados'
	WHEN 'dragon' THEN 'admin-generico'
	WHEN 'colorless' THEN 'ia'
	ELSE "energy_type"
END;
--> statement-breakpoint
UPDATE "cards" SET "weakness_type" = CASE "weakness_type"
	WHEN 'grass' THEN 'careca'
	WHEN 'fire' THEN 'devops'
	WHEN 'water' THEN 'ux-ui'
	WHEN 'lightning' THEN 'full-stack'
	WHEN 'psychic' THEN 'frontend'
	WHEN 'fighting' THEN 'qa'
	WHEN 'darkness' THEN 'backend'
	WHEN 'metal' THEN 'testes-automatizados'
	WHEN 'dragon' THEN 'admin-generico'
	WHEN 'colorless' THEN 'ia'
	ELSE "weakness_type"
END
WHERE "weakness_type" IS NOT NULL;
--> statement-breakpoint
UPDATE "card_attacks" SET "energy_cost" = (
	SELECT COALESCE(
		jsonb_agg(
			jsonb_set(
				elem,
				'{type}',
				to_jsonb(
					CASE elem->>'type'
						WHEN 'grass' THEN 'careca'
						WHEN 'fire' THEN 'devops'
						WHEN 'water' THEN 'ux-ui'
						WHEN 'lightning' THEN 'full-stack'
						WHEN 'psychic' THEN 'frontend'
						WHEN 'fighting' THEN 'qa'
						WHEN 'darkness' THEN 'backend'
						WHEN 'metal' THEN 'testes-automatizados'
						WHEN 'dragon' THEN 'admin-generico'
						WHEN 'colorless' THEN 'ia'
						ELSE elem->>'type'
					END
				)
			)
			ORDER BY ordinality
		),
		'[]'::jsonb
	)
	FROM jsonb_array_elements("card_attacks"."energy_cost") WITH ORDINALITY AS items(elem, ordinality)
);
--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_energy_type_pokemon_types_code_fk" FOREIGN KEY ("energy_type") REFERENCES "public"."pokemon_types"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_weakness_type_pokemon_types_code_fk" FOREIGN KEY ("weakness_type") REFERENCES "public"."pokemon_types"("code") ON DELETE no action ON UPDATE no action;
