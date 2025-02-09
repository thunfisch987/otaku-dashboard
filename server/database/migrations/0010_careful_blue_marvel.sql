CREATE TABLE `passkeys` (
	`userId` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`publicKey` text NOT NULL,
	`counter` integer NOT NULL,
	`backedUp` integer NOT NULL,
	`transports` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passkeys_id_unique` ON `passkeys` (`id`);