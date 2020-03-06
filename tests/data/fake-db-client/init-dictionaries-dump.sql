
CREATE TABLE IF NOT EXISTS dictionaries ( 
	`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` VarChar( 255 ) NOT NULL,
	`description` Text NULL,
	`name` VarChar( 2500 ) NULL,
	`created_at` DateTime NULL,
	`updated_at` DateTime NULL,
	`type` VarChar( 255 ) NOT NULL
	);

-- Dump data of "dictionaries" -----------------------------
INSERT INTO dictionaries (`id`,`title`,`description`,`name`,`created_at`,`updated_at`,`type`) VALUES 
( '1', 'Severity Level-1', 'Max Calls Affected : Unlimited     Max Customers Affected : Unlimited : Attempting to make Full Switch to DR site : 3 or more Major Services affected (FAX, Email, Voicemail ...) :  Stop Light: RED', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '2', 'Severity Level-2', 'Max Calls Affected : 100,000 or Less     Max Customers Affected : Unlimited : 2mins or longer in duration ', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '3', 'Severity Level-3', 'Max Calls Affected : 45,000 or Less     Max Customers Affected : 15,000 or Less : 2mins or longer in duration : Stop Light: Yellow', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '4', 'Severity Level-4', 'See http://wiki.ringcentral.com/display/OPS/Outage Levels : Stop Light: Green', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '5', 'Severity Level-5', 'See http://wiki.ringcentral.com/display/OPS/Outage Levels : Stop Light: Green', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '6', 'Critical Ticket - High', '50% > of 50  DL customer service being affected by an issue.', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '7', 'Critical Ticket - Normal', 'Still being defined but > then a jira', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '8', 'IT-Severity Level-1', 'Max Calls Affected : Unlimited     Max Customers Affected : Unlimited : Attempting to make Full Switch to DR site : 3 or more Major Services affected (FAX, Email, Voicemail ...) :  Stop Light: RED', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '9', 'IT-Severity Level-2', 'Max Calls Affected : 100,000 or Less     Max Customers Affected : Unlimited : 2mins or longer in duration ', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '10', 'IT-Severity Level-3', 'Max Calls Affected : 45,000 or Less     Max Customers Affected : 15,000 or Less : 2mins or longer in duration : Stop Light: Yellow', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' );

INSERT INTO dictionaries (`id`,`title`,`description`,`name`,`created_at`,`updated_at`,`type`) VALUES 
( '11', 'IT-Severity Level-4', 'See http://wiki.ringcentral.com/display/OPS/Outage Levels : Stop Light: Green', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '12', 'IT-Severity Level-5', 'See http://wiki.ringcentral.com/display/OPS/Outage Levels : Stop Light: Green', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '13', 'IT-Critical Ticket - High', '50% > of 50  DL customer service being affected by an issue.', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '14', 'IT-Critical Ticket - Normal', 'Still being defined but > then a jira', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'incident_impact' ),
( '15', 'EMAIL', 'Email', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'delivery_methods' ),
( '16', 'SMS', 'Sms', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'delivery_methods' ),
( '17', 'GLIP', 'Glip', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'delivery_methods' ),
( '18', 'user', 'User', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'account_type' ),
( '19', 'customer', 'Customer', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'account_type' ),
( '20', 'partner', 'Partner', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'account_type' );

INSERT INTO dictionaries (`id`,`title`,`description`,`name`,`created_at`,`updated_at`,`type`) VALUES 
( '21', 'imp-department', 'Department IMP', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'account_type' ),
( '22', 'cmp-department', 'Department CMP', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'account_type' ),
( '23', 'organizations', 'Organizations', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '24', 'platforms', 'Platforms', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '25', 'environments', 'Environments', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '26', 'services', 'Services', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '27', 'shards', 'Shards', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '28', 'accounts', 'Accounts', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '29', 'account_context_roles', 'Account Context Roles', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '30', 'sessions', 'Sessions', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' );

INSERT INTO dictionaries (`id`,`title`,`description`,`name`,`created_at`,`updated_at`,`type`) VALUES 
( '31', 'attachments', 'Attachments', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '32', 'files', 'Files', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '33', 'notifications', 'Notifications', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '34', 'subscriptions', 'Subscriptions', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '35', 'events', 'Events', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '36', 'context_events', 'Context Events', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '37', 'templates', 'Templates', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '38', 'dictionaries', 'Dictionaries', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '39', 'maintenances', 'Maintenances', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '40', 'rollouts', 'Rollouts', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' );

INSERT INTO dictionaries (`id`,`title`,`description`,`name`,`created_at`,`updated_at`,`type`) VALUES 
( '41', 'incidents', 'Incidents', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '42', 'impacts', 'Impacts', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '43', 'policies', 'Policies', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' ),
( '44', 'context_policies', 'Context Policies', NULL, '2019-05-24 12:06:10', '2019-05-24 12:06:10', 'resource_type' );

INSERT INTO dictionaries (`id`,`title`, `description`, `name`, `created_at`,`updated_at`,`type`) VALUES
( '73', 'comment', 'Comment',  NULL,  '2019-06-14 16:55:52',  '2019-06-14 16:55:52',  'comment_type' ),
( '74', 'chat', 'Chat',  NULL,  '2019-06-14 16:55:52',  '2019-06-14 16:55:52',  'comment_type' ),
( '75', 'note', 'Note',  NULL,  '2019-06-14 16:55:52',  '2019-06-14 16:55:52',  'comment_type' );
