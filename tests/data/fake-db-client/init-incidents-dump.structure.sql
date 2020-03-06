CREATE TABLE IF NOT EXISTS incidents ( 
	`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` VarChar( 255 )  NULL,
	`public_title` VarChar( 255 )  NOT NULL,
	`description` Text  NOT NULL,
	`resolved_at` DateTime NULL,
	`resolved_eta` DateTime NULL,
	`work_around` VarChar( 255 )  NULL,
	`resolution` VarChar( 255 )  NULL,
	`status_id` Int( 11 ) NOT NULL,
	`level_id` Int( 11 )  NOT NULL,
	`organization_id` Int( 11 )  NOT NULL,
	`created_at` DateTime NULL DEFAULT CURRENT_TIMESTAMP,
	`created_by` VarChar( 255 )  NULL,
	`updated_at`  DateTime NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_by` VarChar( 255 )  NULL,
	`source_table` VarChar( 255 )  NULL DEFAULT 'rcimpdb.incident',
	`source_id` Int( 11 ) NULL
  )
;
