-- db.sql for 'clearearth_erp' : schema + seed data. Import into an existing empty database:  mariadb clearearth_erp < db.sql
SET FOREIGN_KEY_CHECKS=0; SET NAMES utf8mb4;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `accounting_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_periods` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `fiscal_year_id` int(11) NOT NULL,
  `period_number` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `closed_by` int(11) DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ap_fy_period` (`tenant_id`,`fiscal_year_id`,`period_number`),
  KEY `fk_ap_fy` (`fiscal_year_id`),
  CONSTRAINT `fk_ap_fy` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `asset_custody`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `asset_custody` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `asset_name` varchar(200) NOT NULL,
  `asset_type` varchar(100) DEFAULT NULL COMMENT 'Laptop, Phone, Keys, Card, etc.',
  `asset_code` varchar(50) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `assigned_date` datetime NOT NULL,
  `return_date` datetime DEFAULT NULL,
  `is_returned` tinyint(1) DEFAULT 0,
  `condition_at_issue` text DEFAULT NULL,
  `condition_at_return` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `asset_custody_tenant_id` (`tenant_id`),
  KEY `asset_custody_employee_id` (`employee_id`),
  KEY `asset_custody_asset_code` (`asset_code`),
  KEY `asset_custody_is_returned` (`is_returned`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `attendance_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `check_in_time` datetime DEFAULT NULL,
  `check_out_time` datetime DEFAULT NULL,
  `check_in_source` enum('self','hr_manual') NOT NULL DEFAULT 'self',
  `check_out_source` enum('self','hr_manual') NOT NULL DEFAULT 'self',
  `status` enum('present','absent','half_day','late','on_leave','holiday','weekend') NOT NULL DEFAULT 'present',
  `work_hours` decimal(5,2) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `entered_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `check_in_lat` decimal(10,7) DEFAULT NULL,
  `check_in_lng` decimal(10,7) DEFAULT NULL,
  `check_out_lat` decimal(10,7) DEFAULT NULL,
  `check_out_lng` decimal(10,7) DEFAULT NULL,
  `check_in_ip` varchar(45) DEFAULT NULL,
  `check_out_ip` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_attendance_tenant_emp_date` (`tenant_id`,`employee_id`,`attendance_date`),
  KEY `idx_attendance_tenant` (`tenant_id`),
  KEY `idx_attendance_employee` (`employee_id`),
  KEY `idx_attendance_date` (`attendance_date`),
  KEY `fk_attendance_entered_by` (`entered_by`),
  CONSTRAINT `fk_attendance_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_attendance_entered_by` FOREIGN KEY (`entered_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_attendance_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `attendance_regularization_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_regularization_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `attendance_date` date NOT NULL,
  `requested_check_in` datetime DEFAULT NULL,
  `requested_check_out` datetime DEFAULT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_notes` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_arr_tenant` (`tenant_id`),
  KEY `idx_arr_employee` (`employee_id`),
  KEY `idx_arr_status` (`status`),
  KEY `fk_arr_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_arr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_arr_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_arr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `module` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL COMMENT 'CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.',
  `record_id` int(11) DEFAULT NULL COMMENT 'ID of the affected record',
  `old_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'State before change' CHECK (json_valid(`old_data`)),
  `new_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'State after change' CHECK (json_valid(`new_data`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `request_method` varchar(10) DEFAULT NULL,
  `request_url` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_tenant_id` (`tenant_id`),
  KEY `audit_logs_user_id` (`user_id`),
  KEY `audit_logs_module` (`module`),
  KEY `audit_logs_action` (`action`),
  KEY `audit_logs_record_id` (`record_id`),
  KEY `audit_logs_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_113` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `audit_logs_ibfk_114` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bank_reconciliation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_reconciliation_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `reconciliation_id` int(11) NOT NULL,
  `journal_entry_line_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_bri_tenant` (`tenant_id`),
  KEY `idx_bri_recon` (`reconciliation_id`),
  KEY `idx_bri_line` (`journal_entry_line_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `bank_reconciliations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_reconciliations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `statement_date` date NOT NULL,
  `statement_balance` decimal(15,2) NOT NULL,
  `opening_cleared_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `cleared_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `difference` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `notes` text DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_br_tenant` (`tenant_id`),
  KEY `idx_br_account` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `carbon_footprint_factors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `carbon_footprint_factors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `material_type_id` int(11) DEFAULT NULL,
  `co2_factor_per_ton` decimal(12,4) NOT NULL DEFAULT 50.0000,
  `liters_factor_per_ton` decimal(12,4) NOT NULL DEFAULT 100.0000,
  `kg_factor_per_ton` decimal(12,4) NOT NULL DEFAULT 500.0000,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cff_tenant` (`tenant_id`),
  KEY `fk_cff_material_type` (`material_type_id`),
  CONSTRAINT `fk_cff_material_type` FOREIGN KEY (`material_type_id`) REFERENCES `material_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cff_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cash_bank_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_bank_transfers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `transfer_number` varchar(30) NOT NULL,
  `transfer_date` date NOT NULL,
  `from_account_id` int(11) NOT NULL,
  `to_account_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cbt_number` (`tenant_id`,`transfer_number`),
  KEY `idx_cbt_tenant` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `certificate_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_id` int(11) NOT NULL,
  `sl_no` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `qty` decimal(15,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT 'nos',
  `manufacturer` varchar(100) DEFAULT NULL,
  `model_no` varchar(100) DEFAULT NULL,
  `serial_no` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ci_certificate` (`certificate_id`),
  CONSTRAINT `fk_ci_certificate` FOREIGN KEY (`certificate_id`) REFERENCES `certificates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `certificate_request_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_request_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_request_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` enum('grn_report','wds','destruction_photo','other') NOT NULL DEFAULT 'other',
  `photo_stage` enum('arrival','destruction_in_progress','other') DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `source_task_file_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cra_request` (`certificate_request_id`),
  CONSTRAINT `fk_cra_request` FOREIGN KEY (`certificate_request_id`) REFERENCES `certificate_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `certificate_request_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_request_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_request_id` int(11) NOT NULL,
  `type` enum('green_certificate','certificate_of_destruction','certificate_of_data_destruction','carbon_footprint','destruction_report_evidence') NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_crt_request` (`certificate_request_id`),
  CONSTRAINT `fk_crt_request` FOREIGN KEY (`certificate_request_id`) REFERENCES `certificate_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `certificate_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `grn_id` int(11) DEFAULT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `company_name` varchar(200) NOT NULL,
  `contact_person` varchar(150) NOT NULL,
  `contact_no` varchar(30) NOT NULL,
  `contact_email` varchar(150) NOT NULL,
  `collection_date` date NOT NULL,
  `collection_date_to` date DEFAULT NULL,
  `grn_no` varchar(50) DEFAULT NULL,
  `material_waste_details` text NOT NULL,
  `total_weight_quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `invoice_no` varchar(100) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `destruction_report_variant` enum('itemized_equipment','bulk_material') DEFAULT NULL,
  `wds_ref_no` varchar(100) DEFAULT NULL,
  `doc_ref` varchar(100) DEFAULT NULL,
  `req_no` varchar(100) DEFAULT NULL,
  `boe_no` varchar(100) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending_verification',
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `verification_notes` text DEFAULT NULL,
  `material_type_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `uom` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cr_tenant` (`tenant_id`),
  KEY `idx_cr_status` (`status`),
  KEY `idx_cr_grn` (`grn_id`),
  KEY `fk_cr_deal` (`deal_id`),
  KEY `fk_cr_requested_by` (`requested_by`),
  KEY `fk_cr_verified_by` (`verified_by`),
  KEY `fk_cr_material_type` (`material_type_id`),
  CONSTRAINT `fk_cr_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cr_grn` FOREIGN KEY (`grn_id`) REFERENCES `grns` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cr_material_type` FOREIGN KEY (`material_type_id`) REFERENCES `material_types` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cr_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cr_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cr_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `certificate_request_id` int(11) NOT NULL,
  `type` enum('green_certificate','certificate_of_destruction','certificate_of_data_destruction','carbon_footprint','destruction_report_evidence') NOT NULL,
  `certificate_number` varchar(60) NOT NULL,
  `issued_date` date DEFAULT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `generated_by` int(11) DEFAULT NULL,
  `co2_saved` decimal(15,2) DEFAULT NULL,
  `liters_saved` decimal(15,2) DEFAULT NULL,
  `kg_saved` decimal(15,2) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cert_tenant_number` (`tenant_id`,`certificate_number`),
  KEY `idx_cert_tenant` (`tenant_id`),
  KEY `fk_cert_request` (`certificate_request_id`),
  KEY `fk_cert_generated_by` (`generated_by`),
  CONSTRAINT `fk_cert_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cert_request` FOREIGN KEY (`certificate_request_id`) REFERENCES `certificate_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cert_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `chart_of_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `chart_of_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` varchar(20) NOT NULL,
  `sub_type` varchar(40) DEFAULT NULL,
  `normal_balance` varchar(6) NOT NULL,
  `is_group` tinyint(1) NOT NULL DEFAULT 0,
  `parent_id` int(11) DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coa_tenant_code` (`tenant_id`,`code`),
  KEY `idx_coa_tenant` (`tenant_id`),
  KEY `idx_coa_type` (`type`),
  KEY `fk_coa_parent` (`parent_id`),
  CONSTRAINT `fk_coa_parent` FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `fk_coa_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `commission_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `commission_percentage` decimal(5,2) NOT NULL,
  `effective_from` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cs_tenant` (`tenant_id`),
  KEY `idx_cs_user` (`user_id`),
  KEY `idx_cs_active` (`is_active`),
  KEY `fk_commission_settings_created_by` (`created_by`),
  CONSTRAINT `fk_commission_settings_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_commission_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `commissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `quotation_amount` decimal(15,2) NOT NULL,
  `commission_percentage` decimal(5,2) NOT NULL,
  `commission_amount` decimal(15,2) NOT NULL,
  `status` enum('accrued','paid','in_payroll') NOT NULL DEFAULT 'accrued',
  `payslip_id` int(11) DEFAULT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_commission_tenant_quotation` (`tenant_id`,`quotation_id`),
  KEY `idx_comm_tenant` (`tenant_id`),
  KEY `idx_comm_user` (`user_id`),
  KEY `idx_comm_status` (`status`),
  KEY `fk_commissions_quotation` (`quotation_id`),
  CONSTRAINT `fk_commissions_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`),
  CONSTRAINT `fk_commissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `company_code` varchar(50) DEFAULT NULL,
  `company_name` varchar(200) NOT NULL,
  `primary_contact_id` int(11) DEFAULT NULL,
  `industry_type` varchar(150) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `industry_type_id` int(11) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'UAE',
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `type` enum('individual','organization') DEFAULT 'organization',
  `created_by` int(11) DEFAULT NULL,
  `vat_number` varchar(50) DEFAULT NULL,
  `trade_license_file_path` varchar(500) DEFAULT NULL,
  `trade_license_number` varchar(100) DEFAULT NULL,
  `trade_license_name` varchar(255) DEFAULT NULL,
  `trade_license_expiry_date` date DEFAULT NULL,
  `vat_certificate_file_path` varchar(500) DEFAULT NULL,
  `vat_certificate_trn` varchar(50) DEFAULT NULL,
  `bank_details_file_path` varchar(500) DEFAULT NULL,
  `bank_name` varchar(200) DEFAULT NULL,
  `bank_iban` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_code` (`company_code`),
  UNIQUE KEY `companies_company_code` (`company_code`),
  UNIQUE KEY `company_code_2` (`company_code`),
  UNIQUE KEY `company_code_3` (`company_code`),
  UNIQUE KEY `company_code_4` (`company_code`),
  UNIQUE KEY `company_code_5` (`company_code`),
  UNIQUE KEY `company_code_6` (`company_code`),
  UNIQUE KEY `company_code_7` (`company_code`),
  UNIQUE KEY `company_code_8` (`company_code`),
  UNIQUE KEY `company_code_9` (`company_code`),
  UNIQUE KEY `company_code_10` (`company_code`),
  UNIQUE KEY `company_code_11` (`company_code`),
  UNIQUE KEY `company_code_12` (`company_code`),
  UNIQUE KEY `company_code_13` (`company_code`),
  UNIQUE KEY `company_code_14` (`company_code`),
  UNIQUE KEY `company_code_15` (`company_code`),
  UNIQUE KEY `company_code_16` (`company_code`),
  UNIQUE KEY `company_code_17` (`company_code`),
  UNIQUE KEY `company_code_18` (`company_code`),
  UNIQUE KEY `company_code_19` (`company_code`),
  UNIQUE KEY `company_code_20` (`company_code`),
  KEY `companies_tenant_id` (`tenant_id`),
  KEY `companies_email` (`email`),
  KEY `companies_status` (`status`),
  KEY `primary_contact_id` (`primary_contact_id`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `company_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `contact_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL COMMENT 'e.g. Sales, Finance, HR, Operations',
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_contacts_company_id_contact_id_unique` (`company_id`,`contact_id`),
  UNIQUE KEY `company_contacts_company_id_contact_id` (`company_id`,`contact_id`),
  KEY `company_contacts_company_id` (`company_id`),
  KEY `company_contacts_contact_id` (`contact_id`)
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `contact_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `contact_code` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `contact_type` enum('clients','vendors','both') DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `designation` varchar(150) DEFAULT NULL COMMENT 'Job title or designation',
  `company_id` int(11) DEFAULT NULL COMMENT 'Optional company association',
  `designation_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contact_code` (`contact_code`),
  UNIQUE KEY `contacts_contact_code` (`contact_code`),
  UNIQUE KEY `contact_code_2` (`contact_code`),
  UNIQUE KEY `contact_code_3` (`contact_code`),
  UNIQUE KEY `contact_code_4` (`contact_code`),
  UNIQUE KEY `contact_code_5` (`contact_code`),
  UNIQUE KEY `contact_code_6` (`contact_code`),
  UNIQUE KEY `contact_code_7` (`contact_code`),
  UNIQUE KEY `contact_code_8` (`contact_code`),
  UNIQUE KEY `contact_code_9` (`contact_code`),
  UNIQUE KEY `contact_code_10` (`contact_code`),
  UNIQUE KEY `contact_code_11` (`contact_code`),
  UNIQUE KEY `contact_code_12` (`contact_code`),
  UNIQUE KEY `contact_code_13` (`contact_code`),
  UNIQUE KEY `contact_code_14` (`contact_code`),
  UNIQUE KEY `contact_code_15` (`contact_code`),
  UNIQUE KEY `contact_code_16` (`contact_code`),
  UNIQUE KEY `contact_code_17` (`contact_code`),
  UNIQUE KEY `contact_code_18` (`contact_code`),
  UNIQUE KEY `contact_code_19` (`contact_code`),
  UNIQUE KEY `contact_code_20` (`contact_code`),
  KEY `contacts_tenant_id` (`tenant_id`),
  KEY `contacts_email` (`email`),
  KEY `contacts_status` (`status`),
  KEY `company_id` (`company_id`),
  KEY `idx_supplier_id` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=150 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `countries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `credit_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `credit_note_number` varchar(30) NOT NULL,
  `tax_invoice_id` int(11) NOT NULL,
  `credit_date` date NOT NULL,
  `reason` varchar(100) NOT NULL,
  `notes` text DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `vat_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `refund_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `refund_account_id` int(11) DEFAULT NULL,
  `refund_method` varchar(100) DEFAULT NULL,
  `refund_reference` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_credit_notes_number` (`tenant_id`,`credit_note_number`),
  KEY `idx_credit_notes_tenant` (`tenant_id`),
  KEY `idx_credit_notes_invoice` (`tax_invoice_id`),
  CONSTRAINT `fk_credit_notes_invoice` FOREIGN KEY (`tax_invoice_id`) REFERENCES `tax_invoices` (`id`),
  CONSTRAINT `fk_credit_notes_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_inspection_location_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_inspection_location_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  `inspection_request_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_dilt_request` (`inspection_request_id`),
  KEY `idx_dilt_tenant` (`tenant_id`),
  CONSTRAINT `fk_dilt_inspection_request` FOREIGN KEY (`inspection_request_id`) REFERENCES `deal_inspection_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_inspection_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_inspection_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `inspection_datetime` datetime DEFAULT NULL,
  `approximate_weight` decimal(15,2) DEFAULT NULL,
  `weight_uom` varchar(20) DEFAULT NULL,
  `cargo_type` varchar(50) DEFAULT NULL,
  `transportation_arrangement` varchar(50) DEFAULT NULL,
  `approximate_value` decimal(15,2) DEFAULT NULL,
  `images` text DEFAULT NULL,
  `inspector_id` int(11) DEFAULT NULL,
  `approved_by_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `cargo_packing_type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_inspection_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_inspection_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `material_type_id` int(11) DEFAULT NULL,
  `quantity` varchar(100) DEFAULT NULL,
  `safety_tools_required` tinyint(1) DEFAULT 0,
  `supporting_documents` text DEFAULT NULL,
  `requested_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `gate_pass_requirement` varchar(10) DEFAULT NULL,
  `service_type` varchar(50) DEFAULT NULL,
  `location_type` varchar(50) DEFAULT NULL,
  `quantity_uom` varchar(50) DEFAULT NULL,
  `lumpsum_price` decimal(15,2) DEFAULT NULL,
  `safety_tools` text DEFAULT NULL COMMENT 'JSON array of selected safety tool keys',
  `status` enum('request_submitted','team_assigned','inspection_completed','report_submitted') NOT NULL DEFAULT 'request_submitted',
  `deleted_at` datetime DEFAULT NULL,
  `priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
  `response_status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `responded_by` int(11) DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  `preferred_inspection_date` date DEFAULT NULL COMMENT 'Preferred date for inspection requested at submission time',
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `fk_insp_responded_by` (`responded_by`),
  CONSTRAINT `fk_insp_responded_by` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `product_service_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(15,2) NOT NULL COMMENT 'Price per unit at time of deal',
  `line_total` decimal(15,2) NOT NULL COMMENT 'quantity * unit_price',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `unit_of_measure` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `deal_items_deal_id` (`deal_id`),
  KEY `deal_items_product_service_id` (`product_service_id`),
  CONSTRAINT `fk_deal_items_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=570 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_location_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_location_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  `deal_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_deal_location_tokens_token` (`token`),
  KEY `idx_deal_location_tokens_deal` (`deal_id`),
  CONSTRAINT `fk_deal_location_tokens_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_stages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `deal_id` int(11) NOT NULL,
  `stage_name` enum('sales','operations','finance','logistics','warehouse','completed') NOT NULL,
  `department` varchar(50) DEFAULT NULL,
  `handler_user_id` int(11) DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  KEY `deal_id` (`deal_id`),
  KEY `handler_user_id` (`handler_user_id`),
  CONSTRAINT `deal_stages_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `deal_stages_ibfk_2` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `deal_stages_ibfk_3` FOREIGN KEY (`handler_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=997 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `terms_and_conditions_id` int(11) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_terms_id` (`terms_and_conditions_id`)
) ENGINE=InnoDB AUTO_INCREMENT=947 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_wds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_wds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `ref_no` varchar(100) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `license_no` varchar(100) DEFAULT NULL,
  `waste_description` text DEFAULT NULL,
  `source_process` text DEFAULT NULL,
  `package_type` varchar(100) DEFAULT NULL,
  `quantity_per_package` varchar(100) DEFAULT NULL,
  `total_weight` varchar(100) DEFAULT NULL,
  `container_no` varchar(100) DEFAULT NULL,
  `purpose` text DEFAULT NULL,
  `bl_no` varchar(100) DEFAULT NULL,
  `bor_no` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_ref_no` (`ref_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deal_wds_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deal_wds_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_wds_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_wds_id` (`deal_wds_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `deals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `deal_number` varchar(50) DEFAULT NULL COMMENT 'Auto-generated deal reference number',
  `lead_id` int(11) DEFAULT NULL COMMENT 'Optional link to originating lead',
  `company_id` int(11) DEFAULT NULL COMMENT 'Client company',
  `contact_id` int(11) DEFAULT NULL COMMENT 'Client contact person',
  `supplier_id` int(11) DEFAULT NULL COMMENT 'Supplier involved in deal',
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `deal_date` datetime NOT NULL COMMENT 'Date of the deal',
  `subtotal` decimal(15,2) DEFAULT 0.00 COMMENT 'Sum of all line items before VAT',
  `vat_percentage` decimal(5,2) DEFAULT 5.00 COMMENT 'VAT percentage (e.g., 5% in UAE)',
  `vat_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Calculated VAT amount',
  `total` decimal(15,2) DEFAULT 0.00 COMMENT 'Total amount including VAT',
  `currency` varchar(10) DEFAULT 'AED',
  `status` enum('new','pending_approval','approved','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new',
  `payment_status` enum('unpaid','partial','paid') DEFAULT 'unpaid',
  `service_payment_status` varchar(30) DEFAULT NULL,
  `paid_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Total amount paid so far',
  `assigned_to` int(11) DEFAULT NULL COMMENT 'User responsible for this deal',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `terms_and_conditions_id` int(11) DEFAULT NULL,
  `deal_type` enum('offer_to_charge','offer_to_purchase','free_of_charge') NOT NULL DEFAULT 'offer_to_charge',
  `container_type` enum('LCL','FCL') DEFAULT NULL,
  `location_type` enum('Main Land','Free Zone') DEFAULT NULL,
  `wds_required` tinyint(1) DEFAULT 0,
  `inspection_required` tinyint(1) DEFAULT 0,
  `custom_inspection` tinyint(1) DEFAULT 0,
  `trakhees_inspection` tinyint(1) DEFAULT 0,
  `dubai_municipality_inspection` tinyint(1) DEFAULT 0,
  `downstream_partner_supplier_id` int(11) DEFAULT NULL,
  `loss_reason` text DEFAULT NULL,
  `is_rcm_applicable` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Reverse Charge Mechanism: VAT paid to government by buyer, excluded from purchase documents',
  `pickup_location` varchar(500) DEFAULT NULL,
  `pickup_contact_name` varchar(255) DEFAULT NULL,
  `pickup_contact_number` varchar(50) DEFAULT NULL,
  `approval_requested_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `certificate_required` tinyint(1) NOT NULL DEFAULT 0,
  `required_certificate_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`required_certificate_types`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `deal_number` (`deal_number`),
  UNIQUE KEY `deals_deal_number` (`deal_number`),
  KEY `contact_id` (`contact_id`),
  KEY `deals_tenant_id` (`tenant_id`),
  KEY `deals_lead_id` (`lead_id`),
  KEY `deals_company_id` (`company_id`),
  KEY `deals_supplier_id` (`supplier_id`),
  KEY `deals_status` (`status`),
  KEY `deals_payment_status` (`payment_status`),
  KEY `deals_assigned_to` (`assigned_to`),
  KEY `deals_terms_and_conditions_id` (`terms_and_conditions_id`),
  KEY `idx_downstream_partner_supplier` (`downstream_partner_supplier_id`),
  CONSTRAINT `deals_terms_and_conditions_id_foreign_idx` FOREIGN KEY (`terms_and_conditions_id`) REFERENCES `terms_and_conditions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=153 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `head_employee_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_departments_tenant_name` (`tenant_id`,`name`),
  KEY `idx_departments_tenant` (`tenant_id`),
  KEY `idx_departments_parent` (`parent_id`),
  KEY `fk_departments_head_employee` (`head_employee_id`),
  CONSTRAINT `fk_departments_head_employee` FOREIGN KEY (`head_employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_departments_parent` FOREIGN KEY (`parent_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_departments_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `level` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`),
  KEY `fk_designations_department` (`department_id`),
  CONSTRAINT `fk_designations_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dt_tenant` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_assets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `asset_type` varchar(100) DEFAULT NULL,
  `asset_name` varchar(150) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `assigned_date` date DEFAULT NULL,
  `condition_notes` text DEFAULT NULL,
  `status` enum('assigned','returned') NOT NULL DEFAULT 'assigned',
  `returned_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ea_tenant` (`tenant_id`),
  KEY `idx_ea_employee` (`employee_id`),
  KEY `idx_ea_status` (`status`),
  CONSTRAINT `fk_ea_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_certifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_certifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `issuer` varchar(150) DEFAULT NULL,
  `certificate_number` varchar(100) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ec_tenant` (`tenant_id`),
  KEY `idx_ec_employee` (`employee_id`),
  CONSTRAINT `fk_ec_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_dependents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_dependents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `id_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ed_tenant` (`tenant_id`),
  KEY `idx_ed_employee` (`employee_id`),
  CONSTRAINT `fk_ed_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `document_type_id` int(11) DEFAULT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_path_back` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_edoc_tenant` (`tenant_id`),
  KEY `idx_edoc_employee` (`employee_id`),
  KEY `fk_edoc_document_type` (`document_type_id`),
  CONSTRAINT `fk_edoc_document_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`id`),
  CONSTRAINT `fk_edoc_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_emergency_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_emergency_contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `name` varchar(150) DEFAULT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eec_tenant` (`tenant_id`),
  KEY `idx_eec_employee` (`employee_id`),
  CONSTRAINT `fk_eec_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `event_type` enum('joined','department_change','designation_change','manager_change','status_change','salary_change','promotion','transfer','other') NOT NULL,
  `field_name` varchar(50) DEFAULT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `effective_date` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eh_tenant` (`tenant_id`),
  KEY `idx_eh_employee` (`employee_id`),
  KEY `fk_eh_recorded_by` (`recorded_by`),
  CONSTRAINT `fk_eh_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eh_recorded_by` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `note_text` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_en_tenant` (`tenant_id`),
  KEY `idx_en_employee` (`employee_id`),
  KEY `fk_en_created_by` (`created_by`),
  CONSTRAINT `fk_en_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_en_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_previous_employment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_previous_employment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `company_name` varchar(150) DEFAULT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reason_for_leaving` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_epe_tenant` (`tenant_id`),
  KEY `idx_epe_employee` (`employee_id`),
  CONSTRAINT `fk_epe_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_qualifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `degree` varchar(150) DEFAULT NULL,
  `institution` varchar(150) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_eq_tenant` (`tenant_id`),
  KEY `idx_eq_employee` (`employee_id`),
  CONSTRAINT `fk_eq_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_salary_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary_structures` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `housing_allowance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `transport_allowance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `other_allowance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `commission_eligible` tinyint(1) NOT NULL DEFAULT 0,
  `payment_method` enum('bank_transfer','cash','cheque') NOT NULL DEFAULT 'bank_transfer',
  `currency` varchar(3) NOT NULL DEFAULT 'AED',
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ess_tenant` (`tenant_id`),
  KEY `idx_ess_employee` (`employee_id`),
  KEY `idx_ess_active` (`is_active`),
  KEY `fk_ess_created_by` (`created_by`),
  CONSTRAINT `fk_ess_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_ess_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_ess_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employee_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_skills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `skill_name` varchar(100) DEFAULT NULL,
  `proficiency_level` enum('beginner','intermediate','advanced','expert') DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_es_tenant` (`tenant_id`),
  KEY `idx_es_employee` (`employee_id`),
  CONSTRAINT `fk_es_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `employee_code` varchar(30) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `designation_id` int(11) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `employment_type` enum('full_time','part_time','contract','intern') NOT NULL DEFAULT 'full_time',
  `date_of_joining` date NOT NULL,
  `date_of_exit` date DEFAULT NULL,
  `employment_status` enum('onboarding','active','on_leave','suspended','exited') NOT NULL DEFAULT 'onboarding',
  `gender` enum('male','female','other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `nationality` varchar(60) DEFAULT NULL,
  `national_id` varchar(60) DEFAULT NULL,
  `passport_number` varchar(60) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact_name` varchar(150) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(60) DEFAULT NULL,
  `bank_iban` varchar(60) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `profile_photo` varchar(500) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `preferred_name` varchar(100) DEFAULT NULL,
  `legal_full_name` varchar(255) DEFAULT NULL,
  `marital_status` enum('single','married','divorced','widowed') DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `personal_email` varchar(150) DEFAULT NULL,
  `work_email` varchar(150) DEFAULT NULL,
  `personal_phone` varchar(20) DEFAULT NULL,
  `work_phone` varchar(20) DEFAULT NULL,
  `current_address_line1` varchar(255) DEFAULT NULL,
  `current_address_city` varchar(100) DEFAULT NULL,
  `current_address_emirate` varchar(100) DEFAULT NULL,
  `current_address_country` varchar(100) DEFAULT NULL,
  `current_address_postal` varchar(20) DEFAULT NULL,
  `permanent_address_line1` varchar(255) DEFAULT NULL,
  `permanent_address_city` varchar(100) DEFAULT NULL,
  `permanent_address_emirate` varchar(100) DEFAULT NULL,
  `permanent_address_country` varchar(100) DEFAULT NULL,
  `permanent_address_postal` varchar(20) DEFAULT NULL,
  `work_location_id` int(11) DEFAULT NULL,
  `probation_start` date DEFAULT NULL,
  `probation_end` date DEFAULT NULL,
  `confirmation_date` date DEFAULT NULL,
  `labour_card_no` varchar(50) DEFAULT NULL,
  `mol_person_id` varchar(50) DEFAULT NULL,
  `wps_person_code` varchar(50) DEFAULT NULL,
  `tax_id` varchar(50) DEFAULT NULL,
  `payment_method_detail` varchar(50) DEFAULT NULL,
  `routing_code` varchar(50) DEFAULT NULL,
  `salary_visible_to_employee` tinyint(1) DEFAULT 1,
  `passport_issue_date` date DEFAULT NULL,
  `passport_expiry_date` date DEFAULT NULL,
  `emirates_id_number` varchar(60) DEFAULT NULL,
  `emirates_id_issue_date` date DEFAULT NULL,
  `emirates_id_expiry_date` date DEFAULT NULL,
  `visa_number` varchar(60) DEFAULT NULL,
  `visa_issue_date` date DEFAULT NULL,
  `visa_expiry_date` date DEFAULT NULL,
  `labour_card_issue_date` date DEFAULT NULL,
  `labour_card_expiry_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_employees_tenant_code` (`tenant_id`,`employee_code`),
  KEY `idx_employees_tenant` (`tenant_id`),
  KEY `idx_employees_department` (`department_id`),
  KEY `idx_employees_designation` (`designation_id`),
  KEY `idx_employees_manager` (`manager_id`),
  KEY `idx_employees_user` (`user_id`),
  KEY `idx_employees_status` (`employment_status`),
  KEY `fk_employees_created_by` (`created_by`),
  KEY `fk_employees_work_location` (`work_location_id`),
  CONSTRAINT `fk_employees_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_employees_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `fk_employees_designation` FOREIGN KEY (`designation_id`) REFERENCES `designations` (`id`),
  CONSTRAINT `fk_employees_manager` FOREIGN KEY (`manager_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_employees_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_employees_work_location` FOREIGN KEY (`work_location_id`) REFERENCES `work_locations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `error_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `error_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status_code` int(11) NOT NULL,
  `error_name` varchar(100) DEFAULT NULL,
  `message` text NOT NULL,
  `stack` longtext DEFAULT NULL,
  `method` varchar(10) DEFAULT NULL,
  `url` varchar(500) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_error_logs_tenant` (`tenant_id`),
  KEY `idx_error_logs_user` (`user_id`),
  KEY `idx_error_logs_status` (`status_code`),
  KEY `idx_error_logs_created` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=336 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `value` varchar(100) NOT NULL COMMENT 'Slug stored on expenses.category',
  `display_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `default_account_id` int(11) DEFAULT NULL COMMENT 'Postable expense account debited by default for this category',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_expense_categories_tenant_value` (`tenant_id`,`value`),
  KEY `idx_expense_categories_tenant` (`tenant_id`),
  KEY `fk_expense_categories_account` (`default_account_id`),
  CONSTRAINT `fk_expense_categories_account` FOREIGN KEY (`default_account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `fk_expense_categories_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1359 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `work_order_task_expense_id` int(11) DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `expense_date` date NOT NULL,
  `paid_to` varchar(255) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `reference_id` varchar(255) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `payment_status` varchar(20) NOT NULL DEFAULT 'unpaid',
  `paid_amount` decimal(15,2) DEFAULT NULL,
  `paid_at` date DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `expense_account_id` int(11) DEFAULT NULL COMMENT 'Chart of accounts row debited by this expense; falls back to the category map when null',
  `net_amount` decimal(15,2) DEFAULT NULL COMMENT 'Amount before VAT (null on older rows: amount is the net)',
  `vat_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Recoverable input VAT posted to 1200',
  `vat_rate` decimal(5,2) DEFAULT NULL,
  `receipt_no` varchar(100) DEFAULT NULL,
  `supplier_trn` varchar(50) DEFAULT NULL,
  `attachment_path` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exp_task_line` (`work_order_task_expense_id`),
  KEY `idx_exp_tenant` (`tenant_id`),
  KEY `idx_exp_date` (`expense_date`),
  KEY `idx_exp_category` (`category`),
  KEY `fk_exp_user` (`created_by`),
  KEY `idx_exp_payment_status` (`payment_status`),
  KEY `fk_expenses_account` (`expense_account_id`),
  CONSTRAINT `fk_exp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_exp_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_exp_wote` FOREIGN KEY (`work_order_task_expense_id`) REFERENCES `work_order_task_expenses` (`id`),
  CONSTRAINT `fk_expenses_account` FOREIGN KEY (`expense_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `fiscal_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `fiscal_years` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fy_tenant` (`tenant_id`),
  CONSTRAINT `fk_fy_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `grn_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `grn_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `image_url` varchar(500) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `grn_item_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_grn_images_item` (`grn_item_id`),
  CONSTRAINT `fk_grn_images_item` FOREIGN KEY (`grn_item_id`) REFERENCES `grn_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `grn_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `grn_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grn_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `material_type_id` int(11) DEFAULT NULL,
  `quantity` decimal(15,2) NOT NULL DEFAULT 0.00,
  `unit_of_measure` varchar(20) DEFAULT 'kg',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `make` varchar(255) DEFAULT NULL,
  `model` varchar(255) DEFAULT NULL,
  `serial_number` varchar(255) DEFAULT NULL,
  `units` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_grn_items_grn` (`grn_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `grns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `grns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `grn_number` varchar(50) NOT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'new',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_grn_tenant` (`tenant_id`),
  KEY `idx_grn_number` (`grn_number`),
  KEY `idx_grn_wo` (`work_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `holiday_date` date NOT NULL,
  `is_recurring` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_holidays_tenant_date` (`tenant_id`,`holiday_date`),
  KEY `idx_holidays_tenant` (`tenant_id`),
  CONSTRAINT `fk_holidays_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=897 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `industry_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `industry_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `material_type_id` int(11) NOT NULL,
  `total_quantity` decimal(15,2) DEFAULT 0.00,
  `unit_of_measure` varchar(20) DEFAULT 'kg',
  `total_value` decimal(15,2) DEFAULT 0.00,
  `last_updated` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_tenant_id_warehouse_id_material_type_id` (`tenant_id`,`warehouse_id`,`material_type_id`),
  KEY `inventory_tenant_id` (`tenant_id`),
  KEY `inventory_warehouse_id` (`warehouse_id`),
  KEY `inventory_material_type_id` (`material_type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `journal_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `entry_number` varchar(30) NOT NULL,
  `entry_date` date NOT NULL,
  `description` varchar(500) NOT NULL,
  `source_type` varchar(40) NOT NULL,
  `source_id` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'posted',
  `auto_reverse` tinyint(1) NOT NULL DEFAULT 0,
  `reverse_date` date DEFAULT NULL,
  `reversed_by_id` int(11) DEFAULT NULL,
  `voided_at` datetime DEFAULT NULL,
  `voided_by` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `paid_to` varchar(255) DEFAULT NULL,
  `received_from` varchar(255) DEFAULT NULL,
  `reverses_entry_id` int(11) DEFAULT NULL COMMENT 'On a reversal entry: the original entry it reverses',
  `reversal_reason` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_je_tenant_number` (`tenant_id`,`entry_number`),
  KEY `idx_je_entry_date` (`entry_date`),
  KEY `idx_je_source` (`source_type`,`source_id`),
  KEY `idx_je_status` (`status`),
  KEY `fk_je_created_by` (`created_by`),
  CONSTRAINT `fk_je_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_je_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `journal_entry_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_entry_lines` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `journal_entry_id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `debit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `description` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_jel_je` (`journal_entry_id`),
  KEY `idx_jel_account` (`account_id`),
  CONSTRAINT `fk_jel_account` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `fk_jel_je` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=161 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `lead_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_sources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `lead_number` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL COMMENT 'Website, Referral, Cold Call, etc.',
  `service_interest` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`service_interest`)),
  `estimated_value` decimal(15,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `status` enum('new','contacted','pending_approval','qualified','disqualified','converted') NOT NULL DEFAULT 'new',
  `qualification_notes` text DEFAULT NULL,
  `disqualification_reason` text DEFAULT NULL,
  `converted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL COMMENT 'Link to company',
  `contact_id` int(11) DEFAULT NULL COMMENT 'Link to contact person',
  `lead_source_id` int(11) DEFAULT NULL,
  `service_type_id` int(11) DEFAULT NULL,
  `product_service_id` int(11) DEFAULT NULL COMMENT 'Link to product/service',
  `created_by` int(11) DEFAULT NULL,
  `approval_requested_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_number` (`lead_number`),
  UNIQUE KEY `leads_lead_number` (`lead_number`),
  UNIQUE KEY `lead_number_2` (`lead_number`),
  UNIQUE KEY `lead_number_3` (`lead_number`),
  UNIQUE KEY `lead_number_4` (`lead_number`),
  UNIQUE KEY `lead_number_5` (`lead_number`),
  UNIQUE KEY `lead_number_6` (`lead_number`),
  UNIQUE KEY `lead_number_7` (`lead_number`),
  UNIQUE KEY `lead_number_8` (`lead_number`),
  UNIQUE KEY `lead_number_9` (`lead_number`),
  UNIQUE KEY `lead_number_10` (`lead_number`),
  UNIQUE KEY `lead_number_11` (`lead_number`),
  UNIQUE KEY `lead_number_12` (`lead_number`),
  UNIQUE KEY `lead_number_13` (`lead_number`),
  UNIQUE KEY `lead_number_14` (`lead_number`),
  UNIQUE KEY `lead_number_15` (`lead_number`),
  UNIQUE KEY `lead_number_16` (`lead_number`),
  UNIQUE KEY `lead_number_17` (`lead_number`),
  UNIQUE KEY `lead_number_18` (`lead_number`),
  UNIQUE KEY `lead_number_19` (`lead_number`),
  UNIQUE KEY `lead_number_20` (`lead_number`),
  UNIQUE KEY `lead_number_21` (`lead_number`),
  UNIQUE KEY `lead_number_22` (`lead_number`),
  UNIQUE KEY `lead_number_23` (`lead_number`),
  UNIQUE KEY `lead_number_24` (`lead_number`),
  UNIQUE KEY `lead_number_25` (`lead_number`),
  UNIQUE KEY `lead_number_26` (`lead_number`),
  UNIQUE KEY `lead_number_27` (`lead_number`),
  UNIQUE KEY `lead_number_28` (`lead_number`),
  UNIQUE KEY `lead_number_29` (`lead_number`),
  UNIQUE KEY `lead_number_30` (`lead_number`),
  UNIQUE KEY `lead_number_31` (`lead_number`),
  UNIQUE KEY `lead_number_32` (`lead_number`),
  UNIQUE KEY `lead_number_33` (`lead_number`),
  UNIQUE KEY `lead_number_34` (`lead_number`),
  UNIQUE KEY `lead_number_35` (`lead_number`),
  UNIQUE KEY `lead_number_36` (`lead_number`),
  UNIQUE KEY `lead_number_37` (`lead_number`),
  UNIQUE KEY `lead_number_38` (`lead_number`),
  UNIQUE KEY `lead_number_39` (`lead_number`),
  UNIQUE KEY `lead_number_40` (`lead_number`),
  UNIQUE KEY `lead_number_41` (`lead_number`),
  UNIQUE KEY `lead_number_42` (`lead_number`),
  UNIQUE KEY `lead_number_43` (`lead_number`),
  UNIQUE KEY `lead_number_44` (`lead_number`),
  UNIQUE KEY `lead_number_45` (`lead_number`),
  UNIQUE KEY `lead_number_46` (`lead_number`),
  UNIQUE KEY `lead_number_47` (`lead_number`),
  UNIQUE KEY `lead_number_48` (`lead_number`),
  UNIQUE KEY `lead_number_49` (`lead_number`),
  UNIQUE KEY `lead_number_50` (`lead_number`),
  UNIQUE KEY `lead_number_51` (`lead_number`),
  UNIQUE KEY `lead_number_52` (`lead_number`),
  UNIQUE KEY `lead_number_53` (`lead_number`),
  UNIQUE KEY `lead_number_54` (`lead_number`),
  UNIQUE KEY `lead_number_55` (`lead_number`),
  UNIQUE KEY `lead_number_56` (`lead_number`),
  KEY `leads_tenant_id` (`tenant_id`),
  KEY `leads_assigned_to` (`assigned_to`),
  KEY `leads_status` (`status`),
  KEY `company_id` (`company_id`),
  KEY `contact_id` (`contact_id`),
  KEY `leads_product_service_id_foreign_idx` (`product_service_id`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `leave_balances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_balances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `entitled_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `accrued_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `used_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `carried_forward_days` decimal(6,2) NOT NULL DEFAULT 0.00,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_leave_balances` (`tenant_id`,`employee_id`,`leave_type_id`,`year`),
  KEY `idx_leave_balances_tenant` (`tenant_id`),
  KEY `idx_leave_balances_employee` (`employee_id`),
  KEY `fk_leave_balances_type` (`leave_type_id`),
  CONSTRAINT `fk_leave_balances_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_leave_balances_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_leave_balances_type` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `days_count` decimal(5,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_leave_requests_tenant` (`tenant_id`),
  KEY `idx_leave_requests_employee` (`employee_id`),
  KEY `idx_leave_requests_status` (`status`),
  KEY `fk_leave_requests_type` (`leave_type_id`),
  KEY `fk_leave_requests_approved_by` (`approved_by`),
  CONSTRAINT `fk_leave_requests_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_leave_requests_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_leave_requests_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_leave_requests_type` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `code` varchar(20) NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT 1,
  `default_annual_days` decimal(5,2) NOT NULL DEFAULT 0.00,
  `accrual_method` enum('annual_lump_sum','monthly_accrual','none') NOT NULL DEFAULT 'annual_lump_sum',
  `requires_approval` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_leave_types_tenant_code` (`tenant_id`,`code`),
  KEY `idx_leave_types_tenant` (`tenant_id`),
  CONSTRAINT `fk_leave_types_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `material_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=1483 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migration_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migration_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notif_tenant_user_read` (`tenant_id`,`user_id`,`is_read`),
  KEY `idx_notif_tenant_user_created` (`tenant_id`,`user_id`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=259 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `source_type` varchar(20) NOT NULL COMMENT 'receivable|payable|expense',
  `source_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_account_id` int(11) DEFAULT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `paid_to` varchar(255) DEFAULT NULL,
  `received_from` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `paid_at` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `journal_entry_id` int(11) DEFAULT NULL COMMENT 'Journal entry posted for this payment',
  `receipt_number` varchar(50) DEFAULT NULL COMMENT 'Customer-facing receipt number, assigned for receivable-side payments',
  `unapplied_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_tenant` (`tenant_id`),
  KEY `idx_source` (`source_type`,`source_id`),
  KEY `idx_paid_at` (`paid_at`),
  KEY `idx_payment_transactions_receipt_number` (`tenant_id`,`receipt_number`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payroll_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_runs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `period_month` tinyint(4) NOT NULL,
  `period_year` smallint(6) NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `status` enum('draft','processed','approved','paid','cancelled') NOT NULL DEFAULT 'draft',
  `total_gross` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_deductions` decimal(14,2) NOT NULL DEFAULT 0.00,
  `total_net` decimal(14,2) NOT NULL DEFAULT 0.00,
  `processed_by` int(11) DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payroll_runs_period` (`tenant_id`,`period_year`,`period_month`),
  KEY `idx_payroll_runs_tenant` (`tenant_id`),
  KEY `fk_payroll_runs_processed_by` (`processed_by`),
  KEY `fk_payroll_runs_approved_by` (`approved_by`),
  CONSTRAINT `fk_payroll_runs_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_payroll_runs_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_payroll_runs_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payslips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `payroll_run_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `basic_salary` decimal(12,2) NOT NULL,
  `housing_allowance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `transport_allowance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `other_allowance` decimal(12,2) NOT NULL DEFAULT 0.00,
  `commission_amount` decimal(12,2) NOT NULL DEFAULT 0.00,
  `gross_salary` decimal(12,2) NOT NULL,
  `days_in_month` smallint(6) NOT NULL,
  `paid_days` decimal(5,2) NOT NULL,
  `unpaid_leave_days` decimal(5,2) NOT NULL DEFAULT 0.00,
  `absent_days` decimal(5,2) NOT NULL DEFAULT 0.00,
  `proration_deduction` decimal(12,2) NOT NULL DEFAULT 0.00,
  `other_deductions` decimal(12,2) NOT NULL DEFAULT 0.00,
  `total_deductions` decimal(12,2) NOT NULL DEFAULT 0.00,
  `net_salary` decimal(12,2) NOT NULL,
  `payment_status` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `paid_at` datetime DEFAULT NULL,
  `payment_method` enum('bank_transfer','cash','cheque') DEFAULT NULL,
  `journal_entry_id_accrual` int(11) DEFAULT NULL,
  `journal_entry_id_payment` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payslips_run_employee` (`tenant_id`,`payroll_run_id`,`employee_id`),
  KEY `idx_payslips_tenant` (`tenant_id`),
  KEY `idx_payslips_employee` (`employee_id`),
  KEY `fk_payslips_run` (`payroll_run_id`),
  CONSTRAINT `fk_payslips_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`),
  CONSTRAINT `fk_payslips_run` FOREIGN KEY (`payroll_run_id`) REFERENCES `payroll_runs` (`id`),
  CONSTRAINT `fk_payslips_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'e.g., clients.create, deals.update, invoices.delete',
  `display_name` varchar(100) NOT NULL,
  `module` enum('users','roles','contacts','companies','suppliers','leads','products','deals','inspection_requests','inspection_reports','quotations','purchase_orders','accounting','reports','operations','grn','hr') NOT NULL,
  `action` enum('create','read','update','delete','approve','export','impersonate') NOT NULL,
  `description` text DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `permissions_name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `name_21` (`name`),
  UNIQUE KEY `name_22` (`name`),
  UNIQUE KEY `name_23` (`name`),
  UNIQUE KEY `name_24` (`name`),
  UNIQUE KEY `name_25` (`name`),
  UNIQUE KEY `name_26` (`name`),
  UNIQUE KEY `name_27` (`name`),
  UNIQUE KEY `name_28` (`name`),
  UNIQUE KEY `name_29` (`name`),
  UNIQUE KEY `name_30` (`name`),
  UNIQUE KEY `name_31` (`name`),
  UNIQUE KEY `name_32` (`name`),
  UNIQUE KEY `name_33` (`name`),
  UNIQUE KEY `name_34` (`name`),
  UNIQUE KEY `name_35` (`name`),
  UNIQUE KEY `name_36` (`name`),
  UNIQUE KEY `name_37` (`name`),
  UNIQUE KEY `name_38` (`name`),
  UNIQUE KEY `name_39` (`name`),
  UNIQUE KEY `name_40` (`name`),
  UNIQUE KEY `name_41` (`name`),
  UNIQUE KEY `name_42` (`name`),
  UNIQUE KEY `name_43` (`name`),
  UNIQUE KEY `name_44` (`name`),
  UNIQUE KEY `name_45` (`name`),
  UNIQUE KEY `name_46` (`name`),
  UNIQUE KEY `name_47` (`name`),
  UNIQUE KEY `name_48` (`name`),
  UNIQUE KEY `name_49` (`name`),
  UNIQUE KEY `name_50` (`name`),
  UNIQUE KEY `name_51` (`name`),
  UNIQUE KEY `name_52` (`name`),
  UNIQUE KEY `name_53` (`name`),
  UNIQUE KEY `name_54` (`name`),
  UNIQUE KEY `name_55` (`name`),
  UNIQUE KEY `name_56` (`name`),
  UNIQUE KEY `name_57` (`name`),
  UNIQUE KEY `name_58` (`name`),
  UNIQUE KEY `name_59` (`name`),
  KEY `permissions_module` (`module`),
  KEY `permissions_action` (`action`)
) ENGINE=InnoDB AUTO_INCREMENT=3566 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `products_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('product','service') NOT NULL DEFAULT 'product',
  `category` varchar(100) NOT NULL COMMENT 'Product or Service category',
  `description` text DEFAULT NULL,
  `unit_of_measure` varchar(50) DEFAULT NULL COMMENT 'kg, ton, piece, hour, etc.',
  `price` decimal(15,2) DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'AED',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `products_services_tenant_id` (`tenant_id`),
  KEY `products_services_category` (`category`),
  KEY `products_services_status` (`status`),
  KEY `products_services_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `profile_change_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile_change_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `field_group` varchar(50) DEFAULT NULL,
  `changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changes`)),
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pcr_tenant` (`tenant_id`),
  KEY `idx_pcr_employee` (`employee_id`),
  KEY `idx_pcr_status` (`status`),
  KEY `fk_pcr_reviewed_by` (`reviewed_by`),
  CONSTRAINT `fk_pcr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pcr_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `proforma_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proforma_invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `proforma_invoice_id` int(11) NOT NULL,
  `product_service_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(15,4) NOT NULL DEFAULT 1.0000,
  `unit_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `unit_of_measure` varchar(100) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pii_pi` (`proforma_invoice_id`),
  KEY `fk_pii_ps` (`product_service_id`),
  CONSTRAINT `fk_pii_pi` FOREIGN KEY (`proforma_invoice_id`) REFERENCES `proforma_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pii_ps` FOREIGN KEY (`product_service_id`) REFERENCES `products_services` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `proforma_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `proforma_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `quotation_id` int(11) NOT NULL,
  `deal_id` int(11) NOT NULL,
  `proforma_number` varchar(50) NOT NULL,
  `invoice_date` date NOT NULL,
  `currency` varchar(10) DEFAULT 'AED',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `vat_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `vat_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `remarks` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `due_date` date DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tenant_proforma_number` (`tenant_id`,`proforma_number`),
  KEY `idx_pi_tenant` (`tenant_id`),
  KEY `idx_pi_quotation` (`quotation_id`),
  KEY `idx_pi_deal` (`deal_id`),
  KEY `fk_pi_user` (`created_by`),
  CONSTRAINT `fk_pi_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`),
  CONSTRAINT `fk_pi_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`),
  CONSTRAINT `fk_pi_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_pi_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int(11) NOT NULL,
  `product_service_id` int(11) NOT NULL,
  `item_description` text DEFAULT NULL,
  `quantity` varchar(100) NOT NULL,
  `price` varchar(100) NOT NULL,
  `total` varchar(100) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `unit_of_measure` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_purchase_order_id` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `purchase_order_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=2082 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `purchase_order_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_order_terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int(11) NOT NULL,
  `terms_and_conditions_id` int(11) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_po_terms` (`purchase_order_id`,`terms_and_conditions_id`),
  KEY `idx_purchase_order_id` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=170 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `po_date` date NOT NULL,
  `expected_delivery` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'new',
  `company_id` int(11) DEFAULT NULL,
  `payment_status` varchar(20) NOT NULL DEFAULT 'unpaid',
  `paid_amount` decimal(15,2) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `document_type` varchar(20) NOT NULL DEFAULT 'quotation',
  `approval_requested_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `reference_number` int(11) DEFAULT NULL,
  `requested_pickup_date` date DEFAULT NULL COMMENT 'Pickup date sales requested when submitting this purchase quotation for approval',
  `pickup_date_status` varchar(30) DEFAULT NULL COMMENT 'none | pending | confirmed | reschedule_requested',
  `confirmed_pickup_date` date DEFAULT NULL,
  `pickup_reschedule_note` text DEFAULT NULL,
  `bill_flow` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = accrued at approval and settled via vendor bills; 0 = legacy (AP credited at approval)',
  `expense_account_id` int(11) DEFAULT NULL COMMENT 'Expense head debited when the PO is approved',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_po_status` (`status`),
  KEY `idx_po_company` (`company_id`),
  KEY `idx_po_payment` (`payment_status`),
  KEY `fk_po_work_order` (`work_order_id`),
  KEY `idx_po_created_by` (`created_by`),
  CONSTRAINT `fk_po_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=85 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quotation_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotation_statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=1889 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `deal_id` int(11) NOT NULL,
  `prepared_by` int(11) NOT NULL,
  `quotation_date` date NOT NULL,
  `quotation_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'AED',
  `status` varchar(50) NOT NULL DEFAULT 'new',
  `version` int(11) NOT NULL DEFAULT 1,
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `approval_requested_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reference_number` int(11) DEFAULT NULL,
  `requested_pickup_date` date DEFAULT NULL COMMENT 'Pickup date sales requested when submitting this quotation for approval',
  `pickup_date_status` varchar(30) DEFAULT NULL COMMENT 'none | pending | confirmed | reschedule_requested',
  `confirmed_pickup_date` date DEFAULT NULL,
  `pickup_reschedule_note` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_prepared_by` (`prepared_by`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=147 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_permission_id_role_id_unique` (`role_id`,`permission_id`),
  UNIQUE KEY `role_permissions_role_id_permission_id` (`role_id`,`permission_id`),
  KEY `role_permissions_role_id` (`role_id`),
  KEY `role_permissions_permission_id` (`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=137822 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL COMMENT 'Null for system roles, tenant_id for custom roles',
  `name` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system_role` tinyint(1) DEFAULT 0 COMMENT 'System roles cannot be deleted',
  `status` enum('active','inactive','pending','approved','rejected','deleted') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_tenant_id_name` (`tenant_id`,`name`),
  KEY `roles_tenant_id` (`tenant_id`),
  KEY `roles_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `service_interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_interests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `service_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `statuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `supplier_advance_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_advance_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `advance_id` int(11) NOT NULL,
  `vendor_bill_id` int(11) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `applied_at` date NOT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_saa_tenant` (`tenant_id`),
  KEY `idx_saa_advance` (`advance_id`),
  KEY `idx_saa_bill` (`vendor_bill_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `supplier_advances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_advances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `advance_number` varchar(30) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `advance_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `applied_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `payment_account_id` int(11) DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sadv_number` (`tenant_id`,`advance_number`),
  KEY `idx_sadv_tenant` (`tenant_id`),
  KEY `idx_sadv_supplier` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `supplier_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `supplier_id` int(11) NOT NULL,
  `contact_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL COMMENT 'e.g. Sales, Finance, HR, Operations',
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_contacts_supplier_id_contact_id_unique` (`supplier_id`,`contact_id`),
  UNIQUE KEY `supplier_contacts_supplier_id_contact_id` (`supplier_id`,`contact_id`),
  KEY `supplier_contacts_supplier_id` (`supplier_id`),
  KEY `supplier_contacts_contact_id` (`contact_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `supplier_debit_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_debit_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `debit_note_number` varchar(30) NOT NULL,
  `vendor_bill_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `note_date` date NOT NULL,
  `reason` varchar(100) NOT NULL,
  `notes` text DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `vat_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL,
  `credit_account_id` int(11) DEFAULT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sdn_number` (`tenant_id`,`debit_note_number`),
  KEY `idx_sdn_tenant` (`tenant_id`),
  KEY `idx_sdn_bill` (`vendor_bill_id`),
  KEY `idx_sdn_supplier` (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `supplier_code` varchar(50) DEFAULT NULL,
  `company_name` varchar(200) NOT NULL,
  `primary_contact_id` int(11) DEFAULT NULL,
  `industry_type` varchar(150) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `industry_type_id` int(11) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'UAE',
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `type` enum('individual','organization') DEFAULT 'organization',
  `vat_number` varchar(50) DEFAULT NULL,
  `trade_license_file_path` varchar(500) DEFAULT NULL,
  `trade_license_number` varchar(100) DEFAULT NULL,
  `trade_license_name` varchar(255) DEFAULT NULL,
  `trade_license_expiry_date` date DEFAULT NULL,
  `vat_certificate_file_path` varchar(500) DEFAULT NULL,
  `vat_certificate_trn` varchar(50) DEFAULT NULL,
  `bank_details_file_path` varchar(500) DEFAULT NULL,
  `bank_name` varchar(200) DEFAULT NULL,
  `bank_iban` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supplier_code` (`supplier_code`),
  UNIQUE KEY `suppliers_supplier_code` (`supplier_code`),
  UNIQUE KEY `supplier_code_2` (`supplier_code`),
  UNIQUE KEY `supplier_code_3` (`supplier_code`),
  UNIQUE KEY `supplier_code_4` (`supplier_code`),
  UNIQUE KEY `supplier_code_5` (`supplier_code`),
  UNIQUE KEY `supplier_code_6` (`supplier_code`),
  UNIQUE KEY `supplier_code_7` (`supplier_code`),
  UNIQUE KEY `supplier_code_8` (`supplier_code`),
  UNIQUE KEY `supplier_code_9` (`supplier_code`),
  UNIQUE KEY `supplier_code_10` (`supplier_code`),
  UNIQUE KEY `supplier_code_11` (`supplier_code`),
  UNIQUE KEY `supplier_code_12` (`supplier_code`),
  UNIQUE KEY `supplier_code_13` (`supplier_code`),
  UNIQUE KEY `supplier_code_14` (`supplier_code`),
  UNIQUE KEY `supplier_code_15` (`supplier_code`),
  UNIQUE KEY `supplier_code_16` (`supplier_code`),
  UNIQUE KEY `supplier_code_17` (`supplier_code`),
  UNIQUE KEY `supplier_code_18` (`supplier_code`),
  UNIQUE KEY `supplier_code_19` (`supplier_code`),
  UNIQUE KEY `supplier_code_20` (`supplier_code`),
  KEY `suppliers_tenant_id` (`tenant_id`),
  KEY `suppliers_email` (`email`),
  KEY `suppliers_status` (`status`),
  KEY `primary_contact_id` (`primary_contact_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tax_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tax_invoice_id` int(11) NOT NULL,
  `product_service_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(15,4) NOT NULL DEFAULT 1.0000,
  `unit_price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `line_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `unit_of_measure` varchar(100) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tii_ti` (`tax_invoice_id`),
  KEY `fk_tii_ps` (`product_service_id`),
  CONSTRAINT `fk_tii_ps` FOREIGN KEY (`product_service_id`) REFERENCES `products_services` (`id`),
  CONSTRAINT `fk_tii_ti` FOREIGN KEY (`tax_invoice_id`) REFERENCES `tax_invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tax_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tax_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `proforma_invoice_id` int(11) NOT NULL,
  `tax_invoice_number` varchar(50) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'AED',
  `subtotal` decimal(15,2) NOT NULL DEFAULT 0.00,
  `vat_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `vat_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `paid_amount` decimal(15,2) DEFAULT NULL,
  `payment_status` varchar(20) NOT NULL DEFAULT 'unpaid',
  `payment_method` varchar(255) DEFAULT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `attachment_path` varchar(500) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `credited_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total of credit notes issued against this invoice',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ti_proforma` (`proforma_invoice_id`),
  UNIQUE KEY `uk_tenant_tax_number` (`tenant_id`,`tax_invoice_number`),
  KEY `idx_ti_tenant` (`tenant_id`),
  KEY `idx_ti_payment` (`payment_status`),
  KEY `fk_ti_user` (`created_by`),
  CONSTRAINT `fk_ti_proforma` FOREIGN KEY (`proforma_invoice_id`) REFERENCES `proforma_invoices` (`id`),
  CONSTRAINT `fk_ti_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_ti_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'UAE',
  `trn_number` varchar(50) DEFAULT NULL COMMENT 'Tax Registration Number',
  `vat_registration_number` varchar(50) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','pending','approved','rejected','deleted') DEFAULT 'active',
  `subscription_plan` varchar(50) DEFAULT 'basic',
  `subscription_start_date` datetime DEFAULT NULL,
  `subscription_end_date` datetime DEFAULT NULL,
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tenant-specific settings and configurations' CHECK (json_valid(`settings`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `signature` varchar(255) DEFAULT NULL COMMENT 'Relative upload path to the authorised signature image, stamped onto quotations/POs',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `tenants_email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  KEY `tenants_status` (`status`),
  KEY `tenants_subscription_end_date` (`subscription_end_date`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `terms_and_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `terms_and_conditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `terms_and_conditions_tenant_id` (`tenant_id`),
  KEY `terms_and_conditions_status` (`status`),
  KEY `terms_and_conditions_is_default` (`is_default`),
  CONSTRAINT `terms_and_conditions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `uae_cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `uae_cities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `units_of_measure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `units_of_measure` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_push_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_push_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `platform` varchar(20) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_upt_token` (`token`),
  KEY `idx_upt_user` (`user_id`),
  CONSTRAINT `fk_upt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `employee_id` int(11) DEFAULT NULL COMMENT 'Link to employee record if user is an employee',
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','suspended','pending') DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `signature` varchar(255) DEFAULT NULL COMMENT 'Relative upload path to this user signature image, printed beside the stamp on documents they prepare',
  `designation` varchar(100) DEFAULT NULL COMMENT 'Optional job title/designation shown on documents',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_tenant_id_email` (`tenant_id`,`email`),
  UNIQUE KEY `users_tenant_id_username` (`tenant_id`,`username`),
  KEY `users_tenant_id` (`tenant_id`),
  KEY `users_role_id` (`role_id`),
  KEY `users_status` (`status`),
  KEY `users_employee_id` (`employee_id`),
  CONSTRAINT `fk_users_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vendor_bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendor_bills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `bill_number` varchar(30) NOT NULL,
  `purchase_order_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `supplier_invoice_no` varchar(100) NOT NULL,
  `supplier_trn` varchar(50) DEFAULT NULL,
  `bill_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `vat_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL,
  `paid_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `attachment_path` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `journal_entry_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expense_account_id` int(11) DEFAULT NULL COMMENT 'Expense account debited by a bill entered without a PO',
  `expense_id` int(11) DEFAULT NULL COMMENT 'Work order expense this bill clears (Dr 2200 / Cr 2000)',
  `debit_note_amount` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total of supplier debit notes against this bill',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vendor_bills_number` (`tenant_id`,`bill_number`),
  KEY `idx_vendor_bills_tenant` (`tenant_id`),
  KEY `idx_vendor_bills_po` (`purchase_order_id`),
  KEY `idx_vendor_bills_status` (`status`),
  CONSTRAINT `fk_vendor_bills_po` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_vendor_bills_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `geofence_radius_meters` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_wl_tenant` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_order_task_assignees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_task_assignees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_wota_task_user` (`task_id`,`user_id`),
  KEY `idx_wota_task` (`task_id`),
  KEY `idx_wota_user` (`user_id`),
  CONSTRAINT `fk_wota_task` FOREIGN KEY (`task_id`) REFERENCES `work_order_tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wota_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_order_task_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_task_expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_order_task_id` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `accounts_status` varchar(20) NOT NULL DEFAULT 'pending',
  `accounts_approved_at` datetime DEFAULT NULL,
  `accounts_approved_by` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `evidence_path` varchar(500) DEFAULT NULL,
  `evidence_file_name` varchar(255) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `paid_to` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_wote_task` (`work_order_task_id`),
  KEY `fk_wote_accounts_user` (`accounts_approved_by`),
  CONSTRAINT `fk_wote_accounts_user` FOREIGN KEY (`accounts_approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_wote_task` FOREIGN KEY (`work_order_task_id`) REFERENCES `work_order_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_order_task_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_task_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `image_url` varchar(500) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_wot_files_task` (`task_id`),
  CONSTRAINT `fk_wot_files_task` FOREIGN KEY (`task_id`) REFERENCES `work_order_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_order_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_order_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_order_id` int(11) NOT NULL,
  `type_of_work` varchar(255) DEFAULT NULL,
  `expense` decimal(15,2) DEFAULT NULL,
  `estimated_duration` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `work_type_id` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `pickup_quantity` varchar(100) DEFAULT NULL,
  `pickup_condition` varchar(100) DEFAULT NULL,
  `pickup_uom` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_work_order_tasks_wo` (`work_order_id`),
  KEY `idx_work_order_tasks_assigned` (`assigned_to`),
  KEY `idx_work_order_tasks_work_type` (`work_type_id`),
  CONSTRAINT `fk_work_order_tasks_work_type` FOREIGN KEY (`work_type_id`) REFERENCES `work_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `quotation_id` int(11) DEFAULT NULL COMMENT 'Service quotation this work order was created from',
  `purchase_order_id` int(11) DEFAULT NULL COMMENT 'Purchase order this work order was created from',
  `title` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('new','in_progress','completed','cancelled') NOT NULL DEFAULT 'new',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_orders_quotation` (`quotation_id`),
  UNIQUE KEY `uk_work_orders_purchase_order` (`purchase_order_id`),
  KEY `idx_work_orders_tenant` (`tenant_id`),
  KEY `idx_work_orders_deal` (`deal_id`),
  KEY `idx_work_orders_status` (`status`),
  CONSTRAINT `fk_work_orders_purchase_order` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `fk_work_orders_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `work_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_types_tenant_name` (`tenant_id`,`name`),
  KEY `idx_work_types_tenant` (`tenant_id`),
  CONSTRAINT `fk_work_types_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `accounting_periods` WRITE;
/*!40000 ALTER TABLE `accounting_periods` DISABLE KEYS */;
INSERT INTO `accounting_periods` (`id`, `tenant_id`, `fiscal_year_id`, `period_number`, `name`, `start_date`, `end_date`, `status`, `closed_by`, `closed_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,1,1,1,'Jan 2026','2026-01-01','2026-01-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(2,1,1,2,'Feb 2026','2026-02-01','2026-02-28','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(3,1,1,3,'Mar 2026','2026-03-01','2026-03-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(4,1,1,4,'Apr 2026','2026-04-01','2026-04-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(5,1,1,5,'May 2026','2026-05-01','2026-05-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(6,1,1,6,'Jun 2026','2026-06-01','2026-06-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(7,1,1,7,'Jul 2026','2026-07-01','2026-07-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(8,1,1,8,'Aug 2026','2026-08-01','2026-08-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(9,1,1,9,'Sep 2026','2026-09-01','2026-09-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(10,1,1,10,'Oct 2026','2026-10-01','2026-10-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(11,1,1,11,'Nov 2026','2026-11-01','2026-11-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(12,1,1,12,'Dec 2026','2026-12-01','2026-12-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(13,2,2,1,'Jan 2026','2026-01-01','2026-01-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(14,2,2,2,'Feb 2026','2026-02-01','2026-02-28','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(15,2,2,3,'Mar 2026','2026-03-01','2026-03-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(16,2,2,4,'Apr 2026','2026-04-01','2026-04-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(17,2,2,5,'May 2026','2026-05-01','2026-05-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(18,2,2,6,'Jun 2026','2026-06-01','2026-06-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(19,2,2,7,'Jul 2026','2026-07-01','2026-07-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(20,2,2,8,'Aug 2026','2026-08-01','2026-08-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(21,2,2,9,'Sep 2026','2026-09-01','2026-09-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(22,2,2,10,'Oct 2026','2026-10-01','2026-10-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-11 16:29:57',NULL),
(23,2,2,11,'Nov 2026','2026-11-01','2026-11-30','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-10 15:04:56',NULL),
(24,2,2,12,'Dec 2026','2026-12-01','2026-12-31','open',NULL,NULL,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL);
/*!40000 ALTER TABLE `accounting_periods` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `carbon_footprint_factors` WRITE;
/*!40000 ALTER TABLE `carbon_footprint_factors` DISABLE KEYS */;
INSERT INTO `carbon_footprint_factors` (`id`, `tenant_id`, `material_type_id`, `co2_factor_per_ton`, `liters_factor_per_ton`, `kg_factor_per_ton`, `created_at`, `updated_at`) VALUES (1,1,NULL,50.0000,100.0000,500.0000,'2026-10-02 00:17:58','2026-10-02 00:17:58'),
(2,2,NULL,50.0000,100.0000,500.0000,'2026-10-02 00:17:58','2026-10-02 00:17:58');
/*!40000 ALTER TABLE `carbon_footprint_factors` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `certificate_request_types` WRITE;
/*!40000 ALTER TABLE `certificate_request_types` DISABLE KEYS */;
INSERT INTO `certificate_request_types` (`id`, `certificate_request_id`, `type`, `created_at`, `updated_at`) VALUES (1,1,'green_certificate','2026-10-03 13:19:47','2026-10-03 13:19:47'),
(2,2,'certificate_of_destruction','2026-10-17 16:42:57','2026-10-17 16:42:57');
/*!40000 ALTER TABLE `certificate_request_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `chart_of_accounts` WRITE;
/*!40000 ALTER TABLE `chart_of_accounts` DISABLE KEYS */;
INSERT INTO `chart_of_accounts` (`id`, `tenant_id`, `code`, `name`, `type`, `sub_type`, `normal_balance`, `is_group`, `parent_id`, `is_system`, `is_active`, `description`, `sort_order`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,1,'1000','Cash and Cash Equivalents','asset','current_asset','debit',0,NULL,1,1,NULL,10,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(2,1,'1100','Accounts Receivable','asset','current_asset','debit',0,NULL,1,1,NULL,20,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(3,1,'1200','VAT Receivable (Input Tax)','asset','current_asset','debit',0,NULL,1,1,NULL,30,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(4,1,'1300','Prepaid Expenses','asset','current_asset','debit',0,NULL,1,1,NULL,40,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(5,1,'1510','Office Equipment — Cost','asset','fixed_asset','debit',0,NULL,1,1,NULL,50,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(6,1,'1520','Accumulated Depreciation','asset','fixed_asset','credit',0,NULL,1,1,NULL,60,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(7,1,'2000','Accounts Payable','liability','current_liability','credit',0,NULL,1,1,NULL,110,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(8,1,'2100','VAT Payable (Output Tax)','liability','current_liability','credit',0,NULL,1,1,NULL,120,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(9,1,'2200','Accrued Expenses','liability','current_liability','credit',0,NULL,1,1,NULL,130,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(10,1,'2300','Unearned Revenue','liability','current_liability','credit',0,NULL,1,1,NULL,140,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(11,1,'2500','Loans Payable','liability','long_term_liability','credit',0,NULL,1,1,NULL,150,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(12,1,'3000','Owner\'s Capital / Share Capital','equity','equity','credit',0,NULL,1,1,NULL,210,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(13,1,'3100','Retained Earnings','equity','equity','credit',0,NULL,1,1,NULL,220,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(14,1,'3200','Drawings','equity','equity','debit',0,NULL,1,1,NULL,230,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(15,1,'4000','Service Revenue','revenue','operating_revenue','credit',0,NULL,1,1,NULL,310,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(16,1,'4100','Other Income','revenue','other_income','credit',0,NULL,1,1,NULL,320,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(17,1,'5000','Cost of Services (Work Orders)','expense','cost_of_revenue','debit',0,NULL,1,1,NULL,410,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(18,1,'5100','General & Administrative Expenses','expense','operating_expense','debit',1,NULL,1,1,NULL,420,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(19,1,'5200','Materials & Equipment','expense','operating_expense','debit',1,NULL,1,1,NULL,430,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(20,1,'5300','Professional Services','expense','operating_expense','debit',1,NULL,1,1,NULL,440,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(21,1,'5400','Fuel & Transport','expense','operating_expense','debit',1,NULL,1,1,NULL,450,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(22,1,'5500','Utilities','expense','operating_expense','debit',0,NULL,1,1,NULL,460,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(23,1,'5600','Finance Charges','expense','finance_cost','debit',0,NULL,1,1,NULL,470,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(24,2,'1000','Cash and Cash Equivalents','asset','current_asset','debit',0,NULL,1,1,'',10,'2026-05-25 08:09:35','2026-06-26 17:09:12',NULL),
(25,2,'1100','Accounts Receivable','asset','current_asset','debit',0,NULL,1,1,NULL,20,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(26,2,'1200','VAT Receivable (Input Tax)','asset','current_asset','debit',0,NULL,1,1,NULL,30,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(27,2,'1300','Prepaid Expenses','asset','current_asset','debit',0,NULL,1,1,NULL,40,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(28,2,'1510','Office Equipment — Cost','asset','fixed_asset','debit',0,NULL,1,1,NULL,50,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(29,2,'1520','Accumulated Depreciation','asset','fixed_asset','credit',0,NULL,1,1,NULL,60,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(30,2,'2000','Accounts Payable','liability','current_liability','credit',0,NULL,1,1,NULL,110,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(31,2,'2100','VAT Payable (Output Tax)','liability','current_liability','credit',0,NULL,1,1,NULL,120,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(32,2,'2200','Accrued Expenses','liability','current_liability','credit',0,NULL,1,1,NULL,130,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(33,2,'2300','Unearned Revenue','liability','current_liability','credit',0,NULL,1,1,NULL,140,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(34,2,'2500','Loans Payable','liability','long_term_liability','credit',0,NULL,1,1,NULL,150,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(35,2,'3000','Owner\'s Capital / Share Capital','equity','equity','credit',0,NULL,1,1,NULL,210,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(36,2,'3100','Retained Earnings','equity','equity','credit',0,NULL,1,1,NULL,220,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(37,2,'3200','Drawings','equity','equity','debit',0,NULL,1,1,NULL,230,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(38,2,'4000','Service Revenue','revenue','operating_revenue','credit',0,NULL,1,1,NULL,310,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(39,2,'4100','Other Income','revenue','other_income','credit',0,NULL,1,1,NULL,320,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(40,2,'5000','Cost of Services (Work Orders)','expense','cost_of_revenue','debit',0,NULL,1,1,NULL,410,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(41,2,'5100','General & Administrative Expenses','expense','operating_expense','debit',1,NULL,1,1,NULL,420,'2026-05-25 08:09:35','2026-08-27 16:36:19',NULL),
(42,2,'5200','Materials & Equipment','expense','operating_expense','debit',1,NULL,1,1,NULL,430,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(43,2,'5300','Professional Services','expense','operating_expense','debit',1,NULL,1,1,NULL,440,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(44,2,'5400','Fuel & Transport','expense','operating_expense','debit',1,NULL,1,1,NULL,450,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(45,2,'5500','Utilities','expense','operating_expense','debit',0,NULL,1,1,NULL,460,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(46,2,'5600','Finance Charges','expense','finance_cost','debit',0,NULL,1,1,NULL,470,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(47,2,'1002','Bank Accounts','asset','current_asset','debit',1,24,0,1,NULL,0,'2026-08-24 15:16:52','2026-11-10 16:38:34',NULL),
(48,2,'test','Miscellaneous G&A (Legacy)','expense','operating_expense','debit',0,41,0,0,NULL,0,'2026-08-27 16:33:19','2026-08-27 16:33:19',NULL),
(49,1,'2410','Commission Payable','liability','current_liability','credit',0,NULL,1,1,NULL,145,'2026-09-28 16:47:42','2026-09-28 16:47:42',NULL),
(50,1,'5710','Staff Commission Expense','expense','operating_expense','debit',0,NULL,1,1,NULL,475,'2026-09-28 16:47:42','2026-09-28 16:47:42',NULL),
(51,2,'2410','Commission Payable','liability','current_liability','credit',0,NULL,1,1,NULL,145,'2026-09-28 16:47:42','2026-09-28 16:47:42',NULL),
(52,2,'5710','Staff Commission Expense','expense','operating_expense','debit',0,NULL,1,1,NULL,475,'2026-09-28 16:47:42','2026-09-28 16:47:42',NULL),
(53,1,'2400','Salaries Payable','liability','current_liability','credit',0,NULL,1,1,NULL,145,'2026-09-28 13:04:57','2026-09-28 13:04:57',NULL),
(54,1,'5700','Salaries & Wages Expense','expense','operating_expense','debit',0,NULL,1,1,NULL,480,'2026-09-28 13:04:57','2026-09-28 13:04:57',NULL),
(55,1,'5720','Employee Benefits & Allowances','expense','operating_expense','debit',0,NULL,1,1,NULL,500,'2026-09-28 13:04:57','2026-09-28 13:04:57',NULL),
(56,2,'2400','Salaries Payable','liability','current_liability','credit',0,NULL,1,1,NULL,145,'2026-09-28 13:04:57','2026-09-28 13:04:57',NULL),
(57,2,'5700','Salaries & Wages Expense','expense','operating_expense','debit',0,NULL,1,1,NULL,480,'2026-09-28 13:04:57','2026-09-28 13:04:57',NULL),
(58,2,'5720','Employee Benefits & Allowances','expense','operating_expense','debit',0,NULL,1,1,NULL,500,'2026-09-28 13:04:57','2026-09-28 13:04:57',NULL),
(59,1,'5110','Office Supplies','expense','operating_expense','debit',0,18,1,1,NULL,421,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(60,1,'5120','Rent & Utilities','expense','operating_expense','debit',0,18,1,1,NULL,422,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(61,1,'5130','IT & Software','expense','operating_expense','debit',0,18,1,1,NULL,423,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(62,1,'5140','Miscellaneous G&A','expense','operating_expense','debit',0,18,1,1,NULL,424,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(63,1,'5210','Raw Materials','expense','operating_expense','debit',0,19,1,1,NULL,431,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(64,1,'5220','Equipment Purchase','expense','operating_expense','debit',0,19,1,1,NULL,432,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(65,1,'5230','Equipment Rental','expense','operating_expense','debit',0,19,1,1,NULL,433,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(66,1,'5310','Legal & Consulting','expense','operating_expense','debit',0,20,1,1,NULL,441,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(67,1,'5320','Audit & Accounting','expense','operating_expense','debit',0,20,1,1,NULL,442,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(68,1,'5410','Fuel','expense','operating_expense','debit',0,21,1,1,NULL,451,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(69,1,'5420','Vehicle Maintenance','expense','operating_expense','debit',0,21,1,1,NULL,452,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(70,1,'5430','Vehicle Insurance & Registration','expense','operating_expense','debit',0,21,1,1,NULL,453,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(71,2,'5110','Office Supplies','expense','operating_expense','debit',0,41,1,1,NULL,421,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(72,2,'5120','Rent & Utilities','expense','operating_expense','debit',0,41,1,1,NULL,422,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(73,2,'5130','IT & Software','expense','operating_expense','debit',0,41,1,1,NULL,423,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(74,2,'5140','Miscellaneous G&A','expense','operating_expense','debit',0,41,1,1,NULL,424,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(75,2,'5210','Raw Materials','expense','operating_expense','debit',0,42,1,1,NULL,431,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(76,2,'5220','Equipment Purchase','expense','operating_expense','debit',0,42,1,1,NULL,432,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(77,2,'5230','Equipment Rental','expense','operating_expense','debit',0,42,1,1,NULL,433,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(78,2,'5310','Legal & Consulting','expense','operating_expense','debit',0,43,1,1,NULL,441,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(79,2,'5320','Audit & Accounting','expense','operating_expense','debit',0,43,1,1,NULL,442,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(80,2,'5410','Fuel','expense','operating_expense','debit',0,44,1,1,NULL,451,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(81,2,'5420','Vehicle Maintenance','expense','operating_expense','debit',0,44,1,1,NULL,452,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(82,2,'5430','Vehicle Insurance & Registration','expense','operating_expense','debit',0,44,1,1,NULL,453,'2026-09-30 13:17:52','2026-09-30 13:17:52',NULL),
(83,2,'1003','ADCB','asset','bank','debit',0,47,0,1,NULL,0,'2026-11-10 16:38:34','2026-11-10 16:38:34',NULL),
(84,2,'5124','Stationery account','expense',NULL,'debit',0,41,0,1,NULL,0,'2026-11-10 17:08:52','2026-11-10 17:08:52',NULL),
(85,2,'1012','Cash Account (DIP)','asset','cash','debit',0,24,0,1,NULL,0,'2026-11-12 10:00:36','2026-11-12 10:00:36',NULL),
(86,2,'1350','Advances to Suppliers','asset','current_asset','debit',0,NULL,1,1,NULL,45,'2026-11-12 18:39:55','2026-11-12 18:39:55',NULL);
/*!40000 ALTER TABLE `chart_of_accounts` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `commission_settings` WRITE;
/*!40000 ALTER TABLE `commission_settings` DISABLE KEYS */;
INSERT INTO `commission_settings` (`id`, `tenant_id`, `user_id`, `commission_percentage`, `effective_from`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES (1,1,46,5.00,'2026-01-01',1,3,'2026-09-28 17:11:31','2026-09-28 17:11:31'),
(2,2,6,5.00,'2026-09-28',1,16,'2026-09-28 22:41:06','2026-09-28 22:41:06'),
(3,2,18,10.00,'2026-09-29',0,16,'2026-09-29 12:30:45','2026-09-29 12:32:22'),
(4,2,18,0.00,'2026-09-29',0,16,'2026-09-29 12:32:22','2026-09-29 12:48:49'),
(5,2,18,10.00,'2026-09-29',1,2,'2026-09-29 12:48:49','2026-09-29 12:48:49');
/*!40000 ALTER TABLE `commission_settings` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `contact_roles` WRITE;
/*!40000 ALTER TABLE `contact_roles` DISABLE KEYS */;
INSERT INTO `contact_roles` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Sales','Sales',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Finance','Finance',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'HR','HR',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'Operations','Operations',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Technical','Technical',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Management','Management',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Other','Other',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `contact_roles` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'UAE','United Arab Emirates',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `deal_statuses` WRITE;
/*!40000 ALTER TABLE `deal_statuses` DISABLE KEYS */;
INSERT INTO `deal_statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (991,'new','New',1,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(992,'approved','Approved',2,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(993,'quotation_sent','Quotation Sent',3,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(994,'negotiation','Negotiation',4,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(995,'won','Won',5,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(996,'lost','Lost',6,1,'2026-11-19 15:46:07','2026-11-19 15:46:07');
/*!40000 ALTER TABLE `deal_statuses` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `deal_types` WRITE;
/*!40000 ALTER TABLE `deal_types` DISABLE KEYS */;
INSERT INTO `deal_types` (`id`, `name`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,'New Business','New customer acquisition',1,1,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(2,'Renewal','Contract renewal',1,2,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(3,'Upsell','Additional services to existing customer',1,3,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(4,'Cross-sell','Different services to existing customer',1,4,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL);
/*!40000 ALTER TABLE `deal_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` (`id`, `tenant_id`, `name`, `code`, `parent_id`, `head_employee_id`, `status`, `created_at`, `updated_at`) VALUES (1,1,'QA Test Dept','QATD',NULL,NULL,'active','2026-09-28 17:07:44','2026-09-28 17:07:44'),
(2,1,'E2E Dept 1790600897231','E2E1790600897231',NULL,NULL,'active','2026-09-28 17:08:24','2026-09-28 17:08:24');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`, `department_id`, `level`) VALUES (1,'CEO','CEO',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(2,'Managing Director','Managing Director',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(3,'Director','Director',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(4,'General Manager','General Manager',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(5,'Manager','Manager',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(6,'Assistant Manager','Assistant Manager',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(7,'Senior Executive','Senior Executive',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(8,'Executive','Executive',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(9,'Officer','Officer',9,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(10,'Coordinator','Coordinator',10,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(11,'Supervisor','Supervisor',11,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(12,'Team Leader','Team Leader',12,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(13,'Specialist','Specialist',13,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(14,'Consultant','Consultant',14,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(15,'Engineer','Engineer',15,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(16,'Technician','Technician',16,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(17,'Administrator','Administrator',17,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(18,'Accountant','Accountant',18,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL),
(19,'Other','Other',19,1,'2026-02-22 22:06:13','2026-02-22 22:06:13',NULL,NULL);
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` (`id`, `tenant_id`, `name`, `is_active`, `created_at`, `updated_at`) VALUES (1,NULL,'Passport',1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(2,NULL,'UAE Visa',1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(3,NULL,'Emirates ID',1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(4,NULL,'Labour Card',1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(5,NULL,'Medical Insurance',1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(6,NULL,'Driving License',1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(7,NULL,'Other',1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(9,2,'Bank statement',1,'2026-10-15 14:42:50','2026-10-15 14:42:50');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` (`id`, `tenant_id`, `name`, `value`, `display_order`, `is_active`, `created_at`, `updated_at`, `default_account_id`) VALUES (1,1,'Travel','travel',1,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',68),
(2,1,'Utility','utility',2,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',22),
(3,1,'Fuel','fuel',3,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',68),
(4,1,'Materials','materials',4,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',63),
(5,1,'Equipment','equipment',5,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',64),
(6,1,'Professional services','professional',6,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',66),
(7,1,'Other','other',99,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',62),
(8,2,'Travel','travel',1,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',80),
(9,2,'Utility','utility',2,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',45),
(10,2,'Fuel','fuel',3,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',80),
(11,2,'Materials','materials',4,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',75),
(12,2,'Equipment','equipment',5,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',76),
(13,2,'Professional services','professional',6,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',78),
(14,2,'Other','other',99,1,'2026-07-09 11:46:22','2026-11-09 13:57:04',74);
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `fiscal_years` WRITE;
/*!40000 ALTER TABLE `fiscal_years` DISABLE KEYS */;
INSERT INTO `fiscal_years` (`id`, `tenant_id`, `name`, `start_date`, `end_date`, `status`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,1,'FY 2026','2026-01-01','2026-12-31','open',3,'2026-11-09 22:01:50','2026-11-09 22:01:50',NULL),
(2,2,'FY 2026','2026-01-01','2026-12-31','open',1,'2026-11-09 22:01:50','2026-11-11 16:29:57',NULL);
/*!40000 ALTER TABLE `fiscal_years` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` (`id`, `tenant_id`, `name`, `holiday_date`, `is_recurring`, `created_at`, `updated_at`) VALUES (1,1,'New Year\'s Day','2026-01-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(2,1,'Commemoration Day','2026-12-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(3,1,'UAE National Day','2026-12-02',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(4,1,'UAE National Day (Day 2)','2026-12-03',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(5,1,'New Year\'s Day','2027-01-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(6,1,'Commemoration Day','2027-12-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(7,1,'UAE National Day','2027-12-02',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(8,1,'UAE National Day (Day 2)','2027-12-03',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(9,2,'New Year\'s Day','2026-01-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(10,2,'Commemoration Day','2026-12-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(11,2,'UAE National Day','2026-12-02',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(12,2,'UAE National Day (Day 2)','2026-12-03',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(13,2,'New Year\'s Day','2027-01-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(14,2,'Commemoration Day','2027-12-01',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(15,2,'UAE National Day','2027-12-02',1,'2026-09-28 21:17:20','2026-09-28 21:17:20'),
(16,2,'UAE National Day (Day 2)','2027-12-03',1,'2026-09-28 21:17:20','2026-09-28 21:17:20');
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `industry_types` WRITE;
/*!40000 ALTER TABLE `industry_types` DISABLE KEYS */;
INSERT INTO `industry_types` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Technology','Technology',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Manufacturing','Manufacturing',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Retail','Retail',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'Healthcare','Healthcare',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Finance','Finance',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Construction','Construction',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Education','Education',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Transportation & Logistics','Transportation & Logistics',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(9,'Energy','Energy',9,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(10,'Real Estate','Real Estate',10,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(11,'Hospitality','Hospitality',11,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(12,'Agriculture','Agriculture',12,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(13,'Environmental Services','Environmental Services',13,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(14,'Other','Other',14,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(15,'Government','Government',0,1,'2026-07-27 00:00:00','2026-07-27 16:32:15'),
(16,'Trading','Trading',0,1,'2026-08-10 00:00:00','2026-08-10 16:03:43');
/*!40000 ALTER TABLE `industry_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `lead_sources` WRITE;
/*!40000 ALTER TABLE `lead_sources` DISABLE KEYS */;
INSERT INTO `lead_sources` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Website','Website',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Referral','Referral',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Cold Call','Cold Call',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'Email','Email',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Social Media','Social Media',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Trade Show','Trade Show',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Advertisement','Advertisement',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Partner','Partner',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(9,'Other','Other',9,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(10,'Field Visit','Field Visit',10,1,'0000-00-00 00:00:00','0000-00-00 00:00:00');
/*!40000 ALTER TABLE `lead_sources` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
INSERT INTO `leave_types` (`id`, `tenant_id`, `name`, `code`, `is_paid`, `default_annual_days`, `accrual_method`, `requires_approval`, `is_active`, `created_at`, `updated_at`) VALUES (1,1,'Annual Leave','ANNUAL',1,30.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58'),
(2,1,'Sick Leave','SICK',1,15.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58'),
(3,1,'Casual Leave','CASUAL',1,7.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58'),
(4,1,'Unpaid Leave','UNPAID',0,0.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58'),
(5,2,'Annual Leave','ANNUAL',1,30.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58'),
(6,2,'Sick Leave','SICK',1,15.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58'),
(7,2,'Casual Leave','CASUAL',1,7.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58'),
(8,2,'Unpaid Leave','UNPAID',0,0.00,'annual_lump_sum',1,1,'2026-09-28 13:04:58','2026-09-28 13:04:58');
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `material_types` WRITE;
/*!40000 ALTER TABLE `material_types` DISABLE KEYS */;
INSERT INTO `material_types` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'metal','Metal',1,1,'2026-02-27 11:45:28','2026-02-27 07:45:28'),
(2,'plastic','Plastic',2,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(3,'paper','Paper',3,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(4,'glass','Glass',4,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(5,'organic','Organic',5,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(6,'electronic','Electronic',6,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(7,'hazardous','Hazardous',7,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(8,'other','Other',99,1,'2026-02-27 11:45:28','2026-02-27 11:45:28');
/*!40000 ALTER TABLE `material_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `migration_history` WRITE;
/*!40000 ALTER TABLE `migration_history` DISABLE KEYS */;
INSERT INTO `migration_history` (`id`, `migration_name`, `applied_at`) VALUES (1,'20260223000000-initial-schema.js','2026-02-22 21:40:11'),
(2,'20260223000001-drop-deals-create-dropdowns.js','2026-02-22 21:40:35'),
(3,'20260223000002-create-products-services.js','2026-02-22 21:40:36'),
(4,'20260223000003-create-deals.js','2026-02-22 21:40:36'),
(5,'20260223100000-create-separate-dropdown-tables.js','2026-02-22 22:06:13'),
(6,'20260223110000-add-product-type.js','2026-02-23 14:04:27'),
(7,'20260223120000-add-dynamic-categories.js','2026-02-23 14:07:21');
/*!40000 ALTER TABLE `migration_history` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `payment_statuses` WRITE;
/*!40000 ALTER TABLE `payment_statuses` DISABLE KEYS */;
INSERT INTO `payment_statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'unpaid','Unpaid',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'partial','Partially Paid',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'paid','Fully Paid',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `payment_statuses` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` (`id`, `name`, `display_name`, `module`, `action`, `description`, `deleted_at`) VALUES (1,'dashboard.create','Create Dashboard','','create','Permission to create dashboard',NULL),
(2,'dashboard.read','Read Dashboard','','read','Permission to read dashboard',NULL),
(3,'dashboard.update','Update Dashboard','','update','Permission to update dashboard',NULL),
(4,'dashboard.delete','Delete Dashboard','','delete','Permission to delete dashboard',NULL),
(5,'dashboard.approve','Approve Dashboard','','approve','Permission to approve dashboard',NULL),
(6,'dashboard.export','Export Dashboard','','export','Permission to export dashboard',NULL),
(7,'clients.create','Create Clients','','create','Permission to create clients',NULL),
(8,'clients.read','Read Clients','','read','Permission to read clients',NULL),
(9,'clients.update','Update Clients','','update','Permission to update clients',NULL),
(10,'clients.delete','Delete Clients','','delete','Permission to delete clients',NULL),
(11,'clients.approve','Approve Clients','','approve','Permission to approve clients',NULL),
(12,'clients.export','Export Clients','','export','Permission to export clients',NULL),
(13,'vendors.create','Create Vendors','','create','Permission to create vendors',NULL),
(14,'vendors.read','Read Vendors','','read','Permission to read vendors',NULL),
(15,'vendors.update','Update Vendors','','update','Permission to update vendors',NULL),
(16,'vendors.delete','Delete Vendors','','delete','Permission to delete vendors',NULL),
(17,'vendors.approve','Approve Vendors','','approve','Permission to approve vendors',NULL),
(18,'vendors.export','Export Vendors','','export','Permission to export vendors',NULL),
(19,'leads.create','Create Leads','leads','create','Permission to create leads',NULL),
(20,'leads.read','Read Leads','leads','read','Permission to read leads',NULL),
(21,'leads.update','Update Leads','leads','update','Permission to update leads',NULL),
(22,'leads.delete','Delete Leads','leads','delete','Permission to delete leads',NULL),
(23,'leads.approve','Approve Leads','leads','approve','Permission to approve leads',NULL),
(24,'leads.export','Export Leads','leads','export','Permission to export leads',NULL),
(25,'deals.create','Create Deals','','create','Permission to create deals',NULL),
(26,'deals.read','Read Deals','','read','Permission to read deals',NULL),
(27,'deals.update','Update Deals','','update','Permission to update deals',NULL),
(28,'deals.delete','Delete Deals','','delete','Permission to delete deals',NULL),
(29,'deals.approve','Approve Deals','','approve','Permission to approve deals',NULL),
(30,'deals.export','Export Deals','','export','Permission to export deals',NULL),
(31,'products.create','Create Products','','create','Permission to create products',NULL),
(32,'products.read','Read Products','','read','Permission to read products',NULL),
(33,'products.update','Update Products','','update','Permission to update products',NULL),
(34,'products.delete','Delete Products','','delete','Permission to delete products',NULL),
(35,'products.approve','Approve Products','','approve','Permission to approve products',NULL),
(36,'products.export','Export Products','','export','Permission to export products',NULL),
(37,'services.create','Create Services','','create','Permission to create services',NULL),
(38,'services.read','Read Services','','read','Permission to read services',NULL),
(39,'services.update','Update Services','','update','Permission to update services',NULL),
(40,'services.delete','Delete Services','','delete','Permission to delete services',NULL),
(41,'services.approve','Approve Services','','approve','Permission to approve services',NULL),
(42,'services.export','Export Services','','export','Permission to export services',NULL),
(43,'accounting.create','Create Accounting','','create','Permission to create accounting',NULL),
(44,'accounting.read','Read Accounting','','read','Permission to read accounting',NULL),
(45,'accounting.update','Update Accounting','','update','Permission to update accounting',NULL),
(46,'accounting.delete','Delete Accounting','','delete','Permission to delete accounting',NULL),
(47,'accounting.approve','Approve Accounting','','approve','Permission to approve accounting',NULL),
(48,'accounting.export','Export Accounting','','export','Permission to export accounting',NULL),
(49,'commissions.create','Create Commissions','','create','Permission to create commissions',NULL),
(50,'commissions.read','Read Commissions','','read','Permission to read commissions',NULL),
(51,'commissions.update','Update Commissions','','update','Permission to update commissions',NULL),
(52,'commissions.delete','Delete Commissions','','delete','Permission to delete commissions',NULL),
(53,'commissions.approve','Approve Commissions','','approve','Permission to approve commissions',NULL),
(54,'commissions.export','Export Commissions','','export','Permission to export commissions',NULL),
(55,'documents.create','Create Documents','','create','Permission to create documents',NULL),
(56,'documents.read','Read Documents','','read','Permission to read documents',NULL),
(57,'documents.update','Update Documents','','update','Permission to update documents',NULL),
(58,'documents.delete','Delete Documents','','delete','Permission to delete documents',NULL),
(59,'documents.approve','Approve Documents','','approve','Permission to approve documents',NULL),
(60,'documents.export','Export Documents','','export','Permission to export documents',NULL),
(61,'operations.create','Create Operations','','create','Permission to create operations',NULL),
(62,'operations.read','Read Operations','','read','Permission to read operations',NULL),
(63,'operations.update','Update Operations','','update','Permission to update operations',NULL),
(64,'operations.delete','Delete Operations','','delete','Permission to delete operations',NULL),
(65,'operations.approve','Approve Operations','','approve','Permission to approve operations',NULL),
(66,'operations.export','Export Operations','','export','Permission to export operations',NULL),
(67,'reports.create','Create Reports','','create','Permission to create reports',NULL),
(68,'reports.read','Read Reports','','read','Permission to read reports',NULL),
(69,'reports.update','Update Reports','','update','Permission to update reports',NULL),
(70,'reports.delete','Delete Reports','','delete','Permission to delete reports',NULL),
(71,'reports.approve','Approve Reports','','approve','Permission to approve reports',NULL),
(72,'reports.export','Export Reports','','export','Permission to export reports',NULL),
(73,'settings.create','Create Settings','','create','Permission to create settings',NULL),
(74,'settings.read','Read Settings','','read','Permission to read settings',NULL),
(75,'settings.update','Update Settings','','update','Permission to update settings',NULL),
(76,'settings.delete','Delete Settings','','delete','Permission to delete settings',NULL),
(77,'settings.approve','Approve Settings','','approve','Permission to approve settings',NULL),
(78,'settings.export','Export Settings','','export','Permission to export settings',NULL),
(79,'users.create','Create Users','users','create','Permission to create users',NULL),
(80,'users.read','Read Users','users','read','Permission to read users',NULL),
(81,'users.update','Update Users','users','update','Permission to update users',NULL),
(82,'users.delete','Delete Users','users','delete','Permission to delete users',NULL),
(83,'users.approve','Approve Users','users','approve','Permission to approve users',NULL),
(84,'users.export','Export Users','users','export','Permission to export users',NULL),
(85,'masters.create','Create Masters','','create','Permission to create masters',NULL),
(86,'masters.read','Read Masters','','read','Permission to read masters',NULL),
(87,'masters.update','Update Masters','','update','Permission to update masters',NULL),
(88,'masters.delete','Delete Masters','','delete','Permission to delete masters',NULL),
(89,'masters.approve','Approve Masters','','approve','Permission to approve masters',NULL),
(90,'masters.export','Export Masters','','export','Permission to export masters',NULL),
(91,'certificates.create','Create Certificates','','create','Permission to create certificates',NULL),
(92,'certificates.read','Read Certificates','','read','Permission to read certificates',NULL),
(93,'certificates.update','Update Certificates','','update','Permission to update certificates',NULL),
(94,'certificates.delete','Delete Certificates','','delete','Permission to delete certificates',NULL),
(95,'certificates.approve','Approve Certificates','','approve','Permission to approve certificates',NULL),
(96,'certificates.export','Export Certificates','','export','Permission to export certificates',NULL),
(97,'fleets.create','Create Fleets','','create','Permission to create fleets',NULL),
(98,'fleets.read','Read Fleets','','read','Permission to read fleets',NULL),
(99,'fleets.update','Update Fleets','','update','Permission to update fleets',NULL),
(100,'fleets.delete','Delete Fleets','','delete','Permission to delete fleets',NULL),
(101,'fleets.approve','Approve Fleets','','approve','Permission to approve fleets',NULL),
(102,'fleets.export','Export Fleets','','export','Permission to export fleets',NULL),
(103,'hr.create','Create Hr','','create','Permission to create hr',NULL),
(104,'hr.read','Read Hr','','read','Permission to read hr',NULL),
(105,'hr.update','Update Hr','','update','Permission to update hr',NULL),
(106,'hr.delete','Delete Hr','','delete','Permission to delete hr',NULL),
(107,'hr.approve','Approve Hr','','approve','Permission to approve hr',NULL),
(108,'hr.export','Export Hr','','export','Permission to export hr',NULL),
(109,'payroll.create','Create Payroll','','create','Permission to create payroll',NULL),
(110,'payroll.read','Read Payroll','','read','Permission to read payroll',NULL),
(111,'payroll.update','Update Payroll','','update','Permission to update payroll',NULL),
(112,'payroll.delete','Delete Payroll','','delete','Permission to delete payroll',NULL),
(113,'payroll.approve','Approve Payroll','','approve','Permission to approve payroll',NULL),
(114,'payroll.export','Export Payroll','','export','Permission to export payroll',NULL),
(115,'inbound.create','Create Inbound','','create','Permission to create inbound',NULL),
(116,'inbound.read','Read Inbound','','read','Permission to read inbound',NULL),
(117,'inbound.update','Update Inbound','','update','Permission to update inbound',NULL),
(118,'inbound.delete','Delete Inbound','','delete','Permission to delete inbound',NULL),
(119,'inbound.approve','Approve Inbound','','approve','Permission to approve inbound',NULL),
(120,'inbound.export','Export Inbound','','export','Permission to export inbound',NULL),
(121,'inventory.create','Create Inventory','','create','Permission to create inventory',NULL),
(122,'inventory.read','Read Inventory','','read','Permission to read inventory',NULL),
(123,'inventory.update','Update Inventory','','update','Permission to update inventory',NULL),
(124,'inventory.delete','Delete Inventory','','delete','Permission to delete inventory',NULL),
(125,'inventory.approve','Approve Inventory','','approve','Permission to approve inventory',NULL),
(126,'inventory.export','Export Inventory','','export','Permission to export inventory',NULL),
(127,'outbound.create','Create Outbound','','create','Permission to create outbound',NULL),
(128,'outbound.read','Read Outbound','','read','Permission to read outbound',NULL),
(129,'outbound.update','Update Outbound','','update','Permission to update outbound',NULL),
(130,'outbound.delete','Delete Outbound','','delete','Permission to delete outbound',NULL),
(131,'outbound.approve','Approve Outbound','','approve','Permission to approve outbound',NULL),
(132,'outbound.export','Export Outbound','','export','Permission to export outbound',NULL),
(133,'contacts.create','Create Contacts','contacts','create','Permission to create contacts',NULL),
(134,'contacts.read','Read Contacts','contacts','read','Permission to read contacts',NULL),
(135,'contacts.update','Update Contacts','contacts','update','Permission to update contacts',NULL),
(136,'contacts.delete','Delete Contacts','contacts','delete','Permission to delete contacts',NULL),
(137,'contacts.approve','Approve Contacts','contacts','approve','Permission to approve contacts',NULL),
(138,'contacts.export','Export Contacts','contacts','export','Permission to export contacts',NULL),
(139,'companies.create','Create Companies','companies','create','Permission to create companies',NULL),
(140,'companies.read','Read Companies','companies','read','Permission to read companies',NULL),
(141,'companies.update','Update Companies','companies','update','Permission to update companies',NULL),
(142,'companies.delete','Delete Companies','companies','delete','Permission to delete companies',NULL),
(143,'companies.approve','Approve Companies','companies','approve','Permission to approve companies',NULL),
(144,'companies.export','Export Companies','companies','export','Permission to export companies',NULL),
(145,'suppliers.create','Create Suppliers','suppliers','create','Permission to create suppliers',NULL),
(146,'suppliers.read','Read Suppliers','suppliers','read','Permission to read suppliers',NULL),
(147,'suppliers.update','Update Suppliers','suppliers','update','Permission to update suppliers',NULL),
(148,'suppliers.delete','Delete Suppliers','suppliers','delete','Permission to delete suppliers',NULL),
(149,'suppliers.approve','Approve Suppliers','suppliers','approve','Permission to approve suppliers',NULL),
(150,'suppliers.export','Export Suppliers','suppliers','export','Permission to export suppliers',NULL),
(433,'inspection_requests.read','Read Inspection Requests','inspection_requests','read','Permission to read inspection requests',NULL),
(434,'inspection_reports.read','Read Inspection Reports','inspection_reports','read','Permission to read inspection reports',NULL),
(435,'inspection_reports.create','Create Inspection Reports','inspection_reports','create','Permission to create inspection reports',NULL),
(436,'inspection_reports.update','Update Inspection Reports','inspection_reports','update','Permission to update inspection reports',NULL),
(549,'inspection_requests.update','Update Inspection Requests','inspection_requests','update','Permission to update inspection requests',NULL),
(672,'grn.read','Read GRN','','read','View goods received notes',NULL),
(673,'grn.create','Create GRN','','create','Create goods received notes',NULL),
(674,'grn.update','Update GRN','','update','Update / approve goods received notes',NULL),
(720,'quotations.read','Read Quotations','quotations','read','View service quotations and orders',NULL),
(721,'quotations.create','Create Quotations','quotations','create','Create service quotations',NULL),
(722,'quotations.update','Update Quotations','quotations','update','Update service quotations',NULL),
(723,'quotations.delete','Delete Quotations','quotations','delete','Delete service quotations',NULL),
(724,'purchase_orders.read','Read Purchase Orders','purchase_orders','read','View purchase orders and PO quotations',NULL),
(725,'purchase_orders.create','Create Purchase Orders','purchase_orders','create','Create purchase orders',NULL),
(726,'purchase_orders.update','Update Purchase Orders','purchase_orders','update','Update purchase orders',NULL),
(727,'purchase_orders.delete','Delete Purchase Orders','purchase_orders','delete','Delete purchase orders',NULL),
(1017,'quotations.approve','Approve Quotations','quotations','approve','Permission to approve service quotations',NULL),
(1036,'purchase_orders.approve','Approve Purchase Orders','purchase_orders','approve','Permission to approve client purchase quotations',NULL),
(2196,'users.impersonate','Impersonate Users','users','impersonate','Permission to log in as another user',NULL),
(2217,'hr.employees.manage','Manage HR Employees','hr','update','Permission: hr.employees.manage',NULL),
(2218,'hr.employees.read','Read HR Employees','hr','update','Permission: hr.employees.read',NULL),
(2219,'hr.attendance.manage','Manage HR Attendance','hr','update','Permission: hr.attendance.manage',NULL),
(2220,'hr.attendance.read','Read HR Attendance','hr','update','Permission: hr.attendance.read',NULL),
(2221,'hr.leave.approve','Approve HR Leave','hr','update','Permission: hr.leave.approve',NULL),
(2222,'hr.leave.read','Read HR Leave','hr','update','Permission: hr.leave.read',NULL),
(2223,'hr.payroll.process','Process HR Payroll','hr','update','Permission: hr.payroll.process',NULL),
(2224,'hr.payroll.read','Read HR Payroll','hr','update','Permission: hr.payroll.read',NULL),
(2225,'hr.settings.manage','Manage HR Settings','hr','update','Permission: hr.settings.manage',NULL),
(2428,'certificates.verify','Verify & Generate Certificates','','','HR verification and certificate generation',NULL),
(2429,'certificates.manage','Manage Certificate Settings','','','Manage carbon footprint factors and certificate settings',NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Waste Collection','Waste Collection',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Recycling','Recycling',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Disposal','Disposal',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'ITAD Services','ITAD Services',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Hazardous Waste','Hazardous Waste',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Consulting','Consulting',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Equipment Rental','Equipment Rental',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Other','Other',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `purchase_order_statuses` WRITE;
/*!40000 ALTER TABLE `purchase_order_statuses` DISABLE KEYS */;
INSERT INTO `purchase_order_statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (2075,'new','New',1,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(2076,'sent','Sent',2,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(2077,'under_review','Under Review',3,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(2078,'revised','Revised',4,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(2079,'approved','Approved',5,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(2080,'rejected','Rejected',6,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(2081,'pending_approval','Pending Approval',7,1,'2026-11-19 15:46:10','2026-11-19 15:46:10');
/*!40000 ALTER TABLE `purchase_order_statuses` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `quotation_statuses` WRITE;
/*!40000 ALTER TABLE `quotation_statuses` DISABLE KEYS */;
INSERT INTO `quotation_statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1882,'new','New',1,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(1883,'sent','Sent',2,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(1884,'under_review','Under Review',3,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(1885,'revised','Revised',4,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(1886,'approved','Approved',5,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(1887,'rejected','Rejected',6,1,'2026-11-19 15:46:07','2026-11-19 15:46:07'),
(1888,'pending_approval','Pending Approval',7,1,'2026-11-19 15:46:10','2026-11-19 15:46:10');
/*!40000 ALTER TABLE `quotation_statuses` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`, `deleted_at`) VALUES (1,1,1,NULL),
(2,1,2,NULL),
(3,1,3,NULL),
(4,1,4,NULL),
(5,1,5,NULL),
(6,1,6,NULL),
(7,1,7,NULL),
(8,1,8,NULL),
(9,1,9,NULL),
(10,1,10,NULL),
(11,1,11,NULL),
(12,1,12,NULL),
(13,1,13,NULL),
(14,1,14,NULL),
(15,1,15,NULL),
(16,1,16,NULL),
(17,1,17,NULL),
(18,1,18,NULL),
(19,1,19,NULL),
(20,1,20,NULL),
(21,1,21,NULL),
(22,1,22,NULL),
(23,1,23,NULL),
(24,1,24,NULL),
(25,1,25,NULL),
(26,1,26,NULL),
(27,1,27,NULL),
(28,1,28,NULL),
(29,1,29,NULL),
(30,1,30,NULL),
(31,1,31,NULL),
(32,1,32,NULL),
(33,1,33,NULL),
(34,1,34,NULL),
(35,1,35,NULL),
(36,1,36,NULL),
(37,1,37,NULL),
(38,1,38,NULL),
(39,1,39,NULL),
(40,1,40,NULL),
(41,1,41,NULL),
(42,1,42,NULL),
(43,1,43,NULL),
(44,1,44,NULL),
(45,1,45,NULL),
(46,1,46,NULL),
(47,1,47,NULL),
(48,1,48,NULL),
(49,1,49,NULL),
(50,1,50,NULL),
(51,1,51,NULL),
(52,1,52,NULL),
(53,1,53,NULL),
(54,1,54,NULL),
(55,1,55,NULL),
(56,1,56,NULL),
(57,1,57,NULL),
(58,1,58,NULL),
(59,1,59,NULL),
(60,1,60,NULL),
(61,1,61,NULL),
(62,1,62,NULL),
(63,1,63,NULL),
(64,1,64,NULL),
(65,1,65,NULL),
(66,1,66,NULL),
(67,1,67,NULL),
(68,1,68,NULL),
(69,1,69,NULL),
(70,1,70,NULL),
(71,1,71,NULL),
(72,1,72,NULL),
(73,1,73,NULL),
(74,1,74,NULL),
(75,1,75,NULL),
(76,1,76,NULL),
(77,1,77,NULL),
(78,1,78,NULL),
(79,1,79,NULL),
(80,1,80,NULL),
(81,1,81,NULL),
(82,1,82,NULL),
(83,1,83,NULL),
(84,1,84,NULL),
(85,1,85,NULL),
(86,1,86,NULL),
(87,1,87,NULL),
(88,1,88,NULL),
(89,1,89,NULL),
(90,1,90,NULL),
(91,1,91,NULL),
(92,1,92,NULL),
(93,1,93,NULL),
(94,1,94,NULL),
(95,1,95,NULL),
(96,1,96,NULL),
(97,1,97,NULL),
(98,1,98,NULL),
(99,1,99,NULL),
(100,1,100,NULL),
(101,1,101,NULL),
(102,1,102,NULL),
(103,1,103,NULL),
(104,1,104,NULL),
(105,1,105,NULL),
(106,1,106,NULL),
(107,1,107,NULL),
(108,1,108,NULL),
(109,1,109,NULL),
(110,1,110,NULL),
(111,1,111,NULL),
(112,1,112,NULL),
(113,1,113,NULL),
(114,1,114,NULL),
(115,1,115,NULL),
(116,1,116,NULL),
(117,1,117,NULL),
(118,1,118,NULL),
(119,1,119,NULL),
(120,1,120,NULL),
(121,1,121,NULL),
(122,1,122,NULL),
(123,1,123,NULL),
(124,1,124,NULL),
(125,1,125,NULL),
(126,1,126,NULL),
(127,1,127,NULL),
(128,1,128,NULL),
(129,1,129,NULL),
(130,1,130,NULL),
(131,1,131,NULL),
(132,1,132,NULL),
(133,2,1,NULL),
(134,2,2,NULL),
(135,2,3,NULL),
(136,2,4,NULL),
(137,2,5,NULL),
(138,2,6,NULL),
(139,2,7,NULL),
(140,2,8,NULL),
(141,2,9,NULL),
(142,2,10,NULL),
(143,2,11,NULL),
(144,2,12,NULL),
(145,2,13,NULL),
(146,2,14,NULL),
(147,2,15,NULL),
(148,2,16,NULL),
(149,2,17,NULL),
(150,2,18,NULL),
(151,2,19,NULL),
(152,2,20,NULL),
(153,2,21,NULL),
(154,2,22,NULL),
(155,2,23,NULL),
(156,2,24,NULL),
(157,2,25,NULL),
(158,2,26,NULL),
(159,2,27,NULL),
(160,2,28,NULL),
(161,2,29,NULL),
(162,2,30,NULL),
(163,2,31,NULL),
(164,2,32,NULL),
(165,2,33,NULL),
(166,2,34,NULL),
(167,2,35,NULL),
(168,2,36,NULL),
(169,2,37,NULL),
(170,2,38,NULL),
(171,2,39,NULL),
(172,2,40,NULL),
(173,2,41,NULL),
(174,2,42,NULL),
(175,2,43,NULL),
(176,2,44,NULL),
(177,2,45,NULL),
(178,2,46,NULL),
(179,2,47,NULL),
(180,2,48,NULL),
(181,2,49,NULL),
(182,2,50,NULL),
(183,2,51,NULL),
(184,2,52,NULL),
(185,2,53,NULL),
(186,2,54,NULL),
(187,2,55,NULL),
(188,2,56,NULL),
(189,2,57,NULL),
(190,2,58,NULL),
(191,2,59,NULL),
(192,2,60,NULL),
(193,2,61,NULL),
(194,2,62,NULL),
(195,2,63,NULL),
(196,2,64,NULL),
(197,2,65,NULL),
(198,2,66,NULL),
(199,2,67,NULL),
(200,2,68,NULL),
(201,2,69,NULL),
(202,2,70,NULL),
(203,2,71,NULL),
(204,2,72,NULL),
(205,2,73,NULL),
(206,2,74,NULL),
(207,2,75,NULL),
(208,2,76,NULL),
(209,2,77,NULL),
(210,2,78,NULL),
(211,2,79,NULL),
(212,2,80,NULL),
(213,2,81,NULL),
(214,2,82,NULL),
(215,2,83,NULL),
(216,2,84,NULL),
(217,2,85,NULL),
(218,2,86,NULL),
(219,2,87,NULL),
(220,2,88,NULL),
(221,2,89,NULL),
(222,2,90,NULL),
(223,2,91,NULL),
(224,2,92,NULL),
(225,2,93,NULL),
(226,2,94,NULL),
(227,2,95,NULL),
(228,2,96,NULL),
(229,2,97,NULL),
(230,2,98,NULL),
(231,2,99,NULL),
(232,2,100,NULL),
(233,2,101,NULL),
(234,2,102,NULL),
(235,2,103,NULL),
(236,2,104,NULL),
(237,2,105,NULL),
(238,2,106,NULL),
(239,2,107,NULL),
(240,2,108,NULL),
(241,2,109,NULL),
(242,2,110,NULL),
(243,2,111,NULL),
(244,2,112,NULL),
(245,2,113,NULL),
(246,2,114,NULL),
(247,2,115,NULL),
(248,2,116,NULL),
(249,2,117,NULL),
(250,2,118,NULL),
(251,2,119,NULL),
(252,2,120,NULL),
(253,2,121,NULL),
(254,2,122,NULL),
(255,2,123,NULL),
(256,2,124,NULL),
(257,2,125,NULL),
(258,2,126,NULL),
(259,2,127,NULL),
(260,2,128,NULL),
(261,2,129,NULL),
(262,2,130,NULL),
(263,2,131,NULL),
(264,2,132,NULL),
(265,1,133,NULL),
(266,1,134,NULL),
(267,1,135,NULL),
(268,1,136,NULL),
(269,1,137,NULL),
(270,1,138,NULL),
(271,1,139,NULL),
(272,1,140,NULL),
(273,1,141,NULL),
(274,1,142,NULL),
(275,1,143,NULL),
(276,1,144,NULL),
(277,1,145,NULL),
(278,1,146,NULL),
(279,1,147,NULL),
(280,1,148,NULL),
(281,1,149,NULL),
(282,1,150,NULL),
(283,4,433,NULL),
(284,4,434,NULL),
(285,4,435,NULL),
(286,4,436,NULL),
(287,1,433,NULL),
(288,1,434,NULL),
(289,1,435,NULL),
(290,1,436,NULL),
(291,5,133,NULL),
(292,5,134,NULL),
(293,5,135,NULL),
(294,5,136,NULL),
(295,5,137,NULL),
(296,5,138,NULL),
(297,5,139,NULL),
(298,5,140,NULL),
(299,5,141,NULL),
(300,5,142,NULL),
(301,5,143,NULL),
(302,5,144,NULL),
(303,5,19,NULL),
(304,5,20,NULL),
(305,5,21,NULL),
(306,5,22,NULL),
(307,5,23,NULL),
(308,5,24,NULL),
(309,5,433,NULL),
(310,5,434,NULL),
(311,5,435,NULL),
(312,5,436,NULL),
(313,6,133,NULL),
(314,6,134,NULL),
(315,6,135,NULL),
(316,6,136,NULL),
(317,6,137,NULL),
(318,6,138,NULL),
(319,6,139,NULL),
(320,6,140,NULL),
(321,6,141,NULL),
(322,6,142,NULL),
(323,6,143,NULL),
(324,6,144,NULL),
(325,6,19,NULL),
(326,6,20,NULL),
(327,6,21,NULL),
(328,6,22,NULL),
(329,6,23,NULL),
(330,6,24,NULL),
(331,6,433,NULL),
(332,6,434,NULL),
(333,6,435,NULL),
(334,6,436,NULL),
(345,5,25,NULL),
(346,5,26,NULL),
(347,5,27,NULL),
(348,5,28,NULL),
(349,5,29,NULL),
(350,5,30,NULL),
(373,6,25,NULL),
(374,6,26,NULL),
(375,6,27,NULL),
(376,6,28,NULL),
(377,6,29,NULL),
(378,6,30,NULL),
(1005,2,133,NULL),
(1006,2,134,NULL),
(1007,2,135,NULL),
(1008,2,136,NULL),
(1009,2,137,NULL),
(1010,2,138,NULL),
(1011,2,139,NULL),
(1012,2,140,NULL),
(1013,2,141,NULL),
(1014,2,142,NULL),
(1015,2,143,NULL),
(1016,2,144,NULL),
(1017,2,145,NULL),
(1018,2,146,NULL),
(1019,2,147,NULL),
(1020,2,148,NULL),
(1021,2,149,NULL),
(1022,2,150,NULL),
(1029,2,433,NULL),
(1030,2,434,NULL),
(1031,2,435,NULL),
(1032,2,436,NULL),
(1789,5,80,NULL),
(2154,5,146,NULL),
(2184,6,146,NULL),
(2185,6,80,NULL),
(2186,4,80,NULL),
(9718,1,549,NULL),
(9873,2,549,NULL),
(9905,5,549,NULL),
(9936,6,549,NULL),
(14788,8,47,NULL),
(14789,8,43,NULL),
(14790,8,46,NULL),
(14791,8,48,NULL),
(14792,8,44,NULL),
(14793,8,45,NULL),
(14794,8,140,NULL),
(14795,8,134,NULL),
(14796,8,2,NULL),
(14800,8,30,NULL),
(14801,8,26,NULL),
(14803,8,20,NULL),
(14804,8,71,NULL),
(14805,8,67,NULL),
(14806,8,70,NULL),
(14807,8,72,NULL),
(14808,8,68,NULL),
(14809,8,69,NULL),
(14810,8,146,NULL),
(15996,4,549,NULL),
(15997,7,549,NULL),
(16000,7,65,NULL),
(16001,7,61,NULL),
(16002,7,64,NULL),
(16003,7,66,NULL),
(16004,7,62,NULL),
(16005,7,63,NULL),
(16006,7,26,NULL),
(18432,9,62,NULL),
(18433,7,80,NULL),
(18434,7,673,NULL),
(18435,7,672,NULL),
(18436,7,674,NULL),
(18437,4,672,NULL),
(18438,9,672,NULL),
(18439,6,672,NULL),
(18440,5,672,NULL),
(18561,1,672,NULL),
(18562,1,673,NULL),
(18563,1,674,NULL),
(18719,2,672,NULL),
(18720,2,673,NULL),
(18721,2,674,NULL),
(22437,8,724,NULL),
(22438,8,720,NULL),
(22439,6,725,NULL),
(22440,6,727,NULL),
(22441,6,724,NULL),
(22442,6,726,NULL),
(22443,6,721,NULL),
(22444,6,723,NULL),
(22445,6,720,NULL),
(22446,6,722,NULL),
(22447,5,725,NULL),
(22448,5,727,NULL),
(22449,5,724,NULL),
(22450,5,726,NULL),
(22451,5,721,NULL),
(22452,5,723,NULL),
(22453,5,720,NULL),
(22454,5,722,NULL),
(22614,1,720,NULL),
(22615,1,721,NULL),
(22616,1,722,NULL),
(22617,1,723,NULL),
(22618,1,724,NULL),
(22619,1,725,NULL),
(22620,1,726,NULL),
(22621,1,727,NULL),
(22780,2,720,NULL),
(22781,2,721,NULL),
(22782,2,722,NULL),
(22783,2,723,NULL),
(22784,2,724,NULL),
(22785,2,725,NULL),
(22786,2,726,NULL),
(22787,2,727,NULL),
(26747,5,145,NULL),
(26749,5,147,NULL),
(26780,6,145,NULL),
(26782,6,147,NULL),
(28333,5,148,NULL),
(28334,5,149,NULL),
(28335,5,150,NULL),
(29211,7,434,NULL),
(29212,7,724,NULL),
(29213,7,720,NULL),
(36043,5,1017,NULL),
(36207,1,1017,NULL),
(36374,2,1017,NULL),
(36844,6,1017,NULL),
(36860,5,1036,NULL),
(37029,1,1036,NULL),
(37197,2,1036,NULL),
(37661,6,1036,NULL),
(87006,3,2196,NULL),
(87007,1,2196,NULL),
(87008,2,2196,NULL),
(87838,10,107,NULL),
(87839,10,2219,NULL),
(87840,10,2220,NULL),
(87841,10,103,NULL),
(87842,10,106,NULL),
(87843,10,2217,NULL),
(87844,10,2218,NULL),
(87845,10,108,NULL),
(87846,10,2221,NULL),
(87847,10,2222,NULL),
(87848,10,2223,NULL),
(87849,10,2224,NULL),
(87850,10,104,NULL),
(87851,10,2225,NULL),
(87852,10,105,NULL),
(87853,3,107,NULL),
(87854,3,2219,NULL),
(87855,3,2220,NULL),
(87856,3,103,NULL),
(87857,3,106,NULL),
(87858,3,2217,NULL),
(87859,3,2218,NULL),
(87860,3,108,NULL),
(87861,3,2221,NULL),
(87862,3,2222,NULL),
(87863,3,2223,NULL),
(87864,3,2224,NULL),
(87865,3,104,NULL),
(87866,3,2225,NULL),
(87867,3,105,NULL),
(87869,1,2219,NULL),
(87870,1,2220,NULL),
(87873,1,2217,NULL),
(87874,1,2218,NULL),
(87876,1,2221,NULL),
(87877,1,2222,NULL),
(87878,1,2223,NULL),
(87879,1,2224,NULL),
(87881,1,2225,NULL),
(87884,2,2219,NULL),
(87885,2,2220,NULL),
(87888,2,2217,NULL),
(87889,2,2218,NULL),
(87891,2,2221,NULL),
(87892,2,2222,NULL),
(87893,2,2223,NULL),
(87894,2,2224,NULL),
(87896,2,2225,NULL),
(87898,7,2220,NULL),
(87899,7,2221,NULL),
(87900,5,2220,NULL),
(87901,5,2221,NULL),
(87902,8,2224,NULL),
(96553,6,92,NULL),
(96554,6,91,NULL),
(96555,5,92,NULL),
(96556,5,91,NULL),
(96557,10,95,NULL),
(96558,10,91,NULL),
(96559,10,94,NULL),
(96560,10,96,NULL),
(96561,10,2429,NULL),
(96562,10,92,NULL),
(96563,10,93,NULL),
(96564,10,2428,NULL),
(96565,3,95,NULL),
(96566,3,91,NULL),
(96567,3,94,NULL),
(96568,3,96,NULL),
(96569,3,2429,NULL),
(96570,3,92,NULL),
(96571,3,93,NULL),
(96572,3,2428,NULL),
(96697,1,2428,NULL),
(96698,1,2429,NULL),
(96877,2,2428,NULL),
(96878,2,2429,NULL),
(106396,10,672,NULL),
(106397,10,62,NULL),
(107293,10,26,NULL),
(109961,6,93,NULL),
(109964,5,93,NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` (`id`, `tenant_id`, `name`, `display_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,1,'tenant_admin','Tenant Administrator','Full access to tenant resources',1,'active','2026-02-13 23:32:05','2026-02-13 23:32:05',NULL),
(2,2,'admin','Administrator','Full access',0,'active','2026-02-22 11:34:40','2026-02-22 11:34:40',NULL),
(3,NULL,'super_admin','Super Administrator','Full system access - manage roles, permissions, and users',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(4,NULL,'inspection_team','Inspection Team','View inspection requests and add inspection reports',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(5,NULL,'sales_manager','Sales Manager','Full access to leads, deals, contacts, quotations, inspection requests',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(6,NULL,'sales','Sales','Access to own leads, deals, contacts, quotations, and inspection requests only',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(7,NULL,'operations_manager','Operations Manager','Full access to Operations (work orders); view-only deals',1,'active','2026-04-30 11:09:27','2026-04-30 11:09:27',NULL),
(8,NULL,'accounts','Accounts','Full access to Accounts (invoices, receivables, payables, expenses); view-only deals',1,'active','2026-04-30 11:09:27','2026-04-30 11:09:27',NULL),
(9,NULL,'driver','Driver','Pickup and delivery driver',1,'active','2026-05-30 16:35:46','2026-05-30 16:35:46',NULL),
(10,NULL,'hr_manager','HR Manager','Full access to employees, attendance, leave and payroll',1,'active','2026-09-28 13:04:57','2026-09-28 13:04:57',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `service_interests` WRITE;
/*!40000 ALTER TABLE `service_interests` DISABLE KEYS */;
INSERT INTO `service_interests` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Waste Collection','Waste Collection',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Recycling','Recycling',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Disposal','Disposal',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'ITAD Services','ITAD Services',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Hazardous Waste','Hazardous Waste',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Consulting','Consulting',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Other','Other',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `service_interests` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `service_types` WRITE;
/*!40000 ALTER TABLE `service_types` DISABLE KEYS */;
INSERT INTO `service_types` (`id`, `name`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,'Waste Collection','Regular waste collection services',1,1,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(2,'Recycling','Recycling services for various materials',1,2,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(3,'Disposal','Waste disposal services',1,3,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(4,'ITAD Services','IT Asset Disposition services',1,4,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(5,'Hazardous Waste','Hazardous waste management',1,5,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(6,'Consulting','Environmental consulting services',1,6,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(7,'Other','Other services',1,7,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL);
/*!40000 ALTER TABLE `service_types` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'active','Active',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'inactive','Inactive',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` (`id`, `name`, `company_name`, `email`, `phone`, `address`, `city`, `country`, `trn_number`, `vat_registration_number`, `license_number`, `logo`, `status`, `subscription_plan`, `subscription_start_date`, `subscription_end_date`, `settings`, `created_at`, `updated_at`, `deleted_at`, `signature`) VALUES (1,'Demo Company','Demo Company LLC','admin@demo.com','+971501234567',NULL,NULL,'UAE',NULL,NULL,NULL,NULL,'active','basic','2026-02-13 23:32:05',NULL,'{}','2026-02-13 23:32:05','2026-02-13 23:32:05',NULL,NULL),
(2,'ClearEarth ERP','Clear Earth Recycling LLC','info@clearearth.ae','+971 569908131','#03B, P1 / Block B Dubai Industrial City, 1111\n','Dubai','UAE','TRN104042332700003','TRN104042332700003','',NULL,'active','basic',NULL,NULL,'{\"0\":\"{\",\"1\":\"\\\"\",\"2\":\"0\",\"3\":\"\\\"\",\"4\":\":\",\"5\":\"\\\"\",\"6\":\"{\",\"7\":\"\\\"\",\"8\":\",\",\"9\":\"\\\"\",\"10\":\"1\",\"11\":\"\\\"\",\"12\":\":\",\"13\":\"\\\"\",\"14\":\"}\",\"15\":\"\\\"\",\"16\":\",\",\"17\":\"\\\"\",\"18\":\"l\",\"19\":\"e\",\"20\":\"a\",\"21\":\"d\",\"22\":\"A\",\"23\":\"p\",\"24\":\"p\",\"25\":\"r\",\"26\":\"o\",\"27\":\"v\",\"28\":\"a\",\"29\":\"l\",\"30\":\"P\",\"31\":\"i\",\"32\":\"n\",\"33\":\"H\",\"34\":\"a\",\"35\":\"s\",\"36\":\"h\",\"37\":\"\\\"\",\"38\":\":\",\"39\":\"\\\"\",\"40\":\"$\",\"41\":\"2\",\"42\":\"a\",\"43\":\"$\",\"44\":\"1\",\"45\":\"0\",\"46\":\"$\",\"47\":\"y\",\"48\":\"e\",\"49\":\"Q\",\"50\":\"P\",\"51\":\"G\",\"52\":\"q\",\"53\":\"0\",\"54\":\"4\",\"55\":\".\",\"56\":\"c\",\"57\":\"5\",\"58\":\"t\",\"59\":\"E\",\"60\":\"H\",\"61\":\"E\",\"62\":\"K\",\"63\":\"D\",\"64\":\"Y\",\"65\":\"B\",\"66\":\"f\",\"67\":\"T\",\"68\":\"O\",\"69\":\".\",\"70\":\"c\",\"71\":\"0\",\"72\":\"1\",\"73\":\"4\",\"74\":\"I\",\"75\":\"f\",\"76\":\"3\",\"77\":\"3\",\"78\":\"V\",\"79\":\"B\",\"80\":\"X\",\"81\":\"b\",\"82\":\"y\",\"83\":\"g\",\"84\":\"k\",\"85\":\"N\",\"86\":\"k\",\"87\":\"V\",\"88\":\"8\",\"89\":\"o\",\"90\":\".\",\"91\":\"P\",\"92\":\"x\",\"93\":\"d\",\"94\":\"r\",\"95\":\"k\",\"96\":\"l\",\"97\":\"e\",\"98\":\"q\",\"99\":\"i\",\"100\":\"\\\"\",\"101\":\"}\",\"leadApprovalPinHash\":\"$2a$10$2lqEtp5IWjx3ngpRCEBTSe/5jfJXpq39L7edobGyYhBiM/KuobGHe\"}','2026-02-22 11:34:40','2026-11-01 16:30:36',NULL,NULL);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `terms_and_conditions` WRITE;
/*!40000 ALTER TABLE `terms_and_conditions` DISABLE KEYS */;
INSERT INTO `terms_and_conditions` (`id`, `tenant_id`, `title`, `content`, `category`, `is_default`, `status`, `created_at`, `updated_at`) VALUES (3,2,'This Transaction is subject to RCM.','Reverse Charge Mechanism','Tax',0,'active','2026-04-24 17:36:49','2026-05-09 16:54:50'),
(4,2,'Quotation is valid for 30 days.','Quotation','Service',0,'active','2026-04-24 18:46:04','2026-05-09 16:54:39'),
(6,2,'All transactions are in UAE Dirhams (AED)','*All transactions are in UAE Dirhams (AED)','sales',0,'active','2026-06-26 16:17:28','2026-06-26 16:17:28'),
(7,2,'All taxes and duties are included in the total amount.','All taxes and duties are included in the total amount.',NULL,0,'active','2026-06-26 16:18:09','2026-06-26 16:18:09'),
(8,2,'Green Certificate is complementary','Green Certificate is complementary',NULL,0,'active','2026-06-26 17:22:33','2026-06-26 17:22:33'),
(9,2,'Valid for 10 days','Valid for 10 days',NULL,0,'active','2026-07-08 15:56:41','2026-07-08 15:56:41'),
(10,2,'50% advance payment before collection.','50% advance payment before collection.',NULL,0,'active','2026-07-13 16:29:25','2026-07-13 16:29:25'),
(11,2,'WDS (Waste Disposal System) service is included in all the above charges.','WDS (Waste Disposal System) service is included in all the above charges.',NULL,0,'active','2026-07-15 11:11:01','2026-07-15 11:11:01'),
(12,2,'The quoted price is based on the total weight mentioned in the material list. Any increase in weight will result in revised charges.','The quoted price is based on the total weight mentioned in the material list. Any increase in weight will result in revised charges.',NULL,0,'active','2026-07-15 16:04:51','2026-07-15 16:04:51'),
(13,2,'The quoted price is based on the total weight mentioned in the material list. Any increase in weight will result in revised charges.','The quoted price is based on the total weight mentioned in the material list. Any increase in weight will result in revised charges.',NULL,0,'active','2026-07-15 16:40:22','2026-07-15 16:40:22'),
(14,2,'Gate pass required for collection in RAK','Gate pass required for collection in RAK',NULL,0,'active','2026-07-16 17:35:44','2026-07-16 17:35:44'),
(15,2,'Payment Method: Cash in hand only. No bank transfers or deposits.','Payment Method: Cash in hand only. No bank transfers or deposits.',NULL,0,'active','2026-07-21 12:00:05','2026-07-21 12:00:05'),
(16,2,'Minimum Chargeable Quantity: 750 KG (quantities below 750 KG will be charged as 750 KG).','Minimum Chargeable Quantity: 750 KG (quantities below 750 KG will be charged as 750 KG).',NULL,0,'active','2026-07-21 12:03:03','2026-07-21 12:03:03'),
(17,2,'Gate Pass: Gate pass should be provided by the client.','Gate Pass: Gate pass should be provided by the client.',NULL,0,'active','2026-07-21 12:04:14','2026-07-21 12:04:14'),
(18,2,'Payment: Full payment must be made before collection.','Payment: Full payment must be made before collection.',NULL,0,'active','2026-07-22 09:24:42','2026-07-22 09:24:42'),
(19,2,'The final invoice will be based on the actual trip','The final invoice will be based on the actual trip',NULL,0,'active','2026-07-22 16:42:51','2026-07-22 16:42:51'),
(20,2,'The final invoice will be based on the actual quantity.','The final invoice will be based on the actual quantity.',NULL,0,'active','2026-07-23 12:02:00','2026-07-23 12:02:00'),
(21,2,'Minimum chargeable quantity: 100 kg (Quantities below 100 kg will be charged as 100 kg)','Minimum chargeable quantity: 100 kg (Quantities below 100 kg will be charged as 100 kg)',NULL,0,'active','2026-07-24 10:43:09','2026-07-24 10:43:09'),
(22,2,'A minimum of 2 Metric Tons (MT) is mandatory. Weighing less than 2 Metric Tons (MT) will be charged at the 2 Metric Tons (MT) rate.','A minimum of 2 Metric Tons (MT) is mandatory. Weighing less than 2 Metric Tons (MT) will be charged at the 2 Metric Tons (MT) rate.',NULL,0,'active','2026-07-24 11:11:58','2026-07-24 11:11:58'),
(23,2,'Payment Terms','15 days After Invoice',NULL,0,'active','2026-07-27 11:00:37','2026-07-27 11:00:37'),
(24,2,'Payment Terms','15 Days from date of invoice',NULL,0,'active','2026-07-27 11:02:17','2026-07-27 11:02:17'),
(25,2,'Payment Terms - 15 days from the Invoice date','Payment Terms - 15 days from the Invoice date',NULL,0,'active','2026-07-27 11:06:56','2026-07-27 11:06:56'),
(26,2,'Quotation is valid for 10 days','Quotation is valid for 10 days',NULL,0,'active','2026-07-28 10:06:05','2026-07-28 10:06:05'),
(27,2,'Payment Terms - 50% Advance','Payment Terms - 50% Advance',NULL,0,'active','2026-07-28 11:36:56','2026-07-28 11:36:56'),
(28,2,'50 % balance after the Destruction process.','50 % balance after the Destruction process',NULL,0,'active','2026-07-29 14:02:07','2026-07-29 14:02:07'),
(29,2,'Quoted price is based on the quantity and cargo value provided. Any changes may result in revised charges.Quoted price is based on the quantity and cargo value provided. Any changes may result in revised charges.','Quoted price is based on the quantity and cargo value provided. Any changes may result in revised charges.',NULL,0,'active','2026-07-30 12:25:29','2026-07-30 12:25:29'),
(30,2,'Quoted price is based on the information provided. Any changes in quantity or cargo value will result in revised charges.','Quoted price is based on the information provided. Any changes in quantity or cargo value will result in revised charges.',NULL,0,'active','2026-07-30 12:39:17','2026-07-30 12:39:17'),
(31,2,'Pricing is based on 1,000 PDMs. Any variation in quantity may affect the quoted amount.','Pricing is based on 1,000 PDMs. Any variation in quantity may affect the quoted amount.',NULL,0,'active','2026-08-03 11:41:59','2026-08-03 11:41:59'),
(32,2,'Payment Terms - 100% payment upon collection','Payment Terms - 100% payment upon collection',NULL,0,'active','2026-08-03 14:48:14','2026-08-03 14:48:14'),
(33,2,'Quotation price includes VAT and any other applicable Taxes.','Quotation price includes VAT and any other applicable Taxes.',NULL,0,'active','2026-08-03 16:26:47','2026-08-03 16:26:47'),
(34,2,'Sales Terms','Valid for 1 week.',NULL,0,'active','2026-08-04 10:08:03','2026-08-04 10:08:03'),
(35,2,'Valid of 1 week','Valid for 1 week',NULL,0,'active','2026-08-04 10:09:01','2026-08-04 10:09:01'),
(36,2,'Valid for 1 week','Valid for 1 week',NULL,0,'active','2026-08-04 10:09:37','2026-08-04 10:09:37'),
(37,2,'Loading will be handled by the client.','Loading will be handled by the client.',NULL,0,'active','2026-08-05 09:47:50','2026-08-05 09:47:50'),
(38,2,'Need to be loaded by the party','Need to be loaded by the party',NULL,0,'active','2026-08-05 10:51:14','2026-08-05 10:51:14'),
(39,2,'Any additional customs duty, VAT, and government charges shall be borne solely by the client.','Any additional customs duty, VAT, and government charges shall be borne solely by the client.',NULL,0,'active','2026-08-05 11:07:11','2026-08-05 11:07:11'),
(40,2,'Any additional customs duties, VAT, taxes, or government fees, if applicable, shall be the responsibility of the client','Any additional customs duties, VAT, taxes, or government fees, if applicable, shall be the responsibility of the client',NULL,0,'active','2026-08-05 11:10:06','2026-08-05 11:10:06'),
(41,2,'Loading of materials is under the client\'s scope of work.','Loading of materials is under the client\'s scope of work.',NULL,0,'active','2026-08-07 10:22:34','2026-08-07 10:22:34'),
(42,2,'Quoted rate is based on a 3-ton pickup vehicle per trip.','Quoted rate is based on a 3-ton pickup vehicle per trip.',NULL,0,'active','2026-08-07 11:21:59','2026-08-07 11:21:59'),
(43,2,'Collection and transportation are not included in this quotation and are within the client\'s scope of work.','Collection and transportation are not included in this quotation and are within the client\'s scope of work.',NULL,0,'active','2026-08-10 16:20:40','2026-08-10 16:20:40');
/*!40000 ALTER TABLE `terms_and_conditions` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `uae_cities` WRITE;
/*!40000 ALTER TABLE `uae_cities` DISABLE KEYS */;
INSERT INTO `uae_cities` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Dubai','Dubai',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Abu Dhabi','Abu Dhabi',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Sharjah','Sharjah',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'Ajman','Ajman',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Ras Al Khaimah','Ras Al Khaimah',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Fujairah','Fujairah',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Umm Al Quwain','Umm Al Quwain',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Al Ain','Al Ain',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `uae_cities` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `units_of_measure` WRITE;
/*!40000 ALTER TABLE `units_of_measure` DISABLE KEYS */;
INSERT INTO `units_of_measure` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES (1,'Kg','Kilograms ',1,1,'2026-02-22 14:06:13','2026-02-22 14:06:13'),
(2,'Ton','Tons ',2,1,'2026-02-22 14:06:13','2026-02-22 14:06:13'),
(3,'Piece','Piece (pc)',3,1,'2026-02-22 18:06:13','2026-02-22 18:06:13'),
(4,'hour','Hour (hr)',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'day','Day',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'month','Month',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'unit','Unit',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Service','Service',8,1,'2026-02-22 18:06:13','2026-02-22 18:06:13'),
(9,'lumpsum','Lumpsum',9,1,'0000-00-00 00:00:00','0000-00-00 00:00:00'),
(10,'Per Trip','Per Trip',0,1,'2026-07-09 05:02:27','2026-07-09 05:02:27'),
(11,'Metric Tonne','Metric Tonne',0,1,'2026-07-09 05:08:33','2026-07-09 05:08:33'),
(12,'Document','Document',0,1,'2026-07-13 04:53:17','2026-07-13 04:53:17'),
(13,'Container','Container',0,1,'2026-07-20 06:08:52','2026-07-20 06:08:52'),
(15,'1.5 ton','1.5 Ton',0,1,'2026-08-05 11:58:16','2026-08-05 11:58:16'),
(16,'barrel','Barrel',0,1,'2026-08-10 11:09:28','2026-08-10 11:09:28');
/*!40000 ALTER TABLE `units_of_measure` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `work_locations` WRITE;
/*!40000 ALTER TABLE `work_locations` DISABLE KEYS */;
INSERT INTO `work_locations` (`id`, `tenant_id`, `name`, `address`, `latitude`, `longitude`, `geofence_radius_meters`, `is_active`, `created_at`, `updated_at`) VALUES (1,1,'Main Office',NULL,NULL,NULL,NULL,1,'2026-09-28 22:03:58','2026-09-28 22:03:58'),
(2,2,'Main Office',NULL,NULL,NULL,NULL,1,'2026-09-28 22:03:58','2026-09-28 22:03:58');
/*!40000 ALTER TABLE `work_locations` ENABLE KEYS */;
UNLOCK TABLES;

LOCK TABLES `work_types` WRITE;
/*!40000 ALTER TABLE `work_types` DISABLE KEYS */;
INSERT INTO `work_types` (`id`, `tenant_id`, `name`, `display_order`, `is_active`, `created_at`, `updated_at`, `is_default`) VALUES (1,2,'Pickup',0,1,'2026-04-03 18:47:45','2026-04-09 11:41:10',1),
(2,2,'Delivery',0,1,'2026-04-03 18:47:51','2026-04-09 11:41:14',1),
(3,2,'Destruction of material',0,1,'2026-04-03 18:48:16','2026-04-03 18:48:16',0),
(4,2,'Municipality Inspection',1,1,'2026-04-22 20:04:44','2026-04-22 20:04:57',0),
(5,2,'Dumber Truck Expense',0,1,'2026-05-25 17:38:44','2026-05-25 17:38:44',1),
(6,2,'Certification',2,1,'2026-06-22 16:42:02','2026-06-22 16:42:02',0);
/*!40000 ALTER TABLE `work_types` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

SET FOREIGN_KEY_CHECKS=1;
