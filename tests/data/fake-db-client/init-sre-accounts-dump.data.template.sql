INSERT INTO `accounts` (`id`, `account_type_id`, `login`, `first_name`, `last_name`, `title`, `time_zone`, `email`, `phone`, `skype_id`, `city`,
                     `state`, `country`, `is_active`, `is_terminate`, `created_at`, `created_by`, `updated_at`, `updated_by`, `source_table`,
                     `source_id`, `double_table`, `double_id`) 
VALUES ('{{id}}', '{{account_type_id}}', '{{login}}', '{{first_name}}', '{{last_name}}', 'Sr Director Product Management', 'America/Los_Angeles', '{{email}}', '{{phone}}', '{{skype_id}}',
        'Belmont, CA', 'Belmont, CA', 'US', '1', '0', NULL, '{{created_by}}', NULL, NULL, 'rccmrdb.user', '{{source_id}}','rcimpdb.user', '{{double_id}}')