CREATE INDEX "cards_published_number_idx" ON "cards" USING btree ("published","number");--> statement-breakpoint
CREATE INDEX "pack_opening_cards_user_card_idx" ON "pack_opening_cards" USING btree ("user_card_id");--> statement-breakpoint
CREATE INDEX "trade_proposals_pending_offered_idx" ON "trade_proposals" USING btree ("offered_user_card_id") WHERE "trade_proposals"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "trade_proposals_pending_requested_idx" ON "trade_proposals" USING btree ("requested_user_card_id") WHERE "trade_proposals"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "user_cards_user_obtained_idx" ON "user_cards" USING btree ("user_id","obtained_at" DESC NULLS LAST);--> statement-breakpoint
DROP INDEX "user_cards_user_id_idx";
