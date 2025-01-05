ALTER TABLE `users` RENAME COLUMN "given_name" TO "givenName";--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN "family_name" TO "familyName";--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN "created_at" TO "createdAt";--> statement-breakpoint
ALTER TABLE `users` RENAME COLUMN "last_login" TO "lastLogin";--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`picture` text,
	`price` integer NOT NULL,
	`supplier` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT "supplier_check" CHECK("__new_products"."supplier" IN ("HDJ", "Otaku")),
	CONSTRAINT "price_check" CHECK("__new_products"."price" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "picture", "price", "supplier", "createdAt", "updatedAt") SELECT "id", "name", "picture", "price", "supplier", "createdAt", "updatedAt" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);