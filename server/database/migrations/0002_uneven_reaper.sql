PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`email` text NOT NULL,
	`avatar` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_login` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "given_name", "family_name", "email", "avatar", "created_at", "last_login") SELECT "id", "name", "given_name", "family_name", "email", "avatar", "created_at", "last_login" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);