CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderName` text NOT NULL,
	`productsId` integer NOT NULL,
	`amount` integer NOT NULL,
	`date` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`productname` text NOT NULL,
	`picture` text,
	`price` integer DEFAULT 0 NOT NULL,
	`supplier` text NOT NULL,
	`amount` integer DEFAULT 0 NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "supplier_check" CHECK("__new_products"."supplier" IN ("HDJ", "Otaku")),
	CONSTRAINT "price_check" CHECK("__new_products"."price" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "productname", "picture", "price", "supplier", "amount", "createdAt", "updatedAt") SELECT "id", "productname", "picture", "price", "supplier", "amount", "createdAt", "updatedAt" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `products_productname_unique` ON `products` (`productname`);