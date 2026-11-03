CREATE TABLE `draws` (
	`id` integer PRIMARY KEY NOT NULL,
	`winners` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`device` text NOT NULL,
	`name` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entries_device_unique` ON `entries` (`device`);