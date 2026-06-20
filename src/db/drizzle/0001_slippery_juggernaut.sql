CREATE TABLE `badges` (
	`id` text PRIMARY KEY NOT NULL,
	`achieved_at` integer,
	`reward_claimed` integer DEFAULT false NOT NULL
);
