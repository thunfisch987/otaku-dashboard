ALTER TABLE `products` RENAME COLUMN "name" TO "productname";--> statement-breakpoint
DROP INDEX `products_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_productname_unique` ON `products` (`productname`);