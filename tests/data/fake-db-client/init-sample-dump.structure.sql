CREATE TABLE IF NOT EXISTS `sample-resource` (
  `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
  `info` TEXT,
  `created_at` DateTime DEFAULT CURRENT_TIMESTAMP, 
  `created_by` Int( 11 ) NULL, 
  `updated_at` DateTime DEFAULT CURRENT_TIMESTAMP, 
  `updated_by` Int( 11 ) NULL,
  `some_numeric_property` Int( 11 ) NULL,
  `relationships_first_id` Int( 11 ) NULL,
  `relationships_first_type_id` Int( 11 ) NULL,
  `relationships_second_id` Int( 11 ) NULL
);
