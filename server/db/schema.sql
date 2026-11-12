-- ============================================================================
-- RISEUP LABS TOOLS & SERVICES MANAGEMENT SYSTEM (RLTSMS)
-- PRODUCTION DATABASE RELATIONAL SCHEMA (MySQL 8.4 LTS)
-- Version: 2.1.0-PROD
-- Target Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `rltsms_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `rltsms_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES FOR CLEAN MIGRATION RUN
-- ----------------------------------------------------------------------------

DROP TABLE IF EXISTS `card_reveal_logs`;
DROP TABLE IF EXISTS `card_visibility_permissions`;
DROP TABLE IF EXISTS `payment_cards`;
DROP TABLE IF EXISTS `email_delivery_logs`;
DROP TABLE IF EXISTS `email_templates`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `subscription_payments`;
DROP TABLE IF EXISTS `subscription_renewals`;
DROP TABLE IF EXISTS `subscriptions`;
DROP TABLE IF EXISTS `purchases`;
DROP TABLE IF EXISTS `approval_actions`;
DROP TABLE IF EXISTS `requisitions`;
DROP TABLE IF EXISTS `approval_workflow_stages`;
DROP TABLE IF EXISTS `approval_workflows`;
DROP TABLE IF EXISTS `account_access_history`;
DROP TABLE IF EXISTS `account_access_assignments`;
DROP TABLE IF EXISTS `access_requests`;
DROP TABLE IF EXISTS `predefined_access_reasons`;
DROP TABLE IF EXISTS `service_accounts`;
DROP TABLE IF EXISTS `service_plans`;
DROP TABLE IF EXISTS `services`;
DROP TABLE IF EXISTS `service_categories`;
DROP TABLE IF EXISTS `vendors`;
DROP TABLE IF EXISTS `activation_tokens`;
DROP TABLE IF EXISTS `otp_verifications`;
DROP TABLE IF EXISTS `role_permissions`;
DROP TABLE IF EXISTS `permissions`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `roles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `teams`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `system_settings`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 2. ORGANIZATION, USERS & RBAC ROLES (5 INITIAL USERS)
-- ----------------------------------------------------------------------------

-- Departments
CREATE TABLE `departments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT,
  `lead_id` VARCHAR(64) NULL,
  `lead_name` VARCHAR(150) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Teams
CREATE TABLE `teams` (
  `id` VARCHAR(64) PRIMARY KEY,
  `department_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `lead_id` VARCHAR(64) NULL,
  `lead_name` VARCHAR(150) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_teams_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- System Roles Definition
CREATE TABLE `roles` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `is_system` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Granular Permissions
CREATE TABLE `permissions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(150) NOT NULL,
  `module` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Role-Permissions Junction
CREATE TABLE `role_permissions` (
  `role_id` VARCHAR(64) NOT NULL,
  `permission_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`role_id`, `permission_id`),
  CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rp_perm` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Users (Minimal enterprise info: identity, auth, department/team attribution only)
CREATE TABLE `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `designation` VARCHAR(150) NOT NULL,
  `department_id` VARCHAR(64) NOT NULL,
  `department_name` VARCHAR(150) NOT NULL,
  `team_id` VARCHAR(64) NULL,
  `team_name` VARCHAR(150) NULL,
  `reporting_lead_id` VARCHAR(64) NULL,
  `reporting_lead_name` VARCHAR(150) NULL,
  `account_status` ENUM('Active', 'Pending Invitation', 'Expired Invitation', 'Inactive') NOT NULL DEFAULT 'Active',
  `invitation_sent_at` DATETIME NULL,
  `invitation_expires_at` DATETIME NULL,
  `card_permission_level` VARCHAR(50) NOT NULL DEFAULT 'none',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_dept` (`department_id`),
  CONSTRAINT `fk_users_dept` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- User Roles Junction
CREATE TABLE `user_roles` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `role_name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_user_role` (`user_id`, `role_name`),
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Activation & Password Reset Tokens
CREATE TABLE `activation_tokens` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL UNIQUE,
  `token_type` ENUM('invitation', 'magic_link', 'password_reset') NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` BOOLEAN NOT NULL DEFAULT FALSE,
  `used_at` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_tokens_user` (`user_id`),
  CONSTRAINT `fk_activation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- OTP Verifications
CREATE TABLE `otp_verifications` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `attempts` INT NOT NULL DEFAULT 0,
  `max_attempts` INT NOT NULL DEFAULT 3,
  `expires_at` DATETIME NOT NULL,
  `is_consumed` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_user` (`user_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. MASTER SERVICES CATALOGUE & VENDORS
-- ----------------------------------------------------------------------------

CREATE TABLE `service_categories` (
  `id` VARCHAR(64) PRIMARY KEY,
  `type` ENUM('Tool', 'Service') NOT NULL,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `subcategories_json` JSON NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `vendors` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `contact_person` VARCHAR(150),
  `email` VARCHAR(191),
  `phone` VARCHAR(50),
  `website` VARCHAR(255),
  `address` TEXT,
  `notes` TEXT,
  `status` ENUM('Active', 'Preferred', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `services` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `type` ENUM('Tool', 'Service') NOT NULL,
  `category` VARCHAR(150) NOT NULL,
  `subcategory` VARCHAR(150) NOT NULL,
  `provider` VARCHAR(200) NOT NULL,
  `website` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('Active', 'Under Review', 'Archived') NOT NULL DEFAULT 'Active',
  `created_by` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_services_category` (`category`),
  INDEX `idx_services_status` (`status`)
) ENGINE=InnoDB;

-- Service Plans / Licenses
CREATE TABLE `service_plans` (
  `id` VARCHAR(64) PRIMARY KEY,
  `service_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `tier` VARCHAR(100) NULL,
  `allocation_model` ENUM('single_user', 'multiple_user', 'seat_based', 'team_based', 'department_based', 'shared_internal') NOT NULL DEFAULT 'seat_based',
  `seat_limit` INT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `billing_cycle` VARCHAR(50) NOT NULL DEFAULT 'Monthly',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_plans_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. INDIVIDUAL SERVICE ACCOUNTS & CAPACITY ENFORCEMENT
-- ----------------------------------------------------------------------------

CREATE TABLE `service_accounts` (
  `id` VARCHAR(64) PRIMARY KEY,
  `service_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `account_email` VARCHAR(191) NOT NULL,
  `plan_name` VARCHAR(150) NOT NULL,
  `allocation_model` ENUM('single_user', 'multiple_user', 'seat_based', 'team_based', 'department_based', 'shared_internal') NOT NULL DEFAULT 'seat_based',
  `seat_limit` INT NULL,
  `allocated_seats` INT NOT NULL DEFAULT 0,
  `purchase_date` DATE NOT NULL,
  `purchase_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `billing_cycle` VARCHAR(50) NOT NULL DEFAULT 'Monthly',
  `next_renewal_date` DATE NULL,
  `renewal_amount` DECIMAL(12,2) NULL,
  `purchase_source` ENUM('Direct', 'Vendor') NOT NULL DEFAULT 'Direct',
  `vendor_id` VARCHAR(64) NULL,
  `vendor_name` VARCHAR(200) NULL,
  `payment_card_id` VARCHAR(64) NULL,
  `account_status` ENUM('Available', 'Assigned', 'Partially Assigned', 'Active', 'Suspended', 'Expired', 'Cancelled') NOT NULL DEFAULT 'Active',
  `payment_status` ENUM('Paid', 'Upcoming', 'Overdue', 'One-Time Settled') NOT NULL DEFAULT 'Paid',
  `assigned_user_id` VARCHAR(64) NULL,
  `assigned_user_name` VARCHAR(150) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_accounts_service` (`service_id`),
  INDEX `idx_accounts_status` (`account_status`),
  CONSTRAINT `fk_accounts_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. PREDEFINED REASONS, ACCESS REQUESTS & CENTRALIZED SHARING HUB
-- ----------------------------------------------------------------------------

CREATE TABLE `predefined_access_reasons` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `is_archived` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_reasons_enabled` (`is_enabled`, `display_order`)
) ENGINE=InnoDB;

CREATE TABLE `access_requests` (
  `id` VARCHAR(64) PRIMARY KEY,
  `request_number` VARCHAR(50) NOT NULL UNIQUE,
  `requester_id` VARCHAR(64) NOT NULL,
  `requester_name` VARCHAR(150) NOT NULL,
  `requester_email` VARCHAR(191) NOT NULL,
  `department_id` VARCHAR(64) NOT NULL,
  `department_name` VARCHAR(150) NOT NULL,
  `team_id` VARCHAR(64) NULL,
  `team_name` VARCHAR(150) NULL,
  `service_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `requested_access_type` VARCHAR(100) NOT NULL DEFAULT 'Standard Seat',
  `reason_id` VARCHAR(64) NULL,
  `reason` VARCHAR(255) NOT NULL,
  `additional_explanation` TEXT NULL,
  `duration` VARCHAR(100) NOT NULL DEFAULT 'Permanent',
  `status` ENUM('Pending', 'Under Review', 'Approved', 'Rejected', 'Fulfilled', 'Cancelled', 'Pending Approval', 'Returned for Modification', 'Revoked') NOT NULL DEFAULT 'Pending',
  `workflow_id` VARCHAR(64) NOT NULL,
  `current_stage_index` INT NOT NULL DEFAULT 0,
  `assigned_account_id` VARCHAR(64) NULL,
  `assigned_account_email` VARCHAR(191) NULL,
  `assigned_plan_name` VARCHAR(150) NULL,
  `access_granted_date` DATETIME NULL,
  `access_granted_by_id` VARCHAR(64) NULL,
  `access_granted_by_name` VARCHAR(150) NULL,
  `access_notes` TEXT NULL,
  `reviewed_by_id` VARCHAR(64) NULL,
  `reviewed_by_name` VARCHAR(150) NULL,
  `approval_date` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_accreq_status` (`status`),
  INDEX `idx_accreq_service` (`service_id`)
) ENGINE=InnoDB;

CREATE TABLE `account_access_assignments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `service_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `account_id` VARCHAR(64) NOT NULL,
  `account_email` VARCHAR(191) NOT NULL,
  `recipient_type` ENUM('employee', 'team', 'department') NOT NULL,
  `recipient_id` VARCHAR(64) NOT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_email` VARCHAR(191) NULL,
  `granted_by_id` VARCHAR(64) NOT NULL,
  `granted_by_name` VARCHAR(150) NOT NULL,
  `start_date` DATE NOT NULL,
  `expiration_date` DATE NOT NULL,
  `permission_level` ENUM('read', 'user', 'admin', 'full') NOT NULL DEFAULT 'user',
  `status` ENUM('Active', 'Revoked', 'Expired') NOT NULL DEFAULT 'Active',
  `provisioning_status` ENUM('Provisioned', 'Pending External Setup') NOT NULL DEFAULT 'Provisioned',
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_asgn_service` (`service_id`),
  INDEX `idx_asgn_account` (`account_id`),
  INDEX `idx_asgn_recipient` (`recipient_type`, `recipient_id`),
  INDEX `idx_asgn_expiry` (`expiration_date`),
  CONSTRAINT `fk_asgn_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_asgn_account` FOREIGN KEY (`account_id`) REFERENCES `service_accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `account_access_history` (
  `id` VARCHAR(64) PRIMARY KEY,
  `assignment_id` VARCHAR(64) NOT NULL,
  `service_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `account_id` VARCHAR(64) NOT NULL,
  `account_email` VARCHAR(191) NOT NULL,
  `recipient_id` VARCHAR(64) NOT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_type` ENUM('employee', 'team', 'department') NOT NULL DEFAULT 'employee',
  `action` ENUM('grant', 'edit', 'extend', 'revoke') NOT NULL,
  `previous_expiry_date` DATE NULL,
  `new_expiry_date` DATE NULL,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_name` VARCHAR(150) NOT NULL,
  `reason_or_notes` TEXT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_aah_asgn` (`assignment_id`),
  INDEX `idx_aah_account` (`account_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. APPROVAL WORKFLOWS & REQUISITIONS
-- ----------------------------------------------------------------------------

CREATE TABLE `approval_workflows` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `purpose` ENUM('Purchase Requisitions', 'Access-sharing requests') NOT NULL,
  `version` VARCHAR(20) NOT NULL DEFAULT '1.0',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `approval_workflow_stages` (
  `id` VARCHAR(64) PRIMARY KEY,
  `workflow_id` VARCHAR(64) NOT NULL,
  `stage_order` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `type` ENUM('organizational_role', 'specific_employee') NOT NULL,
  `role_name` VARCHAR(100) NULL,
  `employee_id` VARCHAR(64) NULL,
  `employee_name` VARCHAR(150) NULL,
  `is_required` BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT `fk_wf_stages` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `requisitions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `requisition_number` VARCHAR(50) NOT NULL UNIQUE,
  `requester_id` VARCHAR(64) NOT NULL,
  `requester_name` VARCHAR(150) NOT NULL,
  `requester_email` VARCHAR(191) NOT NULL,
  `department_id` VARCHAR(64) NOT NULL,
  `department_name` VARCHAR(150) NOT NULL,
  `team_id` VARCHAR(64) NULL,
  `team_name` VARCHAR(150) NULL,
  `service_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `service_type` ENUM('Tool', 'Service') NOT NULL,
  `category` VARCHAR(150) NOT NULL,
  `justification` TEXT NOT NULL,
  `billing_cycle` VARCHAR(50) NOT NULL DEFAULT 'Monthly',
  `estimated_amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `status` ENUM('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Returned for Modification', 'Purchased', 'Cancelled') NOT NULL DEFAULT 'Pending Approval',
  `workflow_id` VARCHAR(64) NOT NULL,
  `current_stage_index` INT NOT NULL DEFAULT 0,
  `preferred_vendor_id` VARCHAR(64) NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_reqs_status` (`status`),
  INDEX `idx_reqs_dept` (`department_id`)
) ENGINE=InnoDB;

CREATE TABLE `approval_actions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `requisition_id` VARCHAR(64) NOT NULL,
  `stage_index` INT NOT NULL,
  `stage_name` VARCHAR(150) NOT NULL,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_name` VARCHAR(150) NOT NULL,
  `action` ENUM('Approved', 'Rejected', 'Returned for Modification', 'Skipped') NOT NULL,
  `comments` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_actions_req` (`requisition_id`),
  CONSTRAINT `fk_actions_req` FOREIGN KEY (`requisition_id`) REFERENCES `requisitions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. PURCHASES & SUBSCRIPTIONS
-- ----------------------------------------------------------------------------

CREATE TABLE `purchases` (
  `id` VARCHAR(64) PRIMARY KEY,
  `requisition_id` VARCHAR(64) NOT NULL,
  `requisition_number` VARCHAR(50) NOT NULL,
  `service_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `account_email` VARCHAR(191) NOT NULL,
  `actual_plan` VARCHAR(150) NOT NULL,
  `actual_amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `billing_cycle` VARCHAR(50) NOT NULL DEFAULT 'Monthly',
  `purchase_date` DATE NOT NULL,
  `purchase_source` ENUM('Direct', 'Vendor') NOT NULL DEFAULT 'Direct',
  `provider_name` VARCHAR(200) NOT NULL,
  `vendor_id` VARCHAR(64) NULL,
  `payment_card_id` VARCHAR(64) NULL,
  `payment_reference` VARCHAR(150) NOT NULL,
  `invoice_file_name` VARCHAR(255) NULL,
  `invoice_file_url` VARCHAR(255) NULL,
  `next_renewal_date` DATE NULL,
  `renewal_amount` DECIMAL(12,2) NULL,
  `requested_amount` DECIMAL(12,2) NOT NULL,
  `difference_amount` DECIMAL(12,2) NOT NULL,
  `purchaser_id` VARCHAR(64) NOT NULL,
  `purchaser_name` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_purchases_date` (`purchase_date`),
  CONSTRAINT `fk_purchases_req` FOREIGN KEY (`requisition_id`) REFERENCES `requisitions` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE `subscriptions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `service_id` VARCHAR(64) NOT NULL,
  `service_name` VARCHAR(200) NOT NULL,
  `account_id` VARCHAR(64) NULL,
  `account_email` VARCHAR(191) NULL,
  `plan_name` VARCHAR(150) NOT NULL,
  `billing_cycle` VARCHAR(50) NOT NULL DEFAULT 'Monthly',
  `purchase_date` DATE NOT NULL,
  `start_date` DATE NOT NULL,
  `current_amount` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `next_renewal_date` DATE NULL,
  `expected_renewal_amount` DECIMAL(12,2) NULL,
  `auto_renewal` BOOLEAN NOT NULL DEFAULT TRUE,
  `status` ENUM('Active', 'Paused', 'Cancelled') NOT NULL DEFAULT 'Active',
  `last_payment_date` DATE NOT NULL,
  `payment_card_id` VARCHAR(64) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_subs_renewal` (`next_renewal_date`),
  INDEX `idx_subs_status` (`status`)
) ENGINE=InnoDB;

CREATE TABLE `subscription_renewals` (
  `id` VARCHAR(64) PRIMARY KEY,
  `subscription_id` VARCHAR(64) NOT NULL,
  `renewal_cycle` VARCHAR(50) NOT NULL,
  `renewal_date` DATE NOT NULL,
  `expected_amount` DECIMAL(12,2) NOT NULL,
  `status` ENUM('Upcoming', 'Processed', 'Skipped', 'Cancelled') NOT NULL DEFAULT 'Upcoming',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_renewals_date` (`renewal_date`),
  CONSTRAINT `fk_renewals_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `subscription_payments` (
  `id` VARCHAR(64) PRIMARY KEY,
  `subscription_id` VARCHAR(64) NOT NULL,
  `amount_paid` DECIMAL(12,2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `payment_date` DATE NOT NULL,
  `payment_reference` VARCHAR(150) NOT NULL,
  `payment_card_id` VARCHAR(64) NULL,
  `previous_renewal_date` DATE NULL,
  `new_renewal_date` DATE NOT NULL,
  `logged_by_id` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sub_payments_date` (`payment_date`),
  CONSTRAINT `fk_sub_payments_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. PAYMENT CARDS: STRICT PRESERVATION & OWNER-CONTROLLED GOVERNANCE
-- (Zero-PAN Compliant: No full card numbers, CVVs, or PINs)
-- ----------------------------------------------------------------------------

CREATE TABLE `payment_cards` (
  `id` VARCHAR(64) PRIMARY KEY,
  `card_name` VARCHAR(150) NOT NULL,
  `network` ENUM('Visa', 'Mastercard', 'American Express') NOT NULL,
  `bank_name` VARCHAR(150) NOT NULL,
  `holder_name` VARCHAR(150) NOT NULL,
  `last_four` CHAR(4) NOT NULL,
  `currency` ENUM('USD', 'BDT', 'EUR') NOT NULL DEFAULT 'USD',
  `expiry_month` CHAR(2) NOT NULL,
  `expiry_year` CHAR(4) NOT NULL,
  `status` ENUM('Active', 'Inactive', 'Frozen') NOT NULL DEFAULT 'Active',
  `owner_id` VARCHAR(64) NOT NULL,
  `owner_name` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cards_owner` (`owner_id`)
) ENGINE=InnoDB;

CREATE TABLE `card_visibility_permissions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `card_id` VARCHAR(64) NOT NULL,
  `card_name` VARCHAR(150) NOT NULL,
  `owner_id` VARCHAR(64) NOT NULL,
  `authorized_user_id` VARCHAR(64) NOT NULL,
  `authorized_user_name` VARCHAR(150) NOT NULL,
  `authorized_user_email` VARCHAR(191) NOT NULL,
  `status` ENUM('Active', 'Revoked') NOT NULL DEFAULT 'Active',
  `granted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` DATETIME NULL,
  UNIQUE KEY `uk_card_user` (`card_id`, `authorized_user_id`),
  CONSTRAINT `fk_cperm_card` FOREIGN KEY (`card_id`) REFERENCES `payment_cards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE `card_reveal_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `card_id` VARCHAR(64) NOT NULL,
  `card_name` VARCHAR(150) NOT NULL,
  `viewer_id` VARCHAR(64) NOT NULL,
  `viewer_name` VARCHAR(150) NOT NULL,
  `viewer_email` VARCHAR(191) NOT NULL,
  `action` ENUM('reveal_masked', 'visibility_granted', 'visibility_revoked', 'failed_password', 'unauthorized_attempt') NOT NULL,
  `result` ENUM('Success', 'Denied') NOT NULL,
  `notes` TEXT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_reveal_card` (`card_id`),
  INDEX `idx_reveal_user` (`viewer_id`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. EMAIL TEMPLATES & DISPATCH AUDIT LOGS
-- ----------------------------------------------------------------------------

CREATE TABLE `email_templates` (
  `id` VARCHAR(64) PRIMARY KEY,
  `template_key` VARCHAR(100) NOT NULL UNIQUE,
  `name` VARCHAR(200) NOT NULL,
  `category` ENUM('Security', 'Access', 'Procurement', 'Billing', 'Onboarding') NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` MEDIUMTEXT NOT NULL,
  `variables_json` JSON NOT NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE `email_delivery_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `template_key` VARCHAR(100) NOT NULL,
  `template_name` VARCHAR(200) NOT NULL,
  `recipient_email` VARCHAR(191) NOT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `status` ENUM('Sent', 'Failed', 'Queued') NOT NULL DEFAULT 'Sent',
  `attempt_count` INT NOT NULL DEFAULT 1,
  `provider_message_id` VARCHAR(150) NULL,
  `error` TEXT NULL,
  `dispatched_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email_recipient` (`recipient_email`)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. SYSTEM NOTIFICATIONS, AUDIT TRAIL & SYSTEM SETTINGS
-- ----------------------------------------------------------------------------

CREATE TABLE `notifications` (
  `id` VARCHAR(64) PRIMARY KEY,
  `recipient_id` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('requisition', 'approval', 'purchase', 'renewal', 'planning', 'card_security', 'access') NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `link_action_json` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_recipient` (`recipient_id`, `is_read`)
) ENGINE=InnoDB;

CREATE TABLE `audit_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `user_id` VARCHAR(64) NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(100) NOT NULL,
  `entity_id` VARCHAR(64) NOT NULL,
  `details` TEXT NOT NULL,
  `before_value` JSON NULL,
  `after_value` JSON NULL,
  INDEX `idx_audit_timestamp` (`timestamp`),
  INDEX `idx_audit_user` (`user_id`),
  INDEX `idx_audit_entity` (`entity`, `entity_id`)
) ENGINE=InnoDB;

CREATE TABLE `system_settings` (
  `setting_key` VARCHAR(100) PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- SEED DATA: 10 ROLES, 12 ACCESS REASONS & 5 INITIAL PRODUCTION USERS
-- ============================================================================

INSERT INTO `roles` (`id`, `name`, `description`, `is_system`) VALUES
('role-1', 'Super Admin', 'Complete system governance, role assignments, card security policies', TRUE),
('role-2', 'System Admin', 'Manage users, organization units, catalogue services & workflows', TRUE),
('role-3', 'Employee', 'Submit purchase requisitions and request tool access', TRUE),
('role-4', 'Team Lead', 'Review and approve first-stage team purchase & access requests', TRUE),
('role-5', 'Department Lead', 'Review and approve department-wide requisitions & access', TRUE),
('role-6', 'Operation Manager', 'Provide operational and budgetary purchase authorizations', TRUE),
('role-7', 'Purchaser', 'Complete approved requests, enter invoices, register accounts', TRUE),
('role-8', 'Finance', 'Financial records, payments, variance analysis and accounting', TRUE),
('role-9', 'Management', 'Summarized company expenditure and subscription overview', TRUE),
('role-10', 'Card Information Viewer', 'Strictly authorized viewer of masked card details and holder data', TRUE)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

INSERT INTO `predefined_access_reasons` (`id`, `name`, `description`, `display_order`, `is_enabled`, `is_archived`) VALUES
('rsn-1', 'Project Requirement', 'Direct tooling required for active client or internal project deliverables', 1, TRUE, FALSE),
('rsn-2', 'Client Requirement', 'Mandated tooling or cloud service specified in client SOW/contract', 2, TRUE, FALSE),
('rsn-3', 'Development Work', 'Software engineering, API integration, and coding environments', 3, TRUE, FALSE),
('rsn-4', 'Design Work', 'UI/UX interface, graphic assets, prototyping, and design systems', 4, TRUE, FALSE),
('rsn-5', 'Testing and QA', 'Automated test execution, quality assurance, and security scans', 5, TRUE, FALSE),
('rsn-6', 'Research and Development', 'Machine learning exploration, benchmarking, and prototyping', 6, TRUE, FALSE),
('rsn-7', 'Content Creation', 'Copywriting, documentation, media assets, and social collaterals', 7, TRUE, FALSE),
('rsn-8', 'Marketing Activities', 'Campaign analytics, SEO analysis, ads management, and outreach', 8, TRUE, FALSE),
('rsn-9', 'Team Collaboration', 'Cross-functional team coordination, shared knowledge base, and specs', 9, TRUE, FALSE),
('rsn-10', 'Department Requirement', 'Departmental standard tooling package for onboarding or operations', 10, TRUE, FALSE),
('rsn-11', 'Temporary Access', 'Short-term evaluation, sprint milestone, or time-boxed spike', 11, TRUE, FALSE),
('rsn-12', 'Other', 'Specific business requirement requiring written justification', 12, TRUE, FALSE)
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);
