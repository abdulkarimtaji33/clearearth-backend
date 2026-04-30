-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: clearearth_erp
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

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

--
-- Table structure for table `asset_custody`
--

DROP TABLE IF EXISTS `asset_custody`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `company_contacts`
--

DROP TABLE IF EXISTS `company_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contact_roles`
--

DROP TABLE IF EXISTS `contact_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `contact_type` enum('clients','vendors') DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `deal_images`
--

DROP TABLE IF EXISTS `deal_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deal_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deal_inspection_reports`
--

DROP TABLE IF EXISTS `deal_inspection_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deal_inspection_requests`
--

DROP TABLE IF EXISTS `deal_inspection_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `safety_tools` text DEFAULT NULL COMMENT 'JSON array of selected safety tool keys',
  `status` enum('request_submitted','team_assigned','inspection_completed','report_submitted') NOT NULL DEFAULT 'request_submitted',
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deal_items`
--

DROP TABLE IF EXISTS `deal_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `deal_items_deal_id` (`deal_id`),
  KEY `deal_items_product_service_id` (`product_service_id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deal_stages`
--

DROP TABLE IF EXISTS `deal_stages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `deal_statuses`
--

DROP TABLE IF EXISTS `deal_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deal_terms`
--

DROP TABLE IF EXISTS `deal_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deal_terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `terms_and_conditions_id` int(11) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_terms_id` (`terms_and_conditions_id`)
) ENGINE=InnoDB AUTO_INCREMENT=348 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deal_types`
--

DROP TABLE IF EXISTS `deal_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `deal_wds`
--

DROP TABLE IF EXISTS `deal_wds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deal_wds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_id` int(11) NOT NULL,
  `ref_no` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `license_no` varchar(100) NOT NULL,
  `waste_description` text NOT NULL,
  `source_process` text DEFAULT NULL,
  `package_type` varchar(100) DEFAULT NULL,
  `quantity_per_package` varchar(100) DEFAULT NULL,
  `total_weight` varchar(100) DEFAULT NULL,
  `container_no` varchar(100) NOT NULL,
  `purpose` text DEFAULT NULL,
  `bl_no` varchar(100) DEFAULT NULL,
  `bor_no` varchar(100) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_ref_no` (`ref_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deal_wds_attachments`
--

DROP TABLE IF EXISTS `deal_wds_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deal_wds_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deal_wds_id` int(11) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_wds_id` (`deal_wds_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `deals`
--

DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `status` enum('new','approved','quotation_sent','negotiation','won','lost') NOT NULL DEFAULT 'new',
  `payment_status` enum('unpaid','partial','paid') DEFAULT 'unpaid',
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
  `is_rcm_applicable` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Reverse Charge Mechanism',
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `designations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exp_task_line` (`work_order_task_expense_id`),
  KEY `idx_exp_tenant` (`tenant_id`),
  KEY `idx_exp_date` (`expense_date`),
  KEY `idx_exp_category` (`category`),
  KEY `fk_exp_user` (`created_by`),
  CONSTRAINT `fk_exp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_exp_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_exp_wote` FOREIGN KEY (`work_order_task_expense_id`) REFERENCES `work_order_task_expenses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `industry_types`
--

DROP TABLE IF EXISTS `industry_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_sources`
--

DROP TABLE IF EXISTS `lead_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  `status` enum('new','contacted','qualified','disqualified','converted') DEFAULT 'new',
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `material_types`
--

DROP TABLE IF EXISTS `material_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=233 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `migration_history`
--

DROP TABLE IF EXISTS `migration_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migration_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `migration_name` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_name` (`migration_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payment_statuses`
--

DROP TABLE IF EXISTS `payment_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'e.g., clients.create, deals.update, invoices.delete',
  `display_name` varchar(100) NOT NULL,
  `module` enum('users','roles','contacts','companies','suppliers','leads','products','deals','inspection_requests','inspection_reports') NOT NULL,
  `action` enum('create','read','update','delete','approve','export') NOT NULL,
  `description` text DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=551 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `products_services`
--

DROP TABLE IF EXISTS `products_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proforma_invoice_items`
--

DROP TABLE IF EXISTS `proforma_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `idx_pii_pi` (`proforma_invoice_id`),
  KEY `fk_pii_ps` (`product_service_id`),
  CONSTRAINT `fk_pii_pi` FOREIGN KEY (`proforma_invoice_id`) REFERENCES `proforma_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pii_ps` FOREIGN KEY (`product_service_id`) REFERENCES `products_services` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `proforma_invoices`
--

DROP TABLE IF EXISTS `proforma_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `idx_purchase_order_id` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_order_statuses`
--

DROP TABLE IF EXISTS `purchase_order_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_order_terms`
--

DROP TABLE IF EXISTS `purchase_order_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_order_terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int(11) NOT NULL,
  `terms_and_conditions_id` int(11) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_po_terms` (`purchase_order_id`,`terms_and_conditions_id`),
  KEY `idx_purchase_order_id` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `po_date` date NOT NULL,
  `expected_delivery` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `company_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_po_status` (`status`),
  KEY `idx_po_company` (`company_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotation_statuses`
--

DROP TABLE IF EXISTS `quotation_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=152 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `deal_id` int(11) NOT NULL,
  `prepared_by` int(11) NOT NULL,
  `quotation_date` date NOT NULL,
  `quotation_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'AED',
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_prepared_by` (`prepared_by`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_permission_id_role_id_unique` (`role_id`,`permission_id`),
  UNIQUE KEY `role_permissions_role_id_permission_id` (`role_id`,`permission_id`),
  KEY `role_permissions_role_id` (`role_id`),
  KEY `role_permissions_permission_id` (`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9217 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `service_interests`
--

DROP TABLE IF EXISTS `service_interests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `service_types`
--

DROP TABLE IF EXISTS `service_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `statuses`
--

DROP TABLE IF EXISTS `statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `supplier_contacts`
--

DROP TABLE IF EXISTS `supplier_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tax_invoice_items`
--

DROP TABLE IF EXISTS `tax_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `idx_tii_ti` (`tax_invoice_id`),
  KEY `fk_tii_ps` (`product_service_id`),
  CONSTRAINT `fk_tii_ps` FOREIGN KEY (`product_service_id`) REFERENCES `products_services` (`id`),
  CONSTRAINT `fk_tii_ti` FOREIGN KEY (`tax_invoice_id`) REFERENCES `tax_invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tax_invoices`
--

DROP TABLE IF EXISTS `tax_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ti_proforma` (`proforma_invoice_id`),
  UNIQUE KEY `uk_tenant_tax_number` (`tenant_id`,`tax_invoice_number`),
  KEY `idx_ti_tenant` (`tenant_id`),
  KEY `idx_ti_payment` (`payment_status`),
  KEY `fk_ti_user` (`created_by`),
  CONSTRAINT `fk_ti_proforma` FOREIGN KEY (`proforma_invoice_id`) REFERENCES `proforma_invoices` (`id`),
  CONSTRAINT `fk_ti_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_ti_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `terms_and_conditions`
--

DROP TABLE IF EXISTS `terms_and_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uae_cities`
--

DROP TABLE IF EXISTS `uae_cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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

--
-- Table structure for table `units_of_measure`
--

DROP TABLE IF EXISTS `units_of_measure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_tenant_id_email` (`tenant_id`,`email`),
  UNIQUE KEY `users_tenant_id_username` (`tenant_id`,`username`),
  KEY `users_tenant_id` (`tenant_id`),
  KEY `users_role_id` (`role_id`),
  KEY `users_status` (`status`),
  KEY `users_employee_id` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_order_task_expenses`
--

DROP TABLE IF EXISTS `work_order_task_expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
  PRIMARY KEY (`id`),
  KEY `idx_wote_task` (`work_order_task_id`),
  KEY `fk_wote_accounts_user` (`accounts_approved_by`),
  CONSTRAINT `fk_wote_accounts_user` FOREIGN KEY (`accounts_approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_wote_task` FOREIGN KEY (`work_order_task_id`) REFERENCES `work_order_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_order_tasks`
--

DROP TABLE IF EXISTS `work_order_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_order_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `work_order_id` int(11) NOT NULL,
  `type_of_work` varchar(255) DEFAULT NULL,
  `expense` decimal(15,2) DEFAULT NULL,
  `estimated_duration` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `work_type_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_work_order_tasks_wo` (`work_order_id`),
  KEY `idx_work_order_tasks_assigned` (`assigned_to`),
  KEY `idx_work_order_tasks_work_type` (`work_type_id`),
  CONSTRAINT `fk_work_order_tasks_work_type` FOREIGN KEY (`work_type_id`) REFERENCES `work_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('draft','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_work_orders_tenant` (`tenant_id`),
  KEY `idx_work_orders_deal` (`deal_id`),
  KEY `idx_work_orders_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `work_types`
--

DROP TABLE IF EXISTS `work_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'clearearth_erp'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-28 11:17:57
