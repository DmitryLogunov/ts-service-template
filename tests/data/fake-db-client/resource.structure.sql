DROP TABLE IF EXISTS `resource`;
CREATE TABLE `resource` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
  `title` varchar(255) NOT NULL,
  `context_type_id` int(11) NOT NULL,
  `context_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int(11) DEFAULT NULL
);