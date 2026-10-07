ALTER TABLE "cards" ADD COLUMN "image_x" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "image_y" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "image_scale" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "overlay_image_url" text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "overlay_x" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "overlay_y" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "overlay_scale" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "decoration_asset" text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "decoration_image_url" text;