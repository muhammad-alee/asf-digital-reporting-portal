ALTER TABLE `reports` ADD `report_time` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `shift` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `location` text;--> statement-breakpoint
ALTER TABLE `reports` ADD `ai_analysis` text;--> statement-breakpoint
CREATE INDEX `report_airport_idx` ON `reports` (`airport_id`);
