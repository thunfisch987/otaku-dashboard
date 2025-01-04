CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`picture` text,
	`price` integer NOT NULL,
	`supplier` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "supplier_check" CHECK("products"."supplier" IN ("HDJ", "Otaku"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_name_unique` ON `products` (`name`);--> statement-breakpoint
ALTER TABLE `users` ADD `given_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `family_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login` integer NOT NULL;