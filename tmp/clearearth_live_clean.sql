-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: clearearth_erp
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

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
-- Table structure for table `accounting_periods`
--

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_periods`
--

LOCK TABLES `accounting_periods` WRITE;
/*!40000 ALTER TABLE `accounting_periods` DISABLE KEYS */;
/*!40000 ALTER TABLE `accounting_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asset_custody`
--

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

--
-- Dumping data for table `asset_custody`
--

LOCK TABLES `asset_custody` WRITE;
/*!40000 ALTER TABLE `asset_custody` DISABLE KEYS */;
/*!40000 ALTER TABLE `asset_custody` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chart_of_accounts`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chart_of_accounts`
--

LOCK TABLES `chart_of_accounts` WRITE;
/*!40000 ALTER TABLE `chart_of_accounts` DISABLE KEYS */;
INSERT INTO `chart_of_accounts` VALUES
(1,1,'1000','Cash and Cash Equivalents','asset','current_asset','debit',0,NULL,1,1,NULL,10,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(2,1,'1100','Accounts Receivable','asset','current_asset','debit',0,NULL,1,1,NULL,20,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(3,1,'1200','VAT Receivable (Input Tax)','asset','current_asset','debit',0,NULL,1,1,NULL,30,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(4,1,'1300','Prepaid Expenses','asset','current_asset','debit',0,NULL,1,1,NULL,40,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(5,1,'1510','Office Equipment â€” Cost','asset','fixed_asset','debit',0,NULL,1,1,NULL,50,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
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
(18,1,'5100','General & Administrative Expenses','expense','operating_expense','debit',0,NULL,1,1,NULL,420,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(19,1,'5200','Materials & Equipment','expense','operating_expense','debit',0,NULL,1,1,NULL,430,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(20,1,'5300','Professional Services','expense','operating_expense','debit',0,NULL,1,1,NULL,440,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(21,1,'5400','Fuel & Transport','expense','operating_expense','debit',0,NULL,1,1,NULL,450,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(22,1,'5500','Utilities','expense','operating_expense','debit',0,NULL,1,1,NULL,460,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(23,1,'5600','Finance Charges','expense','finance_cost','debit',0,NULL,1,1,NULL,470,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(24,2,'1000','Cash and Cash Equivalents','asset','current_asset','debit',0,NULL,1,1,NULL,10,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(25,2,'1100','Accounts Receivable','asset','current_asset','debit',0,NULL,1,1,NULL,20,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(26,2,'1200','VAT Receivable (Input Tax)','asset','current_asset','debit',0,NULL,1,1,NULL,30,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(27,2,'1300','Prepaid Expenses','asset','current_asset','debit',0,NULL,1,1,NULL,40,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(28,2,'1510','Office Equipment â€” Cost','asset','fixed_asset','debit',0,NULL,1,1,NULL,50,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
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
(41,2,'5100','General & Administrative Expenses','expense','operating_expense','debit',0,NULL,1,1,NULL,420,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(42,2,'5200','Materials & Equipment','expense','operating_expense','debit',0,NULL,1,1,NULL,430,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(43,2,'5300','Professional Services','expense','operating_expense','debit',0,NULL,1,1,NULL,440,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(44,2,'5400','Fuel & Transport','expense','operating_expense','debit',0,NULL,1,1,NULL,450,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(45,2,'5500','Utilities','expense','operating_expense','debit',0,NULL,1,1,NULL,460,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL),
(46,2,'5600','Finance Charges','expense','finance_cost','debit',0,NULL,1,1,NULL,470,'2026-05-25 08:09:35','2026-05-25 08:09:35',NULL);
/*!40000 ALTER TABLE `chart_of_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES
(1,2,'1','Knapp Oneill Trading',NULL,NULL,'https://www.fywirip.tv',NULL,'wyfewivyt@mailinator.com','+1 (324) 369-5819','Placeat doloremque ','Ducimus ut saepe ci','Obcaecati vel incidi',NULL,'active','2026-02-22 23:11:06','2026-02-22 23:11:06',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(2,2,'2','Harding Small Co',1,'Technology','https://www.marycicy.org.au',NULL,'tysyfudi@mailinator.com','+1 (141) 105-2988','Aliquam voluptates s','Est expedita est ni','Proident aspernatur','Officia obcaecati ut','active','2026-02-22 23:12:59','2026-02-22 23:13:31',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(3,2,'3','Morin Goodwin LLC',4,NULL,'https://www.hij.ws',NULL,'gipege@mailinator.com','+1 (399) 495-9256','UAE',NULL,'Rerum facere fugit ',NULL,'active','2026-02-24 15:18:20','2026-02-24 15:18:28',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(4,2,'4','Test company',5,NULL,NULL,NULL,NULL,'0562933733','UAE',NULL,NULL,NULL,'active','2026-02-27 13:48:12','2026-02-27 13:48:19',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(5,2,'COM-MMBSHDRW-5072707A','ADONC',6,'Finance','',NULL,'adonc.uae@gmail.com','098987987','UAE','Abu Dhabi','mussafah','','active','2026-03-04 12:43:09','2026-03-05 09:44:30','2026-03-05 09:44:30','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(6,2,'COM-MMD1MSSA-7FE17BEE','Codegnan pvt',8,'Education','',NULL,'codegnan@destinations.com','987987987','UAE','Abu Dhabi','Al mirfa','','active','2026-03-05 09:47:05','2026-03-05 14:29:39','2026-03-05 14:29:39','individual',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(7,2,'COM-MMD2E06H-DB3593D5','TSC',9,'Technology','',NULL,'TSCgroups@gmail.com','567567567','UAE','Ajman','ajman','','active','2026-03-05 10:08:14','2026-03-05 14:29:33','2026-03-05 14:29:33','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(8,2,'COM-MMD84H02-380C4664','Al Sama',12,'Construction',NULL,NULL,'alsama@gmail.com','87878787','UAE','Dubai','international city',NULL,'active','2026-03-05 12:48:47','2026-03-05 14:29:27','2026-03-05 14:29:27','organization',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(9,2,'COM-MMD9HPAT-D3093BE1','Chavez Mckenzie Inc',13,NULL,'https://www.tuvoha.com',NULL,'hotorery@mailinator.com',NULL,'UAE','Dubai','Eveniet expedita do',NULL,'active','2026-03-05 13:27:04','2026-03-05 14:29:18','2026-03-05 14:29:18','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(10,2,'10','testabc',15,'Technology',NULL,NULL,NULL,'1234567890','UAE','Dubai','abcd',NULL,'active','2026-03-05 13:30:10','2026-03-05 13:30:32',NULL,'organization',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(11,2,'COM-MMDBSGJG-6F24E37E','Codegnan',16,'Education','',NULL,'codegnan@destinations.com','4504504500','UAE','Umm Al Quwain','al quwain','','active','2026-03-05 14:31:25','2026-03-06 09:46:00','2026-03-06 09:46:00','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(12,2,'COM-MMDBZ21K-3C402301','TSC',17,'Technology','',NULL,'tscgroups@gmail.com','769088709','UAE','Abu Dhabi','mirfa','','active','2026-03-05 14:36:33','2026-03-06 09:46:06','2026-03-06 09:46:06','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(13,2,'COM-MMDD7QXS-B6A0E2F6','al sama',18,'Construction',NULL,NULL,'alsama@gmail.com','8211231313123','UAE','Dubai','Inter City',NULL,'active','2026-03-05 15:11:18','2026-03-06 09:46:12','2026-03-06 09:46:12','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(14,2,'COM-MMDDDO7H-E531640E','Prasad N',19,NULL,NULL,NULL,'prasadn@gmail.com',NULL,'UAE','Dubai','morocco',NULL,'active','2026-03-05 15:15:54','2026-03-06 09:46:18','2026-03-06 09:46:18','individual',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(15,2,'COM-MMEH52MQ-77A9AC50','TSC',20,'Technology',NULL,NULL,'tscgroups@gmail.com','878769675','UAE','Dubai','madhapur',NULL,'active','2026-03-06 09:48:58','2026-03-06 18:49:55','2026-03-06 18:49:55','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(16,2,'COM-MMEH8BAH-FE264503','Codegnan',21,'','',NULL,'codegnan@destinations.com','87687676','UAE','Abu Dhabi','03','','active','2026-03-06 09:51:29','2026-03-06 18:50:07','2026-03-06 18:50:07','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(17,2,'17','TCS',22,'Technology','',NULL,'tcsgroups@gmail.com','948504275','UAE','Dubai','Madhapur','','active','2026-03-06 19:03:04','2026-03-06 19:05:19',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(18,2,'18','Codegnan Destinations',23,NULL,NULL,NULL,'codegnan@destinations.com','875962750375','UAE','Dubai','kphb',NULL,'active','2026-03-06 19:10:08','2026-03-06 19:10:08',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(19,2,'19','test company',25,'Technology',NULL,NULL,'abdulkareemmain@gmail.com','0562933739','UAE','Dubai','Jumeirah Lake Towers',NULL,'active','2026-03-06 23:43:02','2026-03-06 23:49:29',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(20,2,'20','checking',27,NULL,NULL,NULL,'abc@abc.com',NULL,'UAE',NULL,NULL,NULL,'active','2026-03-08 14:45:12','2026-03-08 14:46:08',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(21,2,'21','new company',28,'Technology',NULL,NULL,'new@gmail.com','1234567890','UAE','Dubai','asdfghjkl',NULL,'active','2026-03-08 15:59:32','2026-03-08 16:00:12',NULL,'organization',10,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(22,2,'22','Aramco',29,'Energy',NULL,NULL,'aramcooils@gmail.com','8748974534','UAE','Umm Al Quwain','umm al quwain',NULL,'active','2026-03-08 21:52:35','2026-03-08 21:52:44',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(23,2,'23','PSL',30,NULL,NULL,NULL,'PSL@gmail.com','99999988','UAE','Dubai','nyc',NULL,'active','2026-03-08 21:57:06','2026-03-08 21:57:06',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(24,2,'24','Pfizer',31,'Hospitality',NULL,NULL,'Pfizer@gmail.com','732469234','UAE','Abu Dhabi','mussafah',NULL,'active','2026-03-08 22:01:47','2026-03-08 22:01:47',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(25,2,'25','Al Sama',32,'Construction',NULL,NULL,'Alsama@gmail.com','3475834579','UAE','Dubai','International city',NULL,'active','2026-03-09 12:54:31','2026-03-09 12:54:38',NULL,'individual',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(26,2,'26','AS Gates& Barriers',33,'Construction',NULL,NULL,'asgb@gmail.com','45353453','UAE','Dubai','Morocco city',NULL,'active','2026-03-09 13:12:20','2026-03-09 13:12:23',NULL,'individual',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(27,2,'27','SHOBA',34,'Construction',NULL,NULL,'shobagroups@gmail.com','3425545','UAE','Dubai','Dubai',NULL,'active','2026-03-09 14:23:41','2026-03-09 14:23:56',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(28,2,'28','test vendor123',NULL,'Manufacturing',NULL,NULL,NULL,'6456465456','UAE','Dubai','asdfghjk',NULL,'active','2026-03-09 14:25:03','2026-03-09 14:25:03',NULL,'organization',NULL,'55555555',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(29,2,'COM-MMX8JQP9-1109D720','Test 1',38,'','',NULL,'alisha011@gmail.com','','UAE','Dubai','Dubai','','active','2026-03-19 12:56:03','2026-03-19 12:59:50','2026-03-19 12:59:50','organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(30,2,'30','134567',NULL,NULL,NULL,NULL,NULL,'23456787654321','UAE','Dubai','Dubai',NULL,'active','2026-03-24 20:39:03','2026-03-24 20:39:03',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(31,2,'31','Stark Industries',39,'Technology','',NULL,'starkgroups@gmail.com','3423456345','UAE','Dubai','hfjhk, hjjgf,jyj ,jhffhhf 8878, Bur Juman','','active','2026-03-26 21:38:02','2026-05-22 12:16:31',NULL,'organization',NULL,'115441124653','documents/cef608d9-356e-4977-b625-88d4cc90af0b.pdf','234567890','asdfghjkl','2022-10-08','documents/429612b0-44bf-4a89-acfb-f69103bbe60c.pdf','1234567890','documents/862dba5b-fd16-4d9b-81de-a3dde7bea895.pdf','sample bank','1234567890'),
(32,2,'32','SVC groups',41,'Energy',NULL,NULL,'svcgroups@gmail.com','01901900','UAE','Abu Dhabi','al dhafra',NULL,'active','2026-04-01 12:02:48','2026-04-01 12:02:58',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(33,2,'33','REC Industries',42,'Manufacturing',NULL,NULL,'recgroups@gmail.com','875878585','UAE','Abu Dhabi','al dhafra',NULL,'active','2026-04-01 23:12:00','2026-04-01 23:12:14',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(34,2,'34','SVL Groups',43,NULL,NULL,NULL,'svl@gmail.com','587349582','UAE','Dubai','DIP',NULL,'active','2026-04-14 10:41:55','2026-04-14 10:42:13',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(35,2,'35','Test Company',NULL,NULL,NULL,NULL,NULL,'2345676543we456fr','UAE','Dubai','Dubai',NULL,'active','2026-04-21 13:21:58','2026-04-21 13:21:58',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(36,2,'36','Novotel Hotels',45,NULL,NULL,NULL,'info@novotell.com','+97145677117','UAE','Dubai','Bur Dubai, Dubai',NULL,'active','2026-04-22 20:48:13','2026-04-22 20:48:27',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(37,2,'37','Test',NULL,'Manufacturing',NULL,NULL,NULL,'9876456789ijlll','UAE','Abu Dhabi','Abu Dhabi',NULL,'active','2026-05-02 19:28:09','2026-05-02 19:28:09',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(38,2,'38','Test 101',NULL,'Manufacturing',NULL,NULL,NULL,'kjhgfg987656789poi','UAE','Dubai','Dubai',NULL,'active','2026-05-02 19:29:16','2026-05-02 19:29:16',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(39,2,'39','NSA',47,'','',NULL,'NSA@gmail.com','9121518213','UAE','Dubai','123 wisteria lane','','active','2026-05-20 07:19:59','2026-05-20 07:27:53',NULL,'organization',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(40,2,'40','independence inn',53,NULL,NULL,NULL,'independence@gmail.com','971540056789','UAE','Dubai','lakeview  road',NULL,'active','2026-05-20 13:28:09','2026-05-20 13:28:53',NULL,'organization',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(41,2,'41','move n pick',54,NULL,NULL,NULL,'movenpick@gmail.com','97152300146','UAE','Dubai','3rd westknoll road',NULL,'active','2026-05-20 13:34:07','2026-05-20 13:34:07',NULL,'organization',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(42,2,'42','central park',56,NULL,NULL,NULL,'centralpark@gmail.com','971540060012','UAE','Dubai','3rd lakeview junction',NULL,'active','2026-05-20 14:27:59','2026-05-20 14:28:40',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(43,2,'43','dragon inn',58,NULL,NULL,NULL,'dragoninn@gmail.com','971533233561','UAE','Dubai','456 west lane',NULL,'active','2026-05-20 14:32:47','2026-05-20 14:32:47',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(44,2,'44','V Groups',61,NULL,NULL,NULL,'Vgroupsindustries@gmail.com','+971 604568934','UAE','Dubai','Al Qusais, Dubai',NULL,'active','2026-05-22 09:36:27','2026-05-22 09:36:45',NULL,'organization',6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_contacts`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_contacts`
--

LOCK TABLES `company_contacts` WRITE;
/*!40000 ALTER TABLE `company_contacts` DISABLE KEYS */;
INSERT INTO `company_contacts` VALUES
(1,2,1,'Sales',0,'2026-02-22 23:12:59','2026-02-22 23:12:59','2026-02-22 23:13:31'),
(4,3,4,NULL,1,'2026-02-24 15:18:28','2026-02-24 15:18:28',NULL),
(5,4,5,NULL,1,'2026-02-27 13:48:19','2026-02-27 13:48:19','2026-03-19 12:52:57'),
(7,5,6,'Management',1,'2026-03-04 12:46:57','2026-03-04 12:46:57','2026-03-05 09:44:30'),
(9,6,8,NULL,1,'2026-03-05 09:48:17','2026-03-05 09:48:17','2026-03-05 14:29:39'),
(10,7,9,NULL,1,'2026-03-05 11:05:45','2026-03-05 11:05:45','2026-03-05 14:29:33'),
(11,8,12,NULL,1,'2026-03-05 12:48:51','2026-03-05 12:48:51','2026-03-05 14:29:27'),
(12,9,13,NULL,1,'2026-03-05 13:27:04','2026-03-05 13:27:04','2026-03-05 14:29:18'),
(13,10,15,NULL,1,'2026-03-05 13:30:32','2026-03-05 13:30:32',NULL),
(15,11,16,'Technical',1,'2026-03-05 14:35:07','2026-03-05 14:35:07','2026-03-06 09:46:00'),
(17,12,17,'Technical',1,'2026-03-05 15:05:40','2026-03-05 15:05:40','2026-03-06 09:46:06'),
(18,13,18,NULL,1,'2026-03-05 15:11:35','2026-03-05 15:11:35','2026-03-06 09:46:12'),
(19,14,19,NULL,1,'2026-03-05 15:15:54','2026-03-05 15:15:54','2026-03-06 09:46:18'),
(20,15,20,NULL,1,'2026-03-06 09:49:06','2026-03-06 09:49:06','2026-03-06 18:49:55'),
(22,16,21,'Management',1,'2026-03-06 09:52:00','2026-03-06 09:52:00','2026-03-06 18:50:07'),
(24,17,22,'Technical',1,'2026-03-06 19:05:19','2026-03-06 19:05:19',NULL),
(25,18,23,'Management',1,'2026-03-06 19:10:08','2026-03-06 19:10:08',NULL),
(26,19,25,NULL,1,'2026-03-06 23:49:29','2026-03-06 23:49:29',NULL),
(27,20,27,NULL,1,'2026-03-08 14:46:08','2026-03-08 14:46:08',NULL),
(28,21,28,NULL,1,'2026-03-08 16:00:12','2026-03-08 16:00:12',NULL),
(29,22,29,NULL,1,'2026-03-08 21:52:44','2026-03-08 21:52:44',NULL),
(30,23,30,'Management',1,'2026-03-08 21:57:06','2026-03-08 21:57:06',NULL),
(31,24,31,NULL,1,'2026-03-08 22:01:47','2026-03-08 22:01:47',NULL),
(32,25,32,NULL,1,'2026-03-09 12:54:38','2026-03-09 12:54:38',NULL),
(33,26,33,NULL,1,'2026-03-09 13:12:23','2026-03-09 13:12:23',NULL),
(34,27,34,NULL,1,'2026-03-09 14:23:56','2026-03-09 14:23:56',NULL),
(43,29,36,'Technical',0,'2026-03-19 12:58:03','2026-03-19 12:58:03','2026-03-19 12:59:50'),
(44,29,38,NULL,1,'2026-03-19 12:58:04','2026-03-19 12:58:04','2026-03-19 12:59:50'),
(46,32,41,NULL,1,'2026-04-01 12:02:58','2026-04-01 12:02:58',NULL),
(47,33,42,NULL,1,'2026-04-01 23:12:14','2026-04-01 23:12:14',NULL),
(49,34,43,NULL,1,'2026-04-14 10:42:13','2026-04-14 10:42:13',NULL),
(50,35,44,NULL,1,'2026-04-21 13:28:07','2026-04-21 13:28:07','2026-04-21 13:29:18'),
(51,36,45,NULL,1,'2026-04-22 20:48:27','2026-04-22 20:48:27',NULL),
(54,39,47,'Technical',1,'2026-05-20 07:28:23','2026-05-20 07:28:23',NULL),
(55,40,53,NULL,1,'2026-05-20 13:28:53','2026-05-20 13:28:53',NULL),
(56,41,53,'Finance',0,'2026-05-20 13:34:07','2026-05-20 13:34:07',NULL),
(57,41,54,'Operations',1,'2026-05-20 13:34:07','2026-05-20 13:34:07',NULL),
(58,42,56,NULL,1,'2026-05-20 14:28:40','2026-05-20 14:28:40',NULL),
(59,43,57,NULL,0,'2026-05-20 14:32:47','2026-05-20 14:32:47',NULL),
(60,43,58,NULL,1,'2026-05-20 14:32:47','2026-05-20 14:32:47',NULL),
(61,44,61,NULL,1,'2026-05-22 09:36:45','2026-05-22 09:36:45',NULL),
(62,31,39,NULL,1,'2026-05-22 12:16:31','2026-05-22 12:16:31',NULL);
/*!40000 ALTER TABLE `company_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_roles`
--

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

--
-- Dumping data for table `contact_roles`
--

LOCK TABLES `contact_roles` WRITE;
/*!40000 ALTER TABLE `contact_roles` DISABLE KEYS */;
INSERT INTO `contact_roles` VALUES
(1,'Sales','Sales',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Finance','Finance',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'HR','HR',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'Operations','Operations',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Technical','Technical',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Management','Management',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Other','Other',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `contact_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES
(1,2,'1','Elizabeth','Contreras','wopy@mailinator.com','+1 (883) 267-9465','Voluptas aut eiusmod',NULL,'Nostrum dicta magni ','Magni exercitation e','active',NULL,'2026-02-22 23:11:17','2026-02-22 23:11:17',NULL,'Dolor in voluptatem ',1,NULL,NULL,NULL),
(2,2,'2','Bethany','French','raqexoqyr@mailinator.com','+1 (204) 445-4255','Vel temporibus natus',NULL,'Consectetur odit lib','Dolores voluptas asp','active',NULL,'2026-02-23 00:48:22','2026-02-23 00:48:22',NULL,NULL,2,NULL,NULL,NULL),
(3,2,'3','saleem','javed',NULL,'12345678',NULL,NULL,NULL,NULL,'active',NULL,'2026-02-23 02:12:40','2026-02-23 02:12:40',NULL,'Managing Director',2,NULL,NULL,NULL),
(4,2,'4','Karyn','Campos','kavysy@mailinator.com','+1 (244) 761-6436','Hic numquam et ipsa',NULL,'Praesentium quas vol','Non laboris itaque p','active',NULL,'2026-02-24 15:18:28','2026-02-24 15:18:28',NULL,NULL,3,NULL,NULL,NULL),
(5,2,'5','Test User','Testing','abdulkareemmain@gmail.com','0562933739','','','','','active','clients','2026-02-27 13:48:19','2026-03-19 12:52:57',NULL,'',4,NULL,NULL,NULL),
(6,2,'6','Saleem','bakhtal',NULL,'123123123',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-04 12:43:22','2026-03-04 12:46:57',NULL,'Manager',5,NULL,NULL,NULL),
(7,2,'CON-MMBSRVJC-76274F85','code','gnan','codegnan@gmail.com','123123123',NULL,NULL,'sales',NULL,'active',NULL,'2026-03-04 12:51:19','2026-03-05 09:44:10','2026-03-05 09:44:10',NULL,NULL,NULL,NULL,NULL),
(8,2,'8','Saketh','G','codegnan@destinations.com','123123123','','','','','active','clients','2026-03-05 09:47:18','2026-03-05 09:48:17',NULL,'Director',6,NULL,NULL,NULL),
(9,2,'9','Krithi','Vasan','kvasan@gmail.com','23123123','','','IT','','active','vendors','2026-03-05 09:52:09','2026-03-05 11:05:45',NULL,'Manager',7,NULL,NULL,NULL),
(10,2,'10','alex','williams','awiiliams@gmail.com','765765765',NULL,NULL,'LAW',NULL,'active',NULL,'2026-03-05 10:21:17','2026-03-05 10:21:17',NULL,'Assistant Manager',NULL,NULL,NULL,NULL),
(11,2,'11','hv','spec','hv@gmail.com','765765765',NULL,NULL,'Consultancy',NULL,'active',NULL,'2026-03-05 10:22:58','2026-03-05 10:22:58',NULL,'Consultant',NULL,NULL,NULL,NULL),
(12,2,'12','Shiva','P',NULL,'654654654',NULL,NULL,NULL,NULL,'active','clients','2026-03-05 12:48:51','2026-03-05 12:48:51',NULL,'Managing Director',8,NULL,NULL,NULL),
(13,2,'13','Prasad','N',NULL,'7373737373',NULL,NULL,NULL,NULL,'active','vendors','2026-03-05 12:50:12','2026-03-05 13:27:04',NULL,'Engineer',9,NULL,NULL,NULL),
(14,2,'14','Imani',NULL,'sesy@mailinator.com','+1 (291) 838-5536',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-05 13:26:19','2026-03-05 13:26:19',NULL,NULL,6,NULL,NULL,NULL),
(15,2,'15','jameel','lateef','abc@abc.com','1234567890',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-05 13:30:32','2026-03-05 13:30:32',NULL,'Managing Director',10,NULL,6,NULL),
(16,2,'CON-MMDBSLPK-F5A21C67','Saketh','','sakethgnan@gmail.com','098098090','','','','','active','clients','2026-03-05 14:31:32','2026-03-06 09:47:06','2026-03-06 09:47:06','Managing Director',11,NULL,NULL,NULL),
(17,2,'CON-MMDC15JZ-3D49E426','Kriti','sanon','kriti321@gmail.com','37462384683','','','tech','','active','clients','2026-03-05 14:38:11','2026-03-06 09:47:00','2026-03-06 09:47:00','Team Leader',12,NULL,NULL,NULL),
(18,2,'CON-MMDD83TQ-CD0A1F3D','Siva','P','sivap@gmail.com','8768768667',NULL,NULL,NULL,NULL,'active','vendors','2026-03-05 15:11:35','2026-03-06 09:46:54','2026-03-06 09:46:54','Managing Director',13,NULL,NULL,NULL),
(19,2,'CON-MMDDCWYO-38CF4939','Prasad N','','prasadn@gmail.com','65757899879','','','','','active','vendors','2026-03-05 15:15:19','2026-03-06 09:46:47','2026-03-06 09:46:47','Engineer',14,NULL,NULL,NULL),
(20,2,'CON-MMEH590Y-2C0C91D4','Krithi','vasan','krithi@gmail.com','765675765','','','','','active','clients','2026-03-06 09:49:06','2026-03-06 18:51:13','2026-03-06 18:51:13','CEO',15,NULL,NULL,NULL),
(21,2,'CON-MMEH81X6-CF681058','Saketh',NULL,'saketh@gmail.com','908964334',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-06 09:51:17','2026-03-06 18:50:45','2026-03-06 18:50:45','CEO',16,NULL,NULL,NULL),
(22,2,'22','Kriti','vasan','krithitcs@gmail.com','7365745032','','','','','active','vendors','2026-03-06 19:03:24','2026-03-06 19:06:32',NULL,'CEO',17,NULL,NULL,NULL),
(23,2,'23','Saketh','','sakethg@gmail.com','47349625','','','','','active','clients','2026-03-06 19:09:30','2026-03-06 19:10:47',NULL,'CEO',18,NULL,NULL,NULL),
(24,2,'24','Eaton','Pierce','fosojacyfy@mailinator.com','1234567890',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-06 23:40:17','2026-03-06 23:40:17',NULL,NULL,18,NULL,NULL,NULL),
(25,2,'25','Susan',NULL,'qonu@mailinator.com','5666789',NULL,NULL,NULL,NULL,'active','clients','2026-03-06 23:49:29','2026-03-06 23:49:29',NULL,'Director',19,NULL,NULL,NULL),
(26,2,'26','Galvin',NULL,'jysaz@mailinator.com','+1 (523) 667-7327',NULL,NULL,'Commodo soluta venia',NULL,'active',NULL,'2026-03-06 23:50:23','2026-03-06 23:50:23',NULL,NULL,NULL,NULL,NULL,NULL),
(27,2,'27','test contact',NULL,'abdulkareemmain1@gmail.com','0562933739',NULL,NULL,NULL,NULL,'active','vendors','2026-03-08 14:46:08','2026-03-08 14:46:08',NULL,'CEO',20,NULL,NULL,NULL),
(28,2,'28','checking','abc','a5@gmail.com','234567890',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-08 16:00:12','2026-03-08 16:00:12',NULL,'Manager',21,NULL,10,NULL),
(29,2,'29','John','Greesham','john@gmail.com','579853433','','','','','active','vendors','2026-03-08 21:52:44','2026-03-08 21:52:58',NULL,'Executive',22,NULL,NULL,NULL),
(30,2,'30','Harvey ','Specter','harveys@gmail.com','31243243213','','','','','active','clients','2026-03-08 21:56:52','2026-03-08 21:57:37',NULL,'Director',23,NULL,NULL,NULL),
(31,2,'31','Tony','G','tony@gmail.com','73497342234',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-08 22:01:32','2026-03-08 22:01:47',NULL,'CEO',24,NULL,NULL,NULL),
(32,2,'32','Prasad N',NULL,NULL,'657657658',NULL,NULL,NULL,NULL,'active','vendors','2026-03-09 12:54:38','2026-03-09 12:54:38',NULL,'Executive',25,NULL,NULL,NULL),
(33,2,'33','Ponnada','Shankar','pshankar@gmail.com','58340958345','','','','','active','vendors','2026-03-09 13:12:23','2026-03-09 14:06:28',NULL,'Managing Director',26,NULL,NULL,NULL),
(34,2,'34','Naidu ','G','naidugm@gmail.com','487328947',NULL,NULL,NULL,NULL,'active','vendors','2026-03-09 14:23:56','2026-03-09 14:23:56',NULL,'General Manager',27,NULL,NULL,NULL),
(35,2,'35','Silvaraj','Jain','silva@evogreen.com','0545335333',NULL,NULL,NULL,NULL,'active','vendors','2026-03-10 12:48:46','2026-03-10 12:50:33',NULL,'Manager',NULL,NULL,NULL,6),
(36,2,'36','Alisha','sk',NULL,'98765434567',NULL,NULL,NULL,NULL,'active','clients','2026-03-19 12:55:41','2026-03-19 12:57:17',NULL,'Manager',NULL,NULL,NULL,NULL),
(37,2,'37','Alisha','sk',NULL,'y6ttui98765678i',NULL,NULL,NULL,NULL,'active','clients','2026-03-19 12:56:42','2026-03-19 12:56:42',NULL,'Manager',NULL,NULL,NULL,NULL),
(38,2,'38','Alisha','sk',NULL,'12345678tf',NULL,NULL,NULL,NULL,'active','clients','2026-03-19 12:57:10','2026-03-19 12:58:03',NULL,NULL,29,NULL,NULL,NULL),
(39,2,'39','Robert ','Downey','robertd@gmail.com','978658789',NULL,NULL,NULL,NULL,'active','clients','2026-03-26 21:38:08','2026-05-22 12:16:31',NULL,'General Manager',31,NULL,NULL,NULL),
(40,2,'40','Charles','Forstman',NULL,'82489023',NULL,NULL,NULL,NULL,'active','vendors','2026-03-26 21:49:55','2026-03-26 21:49:55',NULL,'CEO',NULL,NULL,NULL,7),
(41,2,'41','John','Ibrahim',NULL,'75847930',NULL,NULL,NULL,NULL,'active','clients','2026-04-01 12:02:58','2026-04-01 12:02:58',NULL,'Executive',32,NULL,NULL,NULL),
(42,2,'42','S','Kumar','skumar@gmail.com','32449833',NULL,NULL,NULL,NULL,'active','clients','2026-04-01 23:12:14','2026-04-01 23:12:14',NULL,'CEO',33,NULL,NULL,NULL),
(43,2,'43','Ram','K','ram@gmil.com','59683096734',NULL,NULL,NULL,NULL,'active','clients','2026-04-14 10:42:13','2026-04-14 10:42:13',NULL,'Managing Director',34,NULL,NULL,NULL),
(44,2,'44','Test User','Contact','admin@clearearth.com','23456787654098767890',NULL,NULL,NULL,NULL,'active','clients','2026-04-21 13:18:56','2026-04-21 13:29:25','2026-04-21 13:29:25','',NULL,NULL,NULL,NULL),
(45,2,'45','Riya','Rajan','riya@novotell.com','+971556677881',NULL,NULL,NULL,NULL,'active','clients','2026-04-22 20:48:27','2026-04-22 20:48:27',NULL,'Manager',36,NULL,NULL,NULL),
(46,2,'46','Test','1','admin@clearearth.com','23456787654098767890',NULL,NULL,NULL,NULL,'active','clients','2026-05-02 19:05:26','2026-05-02 19:10:46',NULL,'',NULL,NULL,NULL,3),
(47,2,'47','Regina','Phelange','Regina@paragon.com','9876543210',NULL,NULL,NULL,NULL,'active','clients','2026-05-20 07:18:10','2026-05-20 07:28:23',NULL,'Manager',39,NULL,6,NULL),
(48,2,'48','ken ','adams','kenadams@gmail.com','9715456879',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 07:22:04','2026-05-20 07:22:04',NULL,'Assistant Manager',NULL,NULL,6,NULL),
(49,2,'49','amy','hudson','amy.h@gmail.com','97154562389',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 07:25:09','2026-05-20 07:25:09',NULL,'Director',NULL,NULL,6,NULL),
(50,2,'50','ben','chris','ben@gmail.com','97156238456',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 07:48:58','2026-05-20 07:48:59',NULL,'Manager',NULL,NULL,6,NULL),
(51,2,'51','sam','smith','smith@gmail.com','971545689237',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 07:49:43','2026-05-20 07:49:43',NULL,'Managing Director',NULL,NULL,6,NULL),
(52,2,'52','pete','andre','andrepete@gmail.com','971555238946',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 07:50:53','2026-05-20 07:50:53',NULL,'Director',NULL,NULL,6,NULL),
(53,2,'53','Patt','Smith','independence@gmail.com','97154008976',NULL,NULL,NULL,NULL,'active','clients','2026-05-20 13:28:52','2026-05-20 13:28:53',NULL,'Managing Director',40,NULL,6,NULL),
(54,2,'54','pete','sampras','pete@gmail.com','97155600236',NULL,NULL,NULL,NULL,'active','clients','2026-05-20 13:33:58','2026-05-20 13:34:07',NULL,'Manager',41,NULL,6,NULL),
(55,2,'55','steffi','graf','graf@gmail.com','97158523697',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 13:36:34','2026-05-20 13:36:34',NULL,'Senior Executive',NULL,NULL,6,NULL),
(56,2,'56','sookie','James','centralpark@gmail.com','97154006000',NULL,NULL,NULL,NULL,'active','clients','2026-05-20 14:28:40','2026-05-20 14:28:40',NULL,'Director',42,NULL,NULL,NULL),
(57,2,'57','michelle','Tanner','tanner@gmail.com','97158965213',NULL,NULL,NULL,NULL,'active','clients','2026-05-20 14:30:47','2026-05-20 14:30:47',NULL,'Manager',NULL,NULL,NULL,NULL),
(58,2,'58','richard','webber','webber@gmail.com','97156644887',NULL,NULL,NULL,NULL,'active','clients','2026-05-20 14:32:40','2026-05-20 14:32:47',NULL,'Supervisor',43,NULL,NULL,NULL),
(59,2,'59','emily ','gilmore','gilmore@gmail.com','97158795641',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 14:35:24','2026-05-20 14:35:24',NULL,'Administrator',NULL,NULL,NULL,NULL),
(60,2,'60','luke','danes','luke@gmail.com','97154897561',NULL,NULL,NULL,NULL,'active','vendors','2026-05-20 20:00:51','2026-05-20 20:00:51',NULL,'General Manager',NULL,NULL,NULL,NULL),
(61,2,'61','Vincent','G','vincentgarry@gmail.com','+971 540934093',NULL,NULL,NULL,NULL,'active','clients','2026-05-22 09:36:45','2026-05-22 09:36:45',NULL,'Managing Director',44,NULL,6,NULL);
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `countries`
--

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

--
-- Dumping data for table `countries`
--

LOCK TABLES `countries` WRITE;
/*!40000 ALTER TABLE `countries` DISABLE KEYS */;
INSERT INTO `countries` VALUES
(1,'UAE','United Arab Emirates',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `countries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_images`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_images`
--

LOCK TABLES `deal_images` WRITE;
/*!40000 ALTER TABLE `deal_images` DISABLE KEYS */;
INSERT INTO `deal_images` VALUES
(1,6,'images/45f34a82-a469-4b5c-985d-9a20abc895fd.png',0,'2026-02-27 11:55:20','2026-02-27 11:55:20',NULL),
(2,6,'images/1845f8db-b414-4f82-a814-1ec45cd40ed6.png',1,'2026-02-27 11:55:20','2026-02-27 11:55:20',NULL),
(3,6,'images/e9f06979-fdc2-42d7-80ec-d85932bb8e77.png',2,'2026-02-27 11:55:20','2026-02-27 11:55:20',NULL),
(4,7,'images/49f9e150-5b40-43cc-8fbc-45f887fbe042.png',0,'2026-02-27 13:53:20','2026-02-27 13:53:20',NULL),
(5,7,'images/e6c901b8-68cc-4c08-98d9-ea3735934cae.png',1,'2026-02-27 13:53:20','2026-02-27 13:53:20',NULL),
(6,7,'images/fb8dd6d4-8c81-4423-a808-ec8fcd324283.png',2,'2026-02-27 13:53:20','2026-02-27 13:53:20',NULL),
(7,10,'images/f30b6db8-ae1d-4c49-99b0-d9d46fb31318.jpeg',0,'2026-03-06 23:47:16','2026-03-06 23:47:16',NULL),
(13,12,'images/2c6d80dd-d4c6-483c-a94e-cc5306e15683.png',0,'2026-03-08 22:15:43','2026-03-08 22:15:43',NULL),
(14,18,'images/12623125-0a85-4788-b502-f71d2d4bc8fe.jpg',0,'2026-03-26 21:42:34','2026-03-26 21:42:34',NULL),
(18,3,'images/75b9add9-93fe-4655-b9ae-79a1bab72e3b.jpg',0,'2026-04-02 00:03:32','2026-04-02 00:03:32',NULL),
(20,5,'images/43186262-decd-494d-98d7-540985ec2b72.jpg',0,'2026-04-03 13:52:06','2026-04-03 13:52:06',NULL),
(25,11,'images/9cb2cb70-709d-4471-b39e-814730e2d42a.png',0,'2026-04-30 13:37:54','2026-04-30 13:37:54',NULL),
(26,11,'images/4ce68463-093f-4788-b970-69e1071498eb.jpeg',1,'2026-04-30 13:37:54','2026-04-30 13:37:54',NULL),
(28,20,'images/dde39301-08e4-44a7-be08-dc4943286b9e.jpeg',0,'2026-05-09 18:47:20','2026-05-09 18:47:20',NULL),
(29,20,'images/445f1e2a-d0b1-4121-b1c5-19ddcf660769.jpg',1,'2026-05-09 18:47:20','2026-05-09 18:47:20',NULL),
(30,26,'images/4002b492-e17c-479c-8578-e0488da196a6.jpg',0,'2026-05-22 09:45:45','2026-05-22 09:45:45',NULL);
/*!40000 ALTER TABLE `deal_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_inspection_reports`
--

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
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_inspection_reports`
--

LOCK TABLES `deal_inspection_reports` WRITE;
/*!40000 ALTER TABLE `deal_inspection_reports` DISABLE KEYS */;
INSERT INTO `deal_inspection_reports` VALUES
(1,6,'2026-02-12 15:00:00',15.00,'tons','unpacked','3 ton',15000.00,'[\"images/3ac7b943-f91f-48cc-95c8-77092cfd2b1a.png\"]',2,2,'abcd','2026-02-27 12:13:50','2026-02-27 12:13:50',NULL),
(2,7,'2026-02-28 13:05:00',5500.00,'tons','packed','3 ton',449999.00,'[\"images/f00b7e9f-cb27-43d8-b342-d3beff150870.png\",\"images/d42f17d5-8921-46bf-aac8-ba1d910f3b74.png\",\"images/db423891-2fd0-435c-8e21-533b81c35528.png\",\"images/a6989dc0-71a5-4d65-a905-61059a782755.png\"]',NULL,NULL,NULL,'2026-02-27 13:54:21','2026-03-03 14:09:59',NULL),
(3,11,'2026-03-10 12:00:00',1000.00,'tons','packed','trailer',2.00,'[\"images/ca1600e3-7972-4072-b443-7efa973fc81d.png\"]',5,NULL,'inspection done','2026-03-08 16:31:28','2026-03-08 16:31:28',NULL),
(4,12,'2026-03-20 14:30:00',25.00,'kg','palletized','1 ton',12000.00,'[\"images/76e3cdea-e4a8-49dd-b968-3cd951b03ad6.jpeg\"]',5,11,NULL,'2026-03-08 22:20:20','2026-03-08 22:20:20',NULL),
(5,3,'2026-04-02 12:00:00',7.50,'tons','packed','10 ton',55000.00,'[\"images/2f64db6f-d3f0-4ee9-8762-86fd0b49df1d.jpg\",\"images/c4961380-0609-4c00-a2f8-d1225ad350a5.jpg\"]',11,NULL,'Good material','2026-04-02 13:37:19','2026-04-02 13:37:19',NULL),
(6,20,'2026-05-09 18:00:00',7.00,'tons','unpacked','10 ton',9999.00,'[\"images/6ad8d871-10c9-4bd4-9190-6efad7c67dab.jpg\"]',5,5,NULL,'2026-05-09 18:52:40','2026-05-09 18:53:57',NULL),
(7,26,'2026-05-22 23:30:00',7.00,'tons','packed','10 ton',1999.00,'[\"images/dcbdb813-afac-489f-a3ff-42af3e92a85a.jpg\"]',5,5,NULL,'2026-05-22 13:16:58','2026-05-22 13:17:04',NULL);
/*!40000 ALTER TABLE `deal_inspection_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_inspection_requests`
--

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
  `safety_tools` text DEFAULT NULL COMMENT 'JSON array of selected safety tool keys',
  `status` enum('request_submitted','team_assigned','inspection_completed','report_submitted') NOT NULL DEFAULT 'request_submitted',
  `deleted_at` datetime DEFAULT NULL,
  `priority` enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
  `response_status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `responded_by` int(11) DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `fk_insp_responded_by` (`responded_by`),
  CONSTRAINT `fk_insp_responded_by` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_inspection_requests`
--

LOCK TABLES `deal_inspection_requests` WRITE;
/*!40000 ALTER TABLE `deal_inspection_requests` DISABLE KEYS */;
INSERT INTO `deal_inspection_requests` VALUES
(1,6,1,'500',1,'images/790e9487-c57a-4ce0-982f-d12fb3258d2a.jpeg',2,'check properly','2026-02-27 11:49:17','2026-02-27 11:49:17',NULL,NULL,NULL,NULL,NULL,NULL,'report_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(2,7,1,'5000',1,'images/b54a56fa-8064-4083-b43c-ff4f47ba9fd1.png',2,'check properly weight and material','2026-02-27 13:53:20','2026-02-27 13:53:20',NULL,NULL,NULL,NULL,NULL,NULL,'report_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(3,8,6,'65',1,'images/8a48672c-8de1-4b75-af62-a06e057a7282.jpg',6,'Destructing Hard disks to wipe off the data','2026-03-05 11:09:41','2026-03-05 11:09:41','ajman','yes','purchase','mainland',NULL,NULL,'request_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(4,9,6,'55',1,'images/c60eb1a3-a97a-4184-8b2e-06a04933368b.jpg',4,NULL,'2026-03-05 16:01:36','2026-03-05 16:01:36','dxb','no','purchase','freezone',NULL,NULL,'request_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(5,10,1,'1000',1,NULL,4,NULL,'2026-03-06 23:46:54','2026-03-06 23:46:54','ASXSJJK','yes','purchase','mainland',NULL,NULL,'request_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(7,12,6,'60',1,'images/86fa7ee3-c0af-49d5-9846-228084eb76ba.jpeg',5,NULL,'2026-03-08 22:11:59','2026-03-08 22:11:59','RAK','yes','purchase','mainland','piece',NULL,'report_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(8,15,7,'20',1,NULL,2,NULL,'2026-03-10 13:02:22','2026-03-10 13:02:22','DIP','no','service','mainland','kg','[\"safety_mask\"]','request_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(10,2,6,'20',0,'images/67d62c05-67c3-4140-ae54-e5437af8a0ce.jpg',2,NULL,'2026-04-01 23:15:29','2026-04-01 23:15:29','al dhafra','yes','service','mainland','piece',NULL,'request_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(11,3,1,'8',0,'images/3fe8adb6-1841-44e5-88f5-5e3388e63e11.jpg',2,NULL,'2026-04-02 00:01:44','2026-05-09 16:54:11','ajman','no','purchase','freezone','ton',NULL,'report_submitted',NULL,'medium','pending',NULL,NULL,NULL),
(12,5,1,'12',0,'images/b1050e43-9f90-43a9-a17a-e74ef214b3f2.jpg',11,NULL,'2026-04-02 14:55:53','2026-05-09 16:53:48','Bur Dubai','no','free_of_charge','mainland','ton',NULL,'inspection_completed',NULL,'medium','pending',NULL,NULL,NULL),
(13,8,6,'20',0,NULL,2,NULL,'2026-04-14 10:51:33','2026-05-25 16:43:07','abu dhabi','no','service','mainland','piece',NULL,'request_submitted',NULL,'critical','rejected','not necessary',2,'2026-05-25 16:15:04'),
(14,20,5,'7',1,'images/32b35dea-8e14-4601-a60e-235f544ee1f1.jpeg',6,'disposing ','2026-05-09 18:36:35','2026-05-25 16:42:57','jebel ali','yes','service','freezone','ton','[\"safety_mask\",\"safety_gloves\"]','report_submitted',NULL,'high','pending',NULL,NULL,NULL),
(15,21,1,'25',1,NULL,14,NULL,'2026-05-20 07:56:36','2026-05-25 16:27:42','dubai','yes','free_of_charge','mainland','piece','[\"safety_coverall\"]','request_submitted',NULL,'low','pending',NULL,NULL,NULL),
(16,26,8,'1',1,'images/625ce145-67f9-4e03-be94-f90d750de0d3.jpg',6,NULL,'2026-05-22 09:45:45','2026-05-25 16:27:37','AL Qusais','yes','service','freezone','ton','[\"safety_mask\",\"safety_goggles\",\"safety_gloves\",\"safety_helmet\"]','report_submitted',NULL,'low','pending',NULL,NULL,NULL),
(17,30,5,'5',1,NULL,6,NULL,'2026-05-25 16:10:28','2026-05-25 16:35:15','Jafza','no','service','freezone','ton','[\"safety_helmet\",\"safety_mask\"]','request_submitted',NULL,'low','rejected','not relevant',5,'2026-05-25 16:35:15');
/*!40000 ALTER TABLE `deal_inspection_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_items`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_items`
--

LOCK TABLES `deal_items` WRITE;
/*!40000 ALTER TABLE `deal_items` DISABLE KEYS */;
INSERT INTO `deal_items` VALUES
(34,2,2,20.01,450.00,9004.50,NULL,'2026-04-01 23:22:18','2026-04-01 23:22:18','piece',NULL),
(36,3,4,8.00,249.99,1999.92,NULL,'2026-04-02 00:03:32','2026-04-02 00:03:32','ton',NULL),
(39,6,2,15.00,90.00,1350.00,NULL,'2026-04-02 15:13:08','2026-04-02 15:13:08','piece',NULL),
(40,5,1,1.00,100.00,100.00,NULL,'2026-04-03 13:52:06','2026-04-03 13:52:06',NULL,NULL),
(41,5,4,7.00,115.00,805.00,NULL,'2026-04-03 13:52:06','2026-04-03 13:52:06','ton',NULL),
(42,7,3,8.00,800.00,6400.00,NULL,'2026-04-03 14:48:13','2026-04-03 14:48:13','kg',NULL),
(43,8,2,20.00,40.00,800.00,NULL,'2026-04-14 10:51:33','2026-04-14 10:51:33','piece',NULL),
(44,9,3,10.00,350.00,3500.00,NULL,'2026-04-20 15:52:45','2026-04-20 15:52:45','ton',NULL),
(45,10,4,13.00,2500.00,32500.00,NULL,'2026-04-24 18:21:42','2026-04-24 18:21:42','ton',NULL),
(51,12,6,1.00,600.00,600.00,NULL,'2026-04-28 12:31:28','2026-04-28 12:31:28','kg',NULL),
(52,13,5,1.00,500.00,500.00,NULL,'2026-04-28 12:32:42','2026-04-28 12:32:42','kg',NULL),
(53,14,3,1.00,5600.00,5600.00,NULL,'2026-04-30 11:24:28','2026-04-30 11:24:28','kg',NULL),
(54,15,3,1.00,50.00,50.00,NULL,'2026-04-30 11:36:20','2026-04-30 11:36:20','kg',NULL),
(55,16,4,1.00,399.97,399.97,NULL,'2026-04-30 11:37:43','2026-04-30 11:37:43','ton',NULL),
(56,17,4,7.00,250.00,1750.00,NULL,'2026-04-30 13:13:07','2026-04-30 13:13:07','ton',NULL),
(57,11,5,6.00,749.99,4499.94,NULL,'2026-04-30 13:37:54','2026-04-30 13:37:54','ton',NULL),
(58,18,6,100.00,20.00,2000.00,NULL,'2026-04-30 13:46:37','2026-04-30 13:46:37','piece',NULL),
(59,19,6,78.00,300.00,23400.00,NULL,'2026-05-02 17:51:19','2026-05-02 17:51:19','kg',NULL),
(61,20,5,7.00,200.00,1400.00,NULL,'2026-05-09 18:47:20','2026-05-09 18:47:20','ton',NULL),
(62,21,6,25.00,400.00,10000.00,NULL,'2026-05-20 07:56:36','2026-05-20 07:56:36','ton',NULL),
(63,22,5,15.00,200.00,3000.00,NULL,'2026-05-20 13:44:26','2026-05-20 13:44:26','kg',NULL),
(64,23,5,50.00,200.00,10000.00,NULL,'2026-05-20 20:05:53','2026-05-20 20:05:53','unit',NULL),
(65,24,6,1.00,400.00,400.00,NULL,'2026-05-21 09:34:39','2026-05-21 09:34:39','ton',NULL),
(66,25,1,100.00,100.00,10000.00,NULL,'2026-05-21 10:36:23','2026-05-21 10:36:23','ton',NULL),
(67,26,6,1.00,400.00,400.00,NULL,'2026-05-22 09:45:45','2026-05-22 09:45:45','ton',NULL),
(69,27,4,7.00,250.00,1750.00,NULL,'2026-05-22 12:11:54','2026-05-22 12:11:54','ton',NULL),
(70,28,2,10.00,60.00,600.00,NULL,'2026-05-25 14:51:42','2026-05-25 14:51:42','piece',NULL),
(72,29,3,1.00,30.00,30.00,NULL,'2026-05-25 15:52:48','2026-05-25 15:52:48','kg',NULL),
(74,30,5,5.00,200.00,1000.00,NULL,'2026-05-25 16:33:01','2026-05-25 16:33:01','ton',NULL);
/*!40000 ALTER TABLE `deal_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_stages`
--

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

--
-- Dumping data for table `deal_stages`
--

LOCK TABLES `deal_stages` WRITE;
/*!40000 ALTER TABLE `deal_stages` DISABLE KEYS */;
/*!40000 ALTER TABLE `deal_stages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_statuses`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=139 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_statuses`
--

LOCK TABLES `deal_statuses` WRITE;
/*!40000 ALTER TABLE `deal_statuses` DISABLE KEYS */;
INSERT INTO `deal_statuses` VALUES
(133,'new','New',1,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(134,'approved','Approved',2,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(135,'quotation_sent','Quotation Sent',3,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(136,'negotiation','Negotiation',4,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(137,'won','Won',5,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(138,'lost','Lost',6,1,'2026-05-25 17:13:05','2026-05-25 17:13:05');
/*!40000 ALTER TABLE `deal_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_terms`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=583 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_terms`
--

LOCK TABLES `deal_terms` WRITE;
/*!40000 ALTER TABLE `deal_terms` DISABLE KEYS */;
INSERT INTO `deal_terms` VALUES
(1,1,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03',NULL),
(3,4,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03',NULL),
(5,6,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03',NULL),
(6,7,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03',NULL),
(25,8,1,0,'2026-03-05 11:09:41','2026-03-05 11:09:41',NULL),
(33,9,1,0,'2026-03-05 16:01:36','2026-03-05 16:01:36',NULL),
(63,10,1,0,'2026-03-06 23:47:16','2026-03-06 23:47:16',NULL),
(100,12,1,0,'2026-03-08 22:15:43','2026-03-08 22:15:43',NULL),
(144,13,1,0,'2026-03-10 12:14:16','2026-03-10 12:14:16',NULL),
(146,14,1,0,'2026-03-10 12:35:21','2026-03-10 12:35:21',NULL),
(148,15,1,0,'2026-03-10 13:28:06','2026-03-10 13:28:06',NULL),
(149,15,2,1,'2026-03-10 13:28:06','2026-03-10 13:28:06',NULL),
(202,18,1,0,'2026-03-26 21:42:34','2026-03-26 21:42:34',NULL),
(203,18,2,1,'2026-03-26 21:42:34','2026-03-26 21:42:34',NULL),
(204,19,1,0,'2026-03-26 21:57:07','2026-03-26 21:57:07',NULL),
(205,19,2,1,'2026-03-26 21:57:07','2026-03-26 21:57:07',NULL),
(273,2,1,0,'2026-04-01 23:22:18','2026-04-01 23:22:18',NULL),
(274,2,2,1,'2026-04-01 23:22:18','2026-04-01 23:22:18',NULL),
(276,3,2,0,'2026-04-02 00:03:32','2026-04-02 00:03:32',NULL),
(280,2,1,0,'2026-04-02 11:40:39','2026-04-02 11:40:39',NULL),
(281,3,2,0,'2026-04-02 11:40:39','2026-04-02 11:40:39',NULL),
(282,2,1,0,'2026-04-02 12:17:58','2026-04-02 12:17:58',NULL),
(283,3,2,0,'2026-04-02 12:17:58','2026-04-02 12:17:58',NULL),
(285,6,2,0,'2026-04-02 15:13:08','2026-04-02 15:13:08',NULL),
(286,2,1,0,'2026-04-03 09:48:22','2026-04-03 09:48:22',NULL),
(287,3,2,0,'2026-04-03 09:48:22','2026-04-03 09:48:22',NULL),
(289,6,2,0,'2026-04-03 09:48:22','2026-04-03 09:48:22',NULL),
(290,2,1,0,'2026-04-03 10:32:56','2026-04-03 10:32:56',NULL),
(291,3,2,0,'2026-04-03 10:32:56','2026-04-03 10:32:56',NULL),
(293,6,2,0,'2026-04-03 10:32:56','2026-04-03 10:32:56',NULL),
(294,2,1,0,'2026-04-03 10:34:15','2026-04-03 10:34:15',NULL),
(295,3,2,0,'2026-04-03 10:34:15','2026-04-03 10:34:15',NULL),
(297,6,2,0,'2026-04-03 10:34:15','2026-04-03 10:34:15',NULL),
(298,2,1,0,'2026-04-03 13:47:15','2026-04-03 13:47:15',NULL),
(299,3,2,0,'2026-04-03 13:47:15','2026-04-03 13:47:15',NULL),
(301,6,2,0,'2026-04-03 13:47:15','2026-04-03 13:47:15',NULL),
(302,2,1,0,'2026-04-03 13:48:44','2026-04-03 13:48:44',NULL),
(303,3,2,0,'2026-04-03 13:48:44','2026-04-03 13:48:44',NULL),
(305,6,2,0,'2026-04-03 13:48:44','2026-04-03 13:48:44',NULL),
(306,5,1,0,'2026-04-03 13:52:06','2026-04-03 13:52:06',NULL),
(307,5,2,1,'2026-04-03 13:52:06','2026-04-03 13:52:06',NULL),
(308,7,1,0,'2026-04-03 14:48:13','2026-04-03 14:48:13',NULL),
(309,7,2,1,'2026-04-03 14:48:13','2026-04-03 14:48:13',NULL),
(310,2,1,0,'2026-04-08 17:27:30','2026-04-08 17:27:30',NULL),
(311,3,2,0,'2026-04-08 17:27:30','2026-04-08 17:27:30',NULL),
(312,5,1,0,'2026-04-08 17:27:30','2026-04-08 17:27:30',NULL),
(313,6,2,0,'2026-04-08 17:27:30','2026-04-08 17:27:30',NULL),
(314,7,1,0,'2026-04-08 17:27:30','2026-04-08 17:27:30',NULL),
(315,2,1,0,'2026-04-08 17:31:22','2026-04-08 17:31:22',NULL),
(316,3,2,0,'2026-04-08 17:31:22','2026-04-08 17:31:22',NULL),
(317,5,1,0,'2026-04-08 17:31:22','2026-04-08 17:31:22',NULL),
(318,6,2,0,'2026-04-08 17:31:22','2026-04-08 17:31:22',NULL),
(319,7,1,0,'2026-04-08 17:31:22','2026-04-08 17:31:22',NULL),
(320,2,1,0,'2026-04-09 11:34:24','2026-04-09 11:34:24',NULL),
(321,3,2,0,'2026-04-09 11:34:24','2026-04-09 11:34:24',NULL),
(322,5,1,0,'2026-04-09 11:34:24','2026-04-09 11:34:24',NULL),
(323,6,2,0,'2026-04-09 11:34:24','2026-04-09 11:34:24',NULL),
(324,7,1,0,'2026-04-09 11:34:24','2026-04-09 11:34:24',NULL),
(325,2,1,0,'2026-04-09 11:57:15','2026-04-09 11:57:15',NULL),
(326,3,2,0,'2026-04-09 11:57:15','2026-04-09 11:57:15',NULL),
(327,5,1,0,'2026-04-09 11:57:15','2026-04-09 11:57:15',NULL),
(328,6,2,0,'2026-04-09 11:57:15','2026-04-09 11:57:15',NULL),
(329,7,1,0,'2026-04-09 11:57:15','2026-04-09 11:57:15',NULL),
(330,8,2,0,'2026-04-14 10:51:33','2026-04-14 10:51:33',NULL),
(331,8,1,1,'2026-04-14 10:51:33','2026-04-14 10:51:33',NULL),
(332,2,1,0,'2026-04-20 12:31:29','2026-04-20 12:31:29',NULL),
(333,3,2,0,'2026-04-20 12:31:30','2026-04-20 12:31:30',NULL),
(334,5,1,0,'2026-04-20 12:31:30','2026-04-20 12:31:30',NULL),
(335,6,2,0,'2026-04-20 12:31:30','2026-04-20 12:31:30',NULL),
(336,7,1,0,'2026-04-20 12:31:30','2026-04-20 12:31:30',NULL),
(337,8,2,0,'2026-04-20 12:31:30','2026-04-20 12:31:30',NULL),
(338,2,1,0,'2026-04-20 12:33:37','2026-04-20 12:33:37',NULL),
(339,3,2,0,'2026-04-20 12:33:37','2026-04-20 12:33:37',NULL),
(340,5,1,0,'2026-04-20 12:33:37','2026-04-20 12:33:37',NULL),
(341,6,2,0,'2026-04-20 12:33:37','2026-04-20 12:33:37',NULL),
(342,7,1,0,'2026-04-20 12:33:37','2026-04-20 12:33:37',NULL),
(343,8,2,0,'2026-04-20 12:33:37','2026-04-20 12:33:37',NULL),
(344,2,1,0,'2026-04-20 12:54:52','2026-04-20 12:54:52',NULL),
(345,3,2,0,'2026-04-20 12:54:52','2026-04-20 12:54:52',NULL),
(346,5,1,0,'2026-04-20 12:54:52','2026-04-20 12:54:52',NULL),
(347,6,2,0,'2026-04-20 12:54:52','2026-04-20 12:54:52',NULL),
(348,7,1,0,'2026-04-20 12:54:52','2026-04-20 12:54:52',NULL),
(349,8,2,0,'2026-04-20 12:54:52','2026-04-20 12:54:52',NULL),
(350,9,1,0,'2026-04-20 15:52:45','2026-04-20 15:52:45',NULL),
(351,2,1,0,'2026-04-24 15:32:14','2026-04-24 15:32:14',NULL),
(352,3,2,0,'2026-04-24 15:32:14','2026-04-24 15:32:14',NULL),
(353,5,1,0,'2026-04-24 15:32:14','2026-04-24 15:32:14',NULL),
(354,6,2,0,'2026-04-24 15:32:14','2026-04-24 15:32:14',NULL),
(355,7,1,0,'2026-04-24 15:32:14','2026-04-24 15:32:14',NULL),
(356,8,2,0,'2026-04-24 15:32:14','2026-04-24 15:32:14',NULL),
(357,9,1,0,'2026-04-24 15:32:14','2026-04-24 15:32:14',NULL),
(358,10,3,0,'2026-04-24 18:21:42','2026-04-24 18:21:42',NULL),
(367,2,1,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(368,3,2,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(369,5,1,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(370,6,2,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(371,7,1,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(372,8,2,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(373,9,1,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(374,10,3,0,'2026-04-28 12:51:12','2026-04-28 12:51:12',NULL),
(376,2,1,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(377,3,2,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(378,5,1,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(379,6,2,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(380,7,1,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(381,8,2,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(382,9,1,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(383,10,3,0,'2026-04-30 10:57:51','2026-04-30 10:57:51',NULL),
(385,2,1,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(386,3,2,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(387,5,1,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(388,6,2,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(389,7,1,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(390,8,2,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(391,9,1,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(392,10,3,0,'2026-04-30 11:09:26','2026-04-30 11:09:26',NULL),
(394,2,1,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(395,3,2,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(396,5,1,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(397,6,2,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(398,7,1,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(399,8,2,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(400,9,1,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(401,10,3,0,'2026-04-30 11:14:22','2026-04-30 11:14:22',NULL),
(403,17,3,0,'2026-04-30 13:13:07','2026-04-30 13:13:07',NULL),
(404,11,1,0,'2026-04-30 13:37:54','2026-04-30 13:37:54',NULL),
(405,11,2,1,'2026-04-30 13:37:54','2026-04-30 13:37:54',NULL),
(406,11,4,2,'2026-04-30 13:37:54','2026-04-30 13:37:54',NULL),
(407,18,4,0,'2026-04-30 13:46:37','2026-04-30 13:46:37',NULL),
(408,19,4,0,'2026-05-02 17:51:19','2026-05-02 17:51:19',NULL),
(409,19,1,1,'2026-05-02 17:51:19','2026-05-02 17:51:19',NULL),
(411,20,1,0,'2026-05-09 18:47:20','2026-05-09 18:47:20',NULL),
(412,20,4,1,'2026-05-09 18:47:20','2026-05-09 18:47:20',NULL),
(413,2,1,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(414,3,2,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(415,5,1,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(416,6,2,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(417,7,1,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(418,8,2,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(419,9,1,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(420,10,3,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(421,11,1,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(422,17,3,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(423,18,4,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(424,19,4,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(425,20,1,0,'2026-05-19 14:05:44','2026-05-19 14:05:44',NULL),
(426,22,2,0,'2026-05-20 13:44:26','2026-05-20 13:44:26',NULL),
(427,23,3,0,'2026-05-20 20:05:53','2026-05-20 20:05:53',NULL),
(428,24,5,0,'2026-05-21 09:34:39','2026-05-21 09:34:39',NULL),
(429,25,4,0,'2026-05-21 10:36:23','2026-05-21 10:36:23',NULL),
(430,26,4,0,'2026-05-22 09:45:45','2026-05-22 09:45:45',NULL),
(433,27,3,0,'2026-05-22 12:11:54','2026-05-22 12:11:54',NULL),
(434,27,4,1,'2026-05-22 12:11:54','2026-05-22 12:11:54',NULL),
(435,28,4,0,'2026-05-25 14:51:42','2026-05-25 14:51:42',NULL),
(436,2,1,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(437,3,2,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(438,5,1,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(439,6,2,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(440,7,1,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(441,8,2,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(442,9,1,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(443,10,3,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(444,11,1,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(445,17,3,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(446,18,4,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(447,19,4,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(448,20,1,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(449,22,2,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(450,23,3,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(451,24,5,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(452,25,4,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(453,26,4,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(454,27,3,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(455,28,4,0,'2026-05-25 15:21:33','2026-05-25 15:21:33',NULL),
(456,2,1,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(457,3,2,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(458,5,1,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(459,6,2,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(460,7,1,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(461,8,2,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(462,9,1,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(463,10,3,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(464,11,1,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(465,17,3,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(466,18,4,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(467,19,4,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(468,20,1,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(469,22,2,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(470,23,3,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(471,24,5,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(472,25,4,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(473,26,4,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(474,27,3,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(475,28,4,0,'2026-05-25 15:29:18','2026-05-25 15:29:18',NULL),
(477,29,5,0,'2026-05-25 15:52:48','2026-05-25 15:52:48',NULL),
(478,2,1,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(479,3,2,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(480,5,1,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(481,6,2,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(482,7,1,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(483,8,2,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(484,9,1,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(485,10,3,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(486,11,1,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(487,17,3,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(488,18,4,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(489,19,4,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(490,20,1,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(491,22,2,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(492,23,3,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(493,24,5,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(494,25,4,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(495,26,4,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(496,27,3,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(497,28,4,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(498,29,5,0,'2026-05-25 16:14:41','2026-05-25 16:14:41',NULL),
(499,2,1,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(500,3,2,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(501,5,1,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(502,6,2,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(503,7,1,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(504,8,2,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(505,9,1,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(506,10,3,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(507,11,1,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(508,17,3,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(509,18,4,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(510,19,4,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(511,20,1,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(512,22,2,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(513,23,3,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(514,24,5,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(515,25,4,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(516,26,4,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(517,27,3,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(518,28,4,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(519,29,5,0,'2026-05-25 16:53:58','2026-05-25 16:53:58',NULL),
(520,2,1,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(521,3,2,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(522,5,1,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(523,6,2,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(524,7,1,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(525,8,2,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(526,9,1,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(527,10,3,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(528,11,1,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(529,17,3,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(530,18,4,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(531,19,4,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(532,20,1,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(533,22,2,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(534,23,3,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(535,24,5,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(536,25,4,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(537,26,4,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(538,27,3,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(539,28,4,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(540,29,5,0,'2026-05-25 17:04:53','2026-05-25 17:04:53',NULL),
(541,2,1,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(542,3,2,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(543,5,1,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(544,6,2,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(545,7,1,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(546,8,2,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(547,9,1,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(548,10,3,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(549,11,1,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(550,17,3,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(551,18,4,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(552,19,4,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(553,20,1,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(554,22,2,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(555,23,3,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(556,24,5,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(557,25,4,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(558,26,4,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(559,27,3,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(560,28,4,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(561,29,5,0,'2026-05-25 17:07:36','2026-05-25 17:07:36',NULL),
(562,2,1,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(563,3,2,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(564,5,1,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(565,6,2,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(566,7,1,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(567,8,2,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(568,9,1,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(569,10,3,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(570,11,1,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(571,17,3,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(572,18,4,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(573,19,4,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(574,20,1,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(575,22,2,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(576,23,3,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(577,24,5,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(578,25,4,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(579,26,4,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(580,27,3,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(581,28,4,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL),
(582,29,5,0,'2026-05-25 17:13:05','2026-05-25 17:13:05',NULL);
/*!40000 ALTER TABLE `deal_terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_types`
--

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

--
-- Dumping data for table `deal_types`
--

LOCK TABLES `deal_types` WRITE;
/*!40000 ALTER TABLE `deal_types` DISABLE KEYS */;
INSERT INTO `deal_types` VALUES
(1,'New Business','New customer acquisition',1,1,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(2,'Renewal','Contract renewal',1,2,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(3,'Upsell','Additional services to existing customer',1,3,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(4,'Cross-sell','Different services to existing customer',1,4,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL);
/*!40000 ALTER TABLE `deal_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_wds`
--

DROP TABLE IF EXISTS `deal_wds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_ref_no` (`ref_no`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_wds`
--

LOCK TABLES `deal_wds` WRITE;
/*!40000 ALTER TABLE `deal_wds` DISABLE KEYS */;
INSERT INTO `deal_wds` VALUES
(1,1,'In omnis aliquip off','2004-05-11','Odonnell Wells LLC','In animi necessitat','ssdfghjkl','Qui ea veniam natus','Voluptas deserunt co','637','Minus ipsum delectus','Voluptas dolorem sun','Laborum sint dolore','Vel nostrud maxime t','Commodo tenetur dign','2026-02-26 12:10:56','2026-02-26 12:10:56',NULL),
(4,4,'aaaa','2026-02-26','Morin Goodwin LLC','12345678','sdsda545511',NULL,NULL,NULL,NULL,'1515aa',NULL,NULL,NULL,'2026-02-26 12:20:33','2026-02-26 12:20:33',NULL),
(6,7,'abc123','2026-02-27','Test company','456789','asdfghjkl',NULL,NULL,NULL,NULL,'A555',NULL,NULL,NULL,'2026-02-27 13:53:20','2026-02-27 13:53:20',NULL);
/*!40000 ALTER TABLE `deal_wds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deal_wds_attachments`
--

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

--
-- Dumping data for table `deal_wds_attachments`
--

LOCK TABLES `deal_wds_attachments` WRITE;
/*!40000 ALTER TABLE `deal_wds_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `deal_wds_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deals`
--

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
  `is_rcm_applicable` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Reverse Charge Mechanism: VAT paid to government by buyer, excluded from purchase documents',
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
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deals`
--

LOCK TABLES `deals` WRITE;
/*!40000 ALTER TABLE `deals` DISABLE KEYS */;
INSERT INTO `deals` VALUES
(2,2,'2',2,33,42,NULL,'Deal from Lead 2','','2026-04-01 04:00:00',9004.50,5.00,450.23,9454.73,'AED','new','unpaid',0.00,10,'','2026-04-01 23:15:29','2026-04-01 23:22:18',NULL,1,'offer_to_charge',NULL,NULL,0,1,0,0,0,NULL,NULL,0),
(3,2,'3',3,33,42,NULL,'Deal from Lead 3','','2026-04-01 04:00:00',1999.92,5.00,100.00,2099.92,'AED','new','unpaid',0.00,2,'','2026-04-02 00:01:44','2026-04-02 00:01:44',NULL,2,'offer_to_purchase',NULL,NULL,0,1,0,0,0,NULL,NULL,0),
(5,2,'5',5,26,33,NULL,'Deal from Lead 5','','2026-04-02 04:00:00',905.00,5.00,45.25,950.25,'AED','new','unpaid',0.00,10,'','2026-04-02 14:55:53','2026-04-03 13:52:06',NULL,1,'free_of_charge',NULL,NULL,0,1,0,0,0,3,'',0),
(6,2,'6',6,31,39,NULL,'Deal from Lead 6','','2026-04-02 04:00:00',1350.00,5.00,67.50,1417.50,'AED','approved','unpaid',0.00,6,'','2026-04-02 15:13:08','2026-04-14 11:05:03',NULL,2,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(7,2,'7',7,25,32,NULL,'Deal from Lead 7','','2026-04-03 04:00:00',6400.00,5.00,320.00,6720.00,'AED','new','unpaid',0.00,10,'','2026-04-03 14:48:13','2026-04-03 14:48:13',NULL,1,'offer_to_charge',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(8,2,'8',9,34,43,NULL,'Deal from Lead 9','Hard disk memory erasure.','2026-04-14 04:00:00',800.00,5.00,40.00,840.00,'AED','approved','unpaid',0.00,2,'','2026-04-14 10:51:33','2026-04-14 10:59:37',NULL,2,'offer_to_charge',NULL,NULL,0,1,0,0,0,NULL,NULL,0),
(9,2,'9',10,31,39,NULL,'Deal from Lead 10','','2026-04-20 04:00:00',3500.00,5.00,175.00,3675.00,'AED','new','unpaid',0.00,2,'','2026-04-20 15:52:45','2026-04-20 15:52:45',NULL,1,'offer_to_charge','FCL','Main Land',0,0,0,1,1,6,NULL,0),
(10,2,'10',12,26,33,NULL,'Deal from Lead 12','','2026-04-24 04:00:00',32500.00,5.00,1625.00,34125.00,'AED','approved','unpaid',0.00,2,'','2026-04-24 18:21:42','2026-04-24 18:24:38',NULL,3,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,1),
(11,2,'11',13,18,23,NULL,'Deal from Lead 13','','2026-04-24 04:00:00',4499.94,5.00,225.00,4724.94,'AED','approved','partial',25000.00,2,'','2026-04-24 18:53:04','2026-04-30 13:37:54',NULL,1,'offer_to_charge',NULL,NULL,0,0,0,0,0,3,'',0),
(12,2,'12',11,36,45,NULL,'Deal from Lead 11','Ewaste as Hazardous Category ','2026-04-28 04:00:00',600.00,5.00,30.00,630.00,'AED','new','unpaid',0.00,6,'','2026-04-28 12:31:28','2026-04-28 12:31:28',NULL,NULL,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(13,2,'13',8,33,42,NULL,'Deal from Lead 8','','2026-04-28 04:00:00',500.00,5.00,25.00,525.00,'AED','new','unpaid',0.00,11,'','2026-04-28 12:32:42','2026-04-28 12:32:42',NULL,NULL,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(14,2,'14',14,36,45,NULL,'Deal from Lead 14','','2026-04-30 04:00:00',5600.00,5.00,280.00,5880.00,'AED','new','unpaid',0.00,NULL,'','2026-04-30 11:24:28','2026-04-30 11:24:28',NULL,NULL,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(15,2,'15',14,36,45,NULL,'aaa','','2026-04-30 04:00:00',50.00,5.00,2.50,52.50,'AED','new','unpaid',0.00,NULL,'','2026-04-30 11:36:20','2026-04-30 11:36:20',NULL,NULL,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(16,2,'16',13,34,43,NULL,'test 2','','2026-04-30 04:00:00',399.97,5.00,20.00,419.97,'AED','new','unpaid',0.00,NULL,'','2026-04-30 11:37:43','2026-04-30 11:37:43',NULL,NULL,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(17,2,'17',15,22,29,NULL,'Deal from Lead 15','','2026-04-30 04:00:00',1750.00,5.00,87.50,1837.50,'AED','approved','unpaid',0.00,2,'','2026-04-30 13:13:07','2026-04-30 13:13:19',NULL,3,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,1),
(18,2,'18',16,23,30,NULL,'Deal from Lead 16','','2026-04-30 04:00:00',2000.00,5.00,100.00,2100.00,'AED','approved','unpaid',0.00,2,'','2026-04-30 13:46:37','2026-04-30 13:46:46',NULL,4,'offer_to_charge',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(19,2,'19',14,36,45,7,'Deal 2 May 2025 testing','','2026-05-02 04:00:00',23400.00,5.00,1170.00,24570.00,'AED','approved','unpaid',0.00,12,'','2026-05-02 17:51:19','2026-05-02 17:51:27',NULL,4,'offer_to_charge',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(20,2,'20',17,31,39,NULL,'Deal from Lead 17','Disposal of waste food.','2026-05-09 04:00:00',1400.00,5.00,70.00,1470.00,'AED','approved','unpaid',0.00,6,'','2026-05-09 18:36:35','2026-05-09 19:24:08',NULL,1,'offer_to_charge',NULL,NULL,0,1,0,0,0,NULL,'',0),
(21,2,'21',18,39,51,6,'deal05','','2026-05-20 04:00:00',10000.00,5.00,500.00,10500.00,'AED','approved','unpaid',0.00,6,'','2026-05-20 07:56:36','2026-05-20 07:56:36',NULL,NULL,'offer_to_purchase',NULL,NULL,0,1,0,0,0,NULL,NULL,1),
(22,2,'22',18,39,47,NULL,'abc','','2026-05-20 04:00:00',3000.00,5.00,150.00,3150.00,'AED','approved','unpaid',0.00,6,'','2026-05-20 13:44:26','2026-05-20 13:44:26',NULL,2,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,1),
(23,2,'23',20,43,60,6,'deal07','abc','2026-05-20 04:00:00',10000.00,5.00,500.00,10500.00,'AED','approved','unpaid',0.00,14,'123','2026-05-20 20:05:53','2026-05-20 20:05:53',NULL,3,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,1),
(24,2,'24',20,43,58,5,'deal09','red','2026-05-21 04:00:00',400.00,5.00,20.00,420.00,'AED','approved','unpaid',0.00,NULL,'asd','2026-05-21 09:34:39','2026-05-21 09:34:39',NULL,5,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,1),
(25,2,'25',19,42,59,5,'deal010','dre','2026-05-21 04:00:00',10000.00,5.00,500.00,10500.00,'AED','approved','unpaid',0.00,NULL,'fty','2026-05-21 10:36:23','2026-05-21 10:36:23',NULL,4,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,NULL,1),
(26,2,'26',21,44,61,NULL,'Deal from Lead 21','Bulbs & lights Recycling','2026-05-22 04:00:00',400.00,5.00,20.00,420.00,'AED','approved','unpaid',0.00,6,'','2026-05-22 09:45:45','2026-05-22 09:46:24',NULL,4,'offer_to_charge','FCL','Free Zone',0,1,1,1,1,NULL,NULL,0),
(27,2,'27',22,44,61,NULL,'Deal from Lead 22','','2026-05-22 04:00:00',1750.00,5.00,87.50,1837.50,'AED','new','unpaid',1750.00,6,'','2026-05-22 12:10:39','2026-05-22 12:11:54',NULL,3,'offer_to_purchase',NULL,NULL,0,0,0,0,0,NULL,'',1),
(28,2,'28',24,36,45,NULL,'Deal from Lead 24','','2026-05-25 04:00:00',600.00,5.00,30.00,630.00,'AED','approved','unpaid',0.00,6,'','2026-05-25 14:51:42','2026-05-25 14:51:54',NULL,4,'offer_to_charge',NULL,NULL,0,0,0,0,0,NULL,NULL,0),
(29,2,'29',20,39,60,5,'deal10','imp20','2026-05-25 04:00:00',30.00,5.00,1.50,31.50,'AED','negotiation','unpaid',0.00,NULL,'hhkjk','2026-05-25 15:51:19','2026-05-25 15:52:48',NULL,5,'offer_to_charge',NULL,NULL,0,0,0,0,0,NULL,'',0),
(30,2,'30',25,44,61,NULL,'Deal from Lead 25','','2026-05-25 04:00:00',1000.00,5.00,50.00,1050.00,'AED','approved','unpaid',0.00,6,'','2026-05-25 16:10:28','2026-05-25 16:52:50',NULL,NULL,'offer_to_charge',NULL,NULL,0,1,0,0,0,NULL,'',0);
/*!40000 ALTER TABLE `deals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `value` (`value`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` VALUES
(1,'CEO','CEO',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Managing Director','Managing Director',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Director','Director',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'General Manager','General Manager',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Manager','Manager',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Assistant Manager','Assistant Manager',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Senior Executive','Senior Executive',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Executive','Executive',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(9,'Officer','Officer',9,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(10,'Coordinator','Coordinator',10,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(11,'Supervisor','Supervisor',11,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(12,'Team Leader','Team Leader',12,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(13,'Specialist','Specialist',13,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(14,'Consultant','Consultant',14,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(15,'Engineer','Engineer',15,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(16,'Technician','Technician',16,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(17,'Administrator','Administrator',17,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(18,'Accountant','Accountant',18,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(19,'Other','Other',19,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_exp_task_line` (`work_order_task_expense_id`),
  KEY `idx_exp_tenant` (`tenant_id`),
  KEY `idx_exp_date` (`expense_date`),
  KEY `idx_exp_category` (`category`),
  KEY `fk_exp_user` (`created_by`),
  KEY `idx_exp_payment_status` (`payment_status`),
  CONSTRAINT `fk_exp_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_exp_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_exp_wote` FOREIGN KEY (`work_order_task_expense_id`) REFERENCES `work_order_task_expenses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES
(1,2,6,'work_orders',150.00,'2026-04-24','Operations','Bank transfer','sample work order Â· Pickup Â· fork lifting','work_order','1',2,'2026-04-24 15:51:10','2026-04-24 15:51:10','paid',150.00,NULL,NULL),
(2,2,7,'work_orders',70.00,'2026-04-24','Operations','Bank transfer','sample work order Â· Pickup Â· labour charges','work_order','1',2,'2026-04-24 15:51:13','2026-04-24 15:51:13','paid',70.00,NULL,NULL),
(3,2,8,'work_orders',500.00,'2026-04-24','Operations','Bank transfer','sample work order Â· Destruction of material','work_order','1',2,'2026-04-24 15:51:16','2026-04-24 15:51:16','paid',500.00,NULL,NULL),
(4,2,9,'work_orders',300.00,'2026-04-24','Operations','Bank transfer','sample work order Â· Delivery','work_order','1',2,'2026-04-24 15:51:19','2026-04-24 15:51:19','paid',300.00,NULL,NULL),
(5,2,13,'work_orders',100.00,'2026-04-25','Operations','Cash','Work order #3 Â· Pickup Â· fork lifting','work_order','3',2,'2026-04-25 12:00:15','2026-04-25 12:00:15','paid',100.00,NULL,NULL),
(6,2,14,'work_orders',75.00,'2026-04-25','Operations','Bank transfer','Work order #3 Â· Pickup Â· labor charges','work_order','3',2,'2026-04-25 12:00:21','2026-04-25 12:00:21','paid',75.00,NULL,NULL),
(7,2,16,'work_orders',100.00,'2026-04-25','Operations','Cash','Work order new Â· Pickup Â· labor charges','work_order','4',2,'2026-04-25 12:19:48','2026-04-25 12:19:48','paid',100.00,NULL,NULL),
(8,2,17,'work_orders',200.00,'2026-04-25','Operations','Bank transfer','Work order new Â· Pickup Â· fork lifting','work_order','4',2,'2026-04-25 12:24:00','2026-04-25 12:24:00','paid',200.00,NULL,NULL),
(9,2,15,'work_orders',150.00,'2026-05-02','Operations','Bank transfer','Work order #3 Â· Destruction of material Â· labor and tools','work_order','3',2,'2026-05-02 18:01:46','2026-05-02 18:03:09','paid',150.00,'2026-05-02',NULL),
(10,2,26,'work_orders',150.00,'2026-05-09','Operations','Cash','Food Disposal - onion Â· Pickup Â· fork lifting','work_order','7',2,'2026-05-09 20:12:23','2026-05-09 20:12:45','paid',150.00,'2026-05-09',NULL),
(11,2,24,'work_orders',100.00,'2026-05-19','Operations','Bank transfer','Food Disposal - onion Â· Pickup Â· Fuel expense','work_order','7',13,'2026-05-19 17:26:06','2026-05-19 17:26:06','paid',100.00,NULL,NULL),
(12,2,25,'work_orders',200.00,'2026-05-19','Operations','Bank transfer','Food Disposal - onion Â· Pickup Â· labour','work_order','7',13,'2026-05-19 17:50:48','2026-05-19 17:51:33','paid',200.00,'2026-05-19',NULL),
(13,2,NULL,'materials',1000.00,'2026-05-21','ref','cheque','yui','manual',NULL,13,'2026-05-21 09:36:33','2026-05-21 09:36:33','paid',1000.00,'2026-05-22',NULL),
(14,2,NULL,'fuel',1000.00,'2026-05-21','richard webber','online transfer','dfre','manual',NULL,13,'2026-05-21 10:38:53','2026-05-21 10:38:53','paid',1000.00,'2026-05-21',NULL),
(15,2,NULL,'travel',500.00,'2026-05-25','grey','online transfer',NULL,'manual',NULL,13,'2026-05-25 15:53:51','2026-05-25 15:53:51','partial',250.00,'2026-06-25',NULL),
(16,2,53,'work_orders',2199.99,'2026-05-25','Operations','Bank transfer','Work order #12 Â· Dumber Truck Expense','work_order','12',13,'2026-05-25 17:54:20','2026-05-25 17:54:20','unpaid',NULL,NULL,NULL);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiscal_years`
--

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiscal_years`
--

LOCK TABLES `fiscal_years` WRITE;
/*!40000 ALTER TABLE `fiscal_years` DISABLE KEYS */;
/*!40000 ALTER TABLE `fiscal_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `industry_types`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `industry_types`
--

LOCK TABLES `industry_types` WRITE;
/*!40000 ALTER TABLE `industry_types` DISABLE KEYS */;
INSERT INTO `industry_types` VALUES
(1,'Technology','Technology',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
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
(14,'Other','Other',14,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `industry_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_entries`
--

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_je_tenant_number` (`tenant_id`,`entry_number`),
  KEY `idx_je_entry_date` (`entry_date`),
  KEY `idx_je_source` (`source_type`,`source_id`),
  KEY `idx_je_status` (`status`),
  KEY `fk_je_created_by` (`created_by`),
  CONSTRAINT `fk_je_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_je_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_entries`
--

LOCK TABLES `journal_entries` WRITE;
/*!40000 ALTER TABLE `journal_entries` DISABLE KEYS */;
INSERT INTO `journal_entries` VALUES
(1,2,'JE-2026-00001','2026-04-22','Tax Invoice TI-2026-00001','tax_invoice',1,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(2,2,'JE-2026-00002','2026-04-22','Payment Received â€” Invoice TI-2026-00001','payment_received',1,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(3,2,'JE-2026-00003','2026-05-02','Tax Invoice TI-2026-00002','tax_invoice',2,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(4,2,'JE-2026-00004','2026-05-02','Payment Received â€” Invoice TI-2026-00002','payment_received',2,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(5,2,'JE-2026-00005','2026-05-02','Tax Invoice TI-2026-00003','tax_invoice',3,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(6,2,'JE-2026-00006','2026-05-02','Tax Invoice TI-2026-00004','tax_invoice',4,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(7,2,'JE-2026-00007','2026-05-09','Tax Invoice TI-2026-00005','tax_invoice',5,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(8,2,'JE-2026-00008','2026-05-09','Payment Received â€” Invoice TI-2026-00005','payment_received',5,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(9,2,'JE-2026-00009','2026-05-19','Tax Invoice TI-2026-00006','tax_invoice',6,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(10,2,'JE-2026-00010','2026-05-19','Payment Received â€” Invoice TI-2026-00006','payment_received',6,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(11,2,'JE-2026-00011','2026-05-22','Tax Invoice TI-2026-00007','tax_invoice',7,'posted',0,NULL,NULL,NULL,NULL,6,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(12,2,'JE-2026-00012','2026-04-24','Expense â€” work_orders','expense',1,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(13,2,'JE-2026-00013','2026-04-24','Expense Payment â€” work_orders','expense_payment',1,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(14,2,'JE-2026-00014','2026-04-24','Expense â€” work_orders','expense',2,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(15,2,'JE-2026-00015','2026-04-24','Expense Payment â€” work_orders','expense_payment',2,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(16,2,'JE-2026-00016','2026-04-24','Expense â€” work_orders','expense',3,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(17,2,'JE-2026-00017','2026-04-24','Expense Payment â€” work_orders','expense_payment',3,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(18,2,'JE-2026-00018','2026-04-24','Expense â€” work_orders','expense',4,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(19,2,'JE-2026-00019','2026-04-24','Expense Payment â€” work_orders','expense_payment',4,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(20,2,'JE-2026-00020','2026-04-25','Expense â€” work_orders','expense',8,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(21,2,'JE-2026-00021','2026-04-25','Expense Payment â€” work_orders','expense_payment',8,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(22,2,'JE-2026-00022','2026-04-25','Expense â€” work_orders','expense',7,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(23,2,'JE-2026-00023','2026-04-25','Expense Payment â€” work_orders','expense_payment',7,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(24,2,'JE-2026-00024','2026-04-25','Expense â€” work_orders','expense',6,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(25,2,'JE-2026-00025','2026-04-25','Expense Payment â€” work_orders','expense_payment',6,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(26,2,'JE-2026-00026','2026-04-25','Expense â€” work_orders','expense',5,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(27,2,'JE-2026-00027','2026-04-25','Expense Payment â€” work_orders','expense_payment',5,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(28,2,'JE-2026-00028','2026-05-02','Expense â€” work_orders','expense',9,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(29,2,'JE-2026-00029','2026-05-02','Expense Payment â€” work_orders','expense_payment',9,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(30,2,'JE-2026-00030','2026-05-09','Expense â€” work_orders','expense',10,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(31,2,'JE-2026-00031','2026-05-09','Expense Payment â€” work_orders','expense_payment',10,'posted',0,NULL,NULL,NULL,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(32,2,'JE-2026-00032','2026-05-19','Expense â€” work_orders','expense',11,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(33,2,'JE-2026-00033','2026-05-19','Expense â€” work_orders','expense',12,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(34,2,'JE-2026-00034','2026-05-19','Expense Payment â€” work_orders','expense_payment',12,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(35,2,'JE-2026-00035','2026-05-21','Expense â€” materials','expense',13,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(36,2,'JE-2026-00036','2026-05-21','Expense Payment â€” materials','expense_payment',13,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(37,2,'JE-2026-00037','2026-05-21','Expense â€” fuel','expense',14,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(38,2,'JE-2026-00038','2026-05-21','Expense Payment â€” fuel','expense_payment',14,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(39,2,'JE-2026-00039','2026-04-01','PO Approved â€” PO #1','purchase_order_approved',1,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(40,2,'JE-2026-00040','2026-04-14','PO Approved â€” PO #8','purchase_order_approved',8,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(41,2,'JE-2026-00041','2026-04-21','PO Approved â€” PO #10','purchase_order_approved',10,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(42,2,'JE-2026-00042','2026-04-24','PO Approved â€” PO #14','purchase_order_approved',14,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(43,2,'JE-2026-00043','2026-04-24','PO Approved â€” PO #13','purchase_order_approved',13,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(44,2,'JE-2026-00044','2026-04-25','PO Approved â€” PO #17','purchase_order_approved',17,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(45,2,'JE-2026-00045','2026-04-30','PO Approved â€” PO #18','purchase_order_approved',18,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(46,2,'JE-2026-00046','2026-04-30','PO Payment â€” PO #18','po_payment',18,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(47,2,'JE-2026-00047','2026-05-20','PO Approved â€” PO #27','purchase_order_approved',27,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(48,2,'JE-2026-00048','2026-05-20','PO Approved â€” PO #29','purchase_order_approved',29,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(49,2,'JE-2026-00049','2026-05-20','PO Approved â€” PO #30','purchase_order_approved',30,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(50,2,'JE-2026-00050','2026-05-20','PO Approved â€” PO #21','purchase_order_approved',21,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(51,2,'JE-2026-00051','2026-05-20','PO Approved â€” PO #31','purchase_order_approved',31,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(52,2,'JE-2026-00052','2026-05-20','PO Approved â€” PO #22','purchase_order_approved',22,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(53,2,'JE-2026-00053','2026-05-20','PO Approved â€” PO #24','purchase_order_approved',24,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(54,2,'JE-2026-00054','2026-05-20','PO Approved â€” PO #26','purchase_order_approved',26,'posted',0,NULL,NULL,NULL,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(55,2,'JE-2026-00055','2026-05-25','test','manual',NULL,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 15:16:25','2026-05-25 15:16:25',NULL),
(56,2,'JE-2026-00056','2026-05-25','Manual Expense â€” travel','expense',15,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 15:53:51','2026-05-25 15:53:51',NULL),
(57,2,'JE-2026-00057','2026-05-25','Work Order Expense Approved â€” WO #12','expense',16,'posted',0,NULL,NULL,NULL,NULL,13,'2026-05-25 17:54:20','2026-05-25 17:54:20',NULL);
/*!40000 ALTER TABLE `journal_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_entry_lines`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_entry_lines`
--

LOCK TABLES `journal_entry_lines` WRITE;
/*!40000 ALTER TABLE `journal_entry_lines` DISABLE KEYS */;
INSERT INTO `journal_entry_lines` VALUES
(1,1,25,7595.70,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(2,1,38,0.00,7420.70,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(3,1,31,0.00,175.00,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(4,2,24,5000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(5,2,25,0.00,5000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(6,3,25,2100.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(7,3,38,0.00,2000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(8,3,31,0.00,100.00,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(9,4,24,2100.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(10,4,25,0.00,2100.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(11,5,25,24570.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(12,5,38,0.00,23400.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(13,5,31,0.00,1170.00,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(14,6,25,24570.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(15,6,38,0.00,23400.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(16,6,31,0.00,1170.00,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(17,7,25,1470.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(18,7,38,0.00,1400.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(19,7,31,0.00,70.00,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(20,8,24,1470.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(21,8,25,0.00,1470.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(22,9,25,4724.94,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(23,9,38,0.00,4499.94,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(24,9,31,0.00,225.00,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(25,10,24,2000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(26,10,25,0.00,2000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(27,11,25,420.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(28,11,38,0.00,400.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(29,11,31,0.00,20.00,NULL,2,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(30,12,40,150.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(31,12,32,0.00,150.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(32,13,32,150.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(33,13,24,0.00,150.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(34,14,40,70.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(35,14,32,0.00,70.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(36,15,32,70.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(37,15,24,0.00,70.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(38,16,40,500.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(39,16,32,0.00,500.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(40,17,32,500.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(41,17,24,0.00,500.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(42,18,40,300.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(43,18,32,0.00,300.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(44,19,32,300.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(45,19,24,0.00,300.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(46,20,40,200.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(47,20,32,0.00,200.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(48,21,32,200.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(49,21,24,0.00,200.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(50,22,40,100.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(51,22,32,0.00,100.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(52,23,32,100.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(53,23,24,0.00,100.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(54,24,40,75.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(55,24,32,0.00,75.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(56,25,32,75.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(57,25,24,0.00,75.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(58,26,40,100.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(59,26,32,0.00,100.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(60,27,32,100.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(61,27,24,0.00,100.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(62,28,40,150.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(63,28,32,0.00,150.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(64,29,32,150.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(65,29,24,0.00,150.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(66,30,40,150.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(67,30,32,0.00,150.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(68,31,32,150.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(69,31,24,0.00,150.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(70,32,40,100.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(71,32,32,0.00,100.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(72,33,40,200.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(73,33,32,0.00,200.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(74,34,32,200.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(75,34,24,0.00,200.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(76,35,42,1000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(77,35,32,0.00,1000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(78,36,32,1000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(79,36,24,0.00,1000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(80,37,44,1000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(81,37,32,0.00,1000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(82,38,32,1000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(83,38,24,0.00,1000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(84,39,40,2000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(85,39,30,0.00,2000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(86,40,40,1350.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(87,40,30,0.00,1350.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(88,41,40,800.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(89,41,30,0.00,800.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(90,42,40,32500.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(91,42,30,0.00,32500.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(92,43,40,32500.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(93,43,30,0.00,32500.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(94,44,40,54499.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(95,44,30,0.00,54499.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(96,45,40,1750.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(97,45,30,0.00,1750.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(98,46,30,1500.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(99,46,24,0.00,1500.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(100,47,40,3000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(101,47,30,0.00,3000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(102,48,40,3000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(103,48,30,0.00,3000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(104,49,40,10000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(105,49,30,0.00,10000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(106,50,40,10000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(107,50,30,0.00,10000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(108,51,40,10000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(109,51,30,0.00,10000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(110,52,40,10000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(111,52,30,0.00,10000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(112,53,40,10000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(113,53,30,0.00,10000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(114,54,40,3000.00,0.00,NULL,0,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(115,54,30,0.00,3000.00,NULL,1,'2026-05-25 12:10:01','2026-05-25 12:10:01',NULL),
(116,55,38,100.00,0.00,'test',0,'2026-05-25 15:16:25','2026-05-25 15:16:25',NULL),
(117,55,33,0.00,100.00,'test',1,'2026-05-25 15:16:25','2026-05-25 15:16:25',NULL),
(118,56,44,500.00,0.00,NULL,0,'2026-05-25 15:53:51','2026-05-25 15:53:51',NULL),
(119,56,32,0.00,500.00,NULL,1,'2026-05-25 15:53:51','2026-05-25 15:53:51',NULL),
(120,57,40,2199.99,0.00,NULL,0,'2026-05-25 17:54:20','2026-05-25 17:54:20',NULL),
(121,57,32,0.00,2199.99,NULL,1,'2026-05-25 17:54:20','2026-05-25 17:54:20',NULL);
/*!40000 ALTER TABLE `journal_entry_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_sources`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_sources`
--

LOCK TABLES `lead_sources` WRITE;
/*!40000 ALTER TABLE `lead_sources` DISABLE KEYS */;
INSERT INTO `lead_sources` VALUES
(1,'Website','Website',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Referral','Referral',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Cold Call','Cold Call',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'Email','Email',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Social Media','Social Media',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Trade Show','Trade Show',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Advertisement','Advertisement',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Partner','Partner',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(9,'Other','Other',9,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `lead_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES
(1,2,'1','harveys@gmail.com','31243243213','Cold Call','[]',NULL,NULL,2,'contacted',NULL,'',NULL,'2026-04-01 22:41:43','2026-05-02 19:27:17',NULL,23,30,NULL,NULL,2,NULL),
(2,2,'2','skumar@gmail.com','32449833','Cold Call','[]',NULL,NULL,10,'converted',NULL,NULL,NULL,'2026-04-01 23:12:46','2026-04-01 23:15:29',NULL,33,42,NULL,NULL,2,NULL),
(3,2,'3','skumar@gmail.com','32449833','Referral','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-04-01 23:51:46','2026-04-02 00:01:44',NULL,33,42,NULL,NULL,4,NULL),
(4,2,'4','skumar@gmail.com','32449833','Social Media','[]',NULL,NULL,2,'qualified',NULL,NULL,NULL,'2026-04-02 00:49:35','2026-04-25 11:39:55','2026-04-25 11:39:55',33,42,NULL,NULL,2,NULL),
(5,2,'5','pshankar@gmail.com','58340958345','Cold Call','[]',NULL,NULL,10,'converted',NULL,NULL,NULL,'2026-04-02 14:46:42','2026-04-02 14:55:53',NULL,26,33,NULL,NULL,4,NULL),
(6,2,'6','robertd@gmail.com','978658789','Social Media','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-04-02 15:11:33','2026-04-02 15:13:08',NULL,31,39,NULL,NULL,2,NULL),
(7,2,'7','prasadn@gmail.com','657657658','Cold Call','[]',NULL,NULL,10,'converted',NULL,NULL,NULL,'2026-04-03 14:46:58','2026-04-03 14:48:13',NULL,25,32,NULL,NULL,3,NULL),
(8,2,'8','skumar@gmail.com','32449833','Email','[]',NULL,NULL,11,'converted',NULL,NULL,NULL,'2026-04-03 19:19:04','2026-04-28 12:32:42',NULL,33,42,NULL,NULL,5,NULL),
(9,2,'9','ram@gmil.com','59683096734','Cold Call','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-04-14 10:43:58','2026-04-14 10:51:33',NULL,34,43,NULL,NULL,2,NULL),
(10,2,'10','robertd@gmail.com','978658789','Cold Call','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-04-20 15:50:08','2026-04-20 15:52:45',NULL,31,39,NULL,NULL,3,NULL),
(11,2,'11','riya@novotell.com','+971556677881','Referral','[]',NULL,'Ewaste as Hazardous Category ',6,'converted',NULL,NULL,NULL,'2026-04-22 20:50:16','2026-04-28 12:31:28',NULL,36,45,NULL,NULL,6,NULL),
(12,2,'12','pshankar@gmail.com','58340958345','Cold Call','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-04-24 18:18:06','2026-04-24 18:21:42',NULL,26,33,NULL,NULL,4,NULL),
(13,2,'13','sakethg@gmail.com','47349625','Trade Show','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-04-24 18:41:49','2026-04-30 11:37:43',NULL,18,23,NULL,NULL,5,NULL),
(14,2,'14','riya@novotell.com','+971556677881','Cold Call','[]',NULL,NULL,NULL,'converted',NULL,NULL,NULL,'2026-04-30 11:23:44','2026-05-02 17:51:19',NULL,36,45,NULL,NULL,3,NULL),
(15,2,'15','john@gmail.com','579853433','Cold Call','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-04-30 13:11:01','2026-04-30 13:13:07',NULL,22,29,NULL,NULL,4,NULL),
(16,2,'16','harveys@gmail.com','31243243213','Cold Call','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-04-30 13:45:16','2026-04-30 13:46:37',NULL,23,30,NULL,NULL,6,NULL),
(17,2,'17','robertd@gmail.com','978658789','Cold Call','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-05-09 18:17:55','2026-05-09 18:36:35',NULL,31,39,NULL,NULL,5,6),
(18,2,'18','Regina@paragon.com','9876543210','Advertisement','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-05-20 07:52:34','2026-05-20 13:44:26',NULL,39,47,NULL,NULL,6,6),
(19,2,'19','pete@gmail.com','97155600236','Social Media','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-05-20 13:40:53','2026-05-21 10:36:23',NULL,41,54,NULL,NULL,5,6),
(20,2,'20','webber@gmail.com','97156644887','Social Media','[]',NULL,NULL,14,'converted',NULL,NULL,NULL,'2026-05-20 20:03:06','2026-05-25 15:51:19',NULL,43,58,NULL,NULL,5,NULL),
(21,2,'21','vincentgarry@gmail.com','+971 540934093','Cold Call','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-05-22 09:37:49','2026-05-22 09:45:45',NULL,44,61,NULL,NULL,6,6),
(22,2,'22','vincentgarry@gmail.com','+971 540934093','Advertisement','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-05-22 12:05:36','2026-05-22 12:10:39',NULL,44,61,NULL,NULL,4,6),
(23,2,'23','wopy@mailinator.com','+1 (883) 267-9465','Cold Call','[]',NULL,NULL,10,'qualified',NULL,NULL,NULL,'2026-05-25 14:32:02','2026-05-25 14:32:21',NULL,1,1,NULL,NULL,2,NULL),
(24,2,'24','riya@novotell.com','+971556677881','Cold Call','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-05-25 14:50:36','2026-05-25 14:51:42',NULL,36,45,NULL,NULL,2,6),
(25,2,'25','vincentgarry@gmail.com','+971 540934093','Cold Call','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-05-25 15:55:55','2026-05-25 16:10:28',NULL,44,61,NULL,NULL,5,6);
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_types`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=423 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_types`
--

LOCK TABLES `material_types` WRITE;
/*!40000 ALTER TABLE `material_types` DISABLE KEYS */;
INSERT INTO `material_types` VALUES
(1,'metal','Metal',1,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(2,'plastic','Plastic',2,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(3,'paper','Paper',3,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(4,'glass','Glass',4,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(5,'organic','Organic',5,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(6,'electronic','Electronic',6,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(7,'hazardous','Hazardous',7,1,'2026-02-27 11:45:28','2026-02-27 11:45:28'),
(8,'other','Other',99,1,'2026-02-27 11:45:28','2026-02-27 11:45:28');
/*!40000 ALTER TABLE `material_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migration_history`
--

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

--
-- Dumping data for table `migration_history`
--

LOCK TABLES `migration_history` WRITE;
/*!40000 ALTER TABLE `migration_history` DISABLE KEYS */;
INSERT INTO `migration_history` VALUES
(1,'20260223000000-initial-schema.js','2026-02-22 21:40:11'),
(2,'20260223000001-drop-deals-create-dropdowns.js','2026-02-22 21:40:35'),
(3,'20260223000002-create-products-services.js','2026-02-22 21:40:36'),
(4,'20260223000003-create-deals.js','2026-02-22 21:40:36'),
(5,'20260223100000-create-separate-dropdown-tables.js','2026-02-22 22:06:13'),
(6,'20260223110000-add-product-type.js','2026-02-23 14:04:27'),
(7,'20260223120000-add-dynamic-categories.js','2026-02-23 14:07:21');
/*!40000 ALTER TABLE `migration_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES
(1,2,2,'inspection_rejected','Inspection request rejected','Your inspection request for deal \"Deal from Lead 9\" (SVL Groups) was rejected by Admin User. Reason: not necessary','inspection_request',13,0,'2026-05-25 16:15:04','2026-05-25 16:15:04'),
(2,2,6,'inspection_rejected','Inspection request rejected','Your inspection request for deal \"Deal from Lead 25\" (V Groups) was rejected by Inspection User. Reason: not relevant','inspection_request',17,0,'2026-05-25 16:35:15','2026-05-25 16:35:15');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_statuses`
--

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

--
-- Dumping data for table `payment_statuses`
--

LOCK TABLES `payment_statuses` WRITE;
/*!40000 ALTER TABLE `payment_statuses` DISABLE KEYS */;
INSERT INTO `payment_statuses` VALUES
(1,'unpaid','Unpaid',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'partial','Partially Paid',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'paid','Fully Paid',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `payment_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'e.g., clients.create, deals.update, invoices.delete',
  `display_name` varchar(100) NOT NULL,
  `module` enum('users','roles','contacts','companies','suppliers','leads','products','deals','inspection_requests','inspection_reports') NOT NULL,
  `action` enum('create','read','update','delete','approve','export') NOT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=660 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES
(1,'dashboard.create','Create Dashboard','','create','Permission to create dashboard',NULL),
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
(549,'inspection_requests.update','Update Inspection Requests','inspection_requests','update','Permission to update inspection requests',NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_categories`
--

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

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES
(1,'Waste Collection','Waste Collection',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Recycling','Recycling',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Disposal','Disposal',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'ITAD Services','ITAD Services',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Hazardous Waste','Hazardous Waste',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Consulting','Consulting',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Equipment Rental','Equipment Rental',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Other','Other',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products_services`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_services`
--

LOCK TABLES `products_services` WRITE;
/*!40000 ALTER TABLE `products_services` DISABLE KEYS */;
INSERT INTO `products_services` VALUES
(1,2,'Test Product','product','Recycling','Test product for QA',NULL,100.00,'AED','active','2026-02-23 01:52:41','2026-02-23 01:52:41',NULL),
(2,2,'Data  Erasure','product','ITAD Services','Destruction of Hard disks','piece',60.00,'AED','active','2026-03-05 11:03:43','2026-03-05 11:03:43',NULL),
(3,2,'Chemical Disposal','product','Disposal','Chemical Disposal ','kg',20.00,'AED','active','2026-03-10 12:51:10','2026-03-10 12:51:10',NULL),
(4,2,'metals purchase','product','Recycling','','ton',249.79,'AED','active','2026-04-01 23:51:01','2026-04-01 23:51:01',NULL),
(5,2,'Food Disposal','product','Disposal','','ton',200.00,'AED','active','2026-04-03 19:18:26','2026-04-03 19:18:26',NULL),
(6,2,'Lights and Bulbs Recycling ','product','Recycling','Ewaste - Lights and Bulbs Recycling ','ton',400.00,'AED','active','2026-04-22 20:49:37','2026-04-22 20:49:37',NULL);
/*!40000 ALTER TABLE `products_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proforma_invoice_items`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proforma_invoice_items`
--

LOCK TABLES `proforma_invoice_items` WRITE;
/*!40000 ALTER TABLE `proforma_invoice_items` DISABLE KEYS */;
INSERT INTO `proforma_invoice_items` VALUES
(1,1,2,'Data  Erasure',56.0100,70.00,3920.70,'piece',0,'2026-04-22 20:17:40','2026-04-22 20:17:40',NULL),
(2,1,3,'Chemical Disposal',10.0000,350.00,3500.00,'ton',1,'2026-04-22 20:17:40','2026-04-22 20:17:40',NULL),
(3,2,6,'Lights and Bulbs Recycling ',100.0000,20.00,2000.00,'piece',0,'2026-05-02 17:46:01','2026-05-02 17:46:01',NULL),
(4,3,6,'Lights and Bulbs Recycling ',78.0000,300.00,23400.00,'kg',0,'2026-05-02 17:54:21','2026-05-02 17:54:21',NULL),
(5,4,6,'Lights and Bulbs Recycling ',78.0000,300.00,23400.00,'kg',0,'2026-05-02 17:56:00','2026-05-02 17:56:00',NULL),
(6,5,5,'Food Disposal - onion',7.0000,200.00,1400.00,'ton',0,'2026-05-09 20:09:37','2026-05-09 20:09:37',NULL),
(7,6,5,'Food Disposal',6.0000,749.99,4499.94,'ton',0,'2026-05-19 17:59:08','2026-05-19 17:59:08',NULL),
(8,7,6,'Lights and Bulbs Recycling ',1.0000,400.00,400.00,'ton',0,'2026-05-22 11:50:07','2026-05-22 11:50:07',NULL);
/*!40000 ALTER TABLE `proforma_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proforma_invoices`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proforma_invoices`
--

LOCK TABLES `proforma_invoices` WRITE;
/*!40000 ALTER TABLE `proforma_invoices` DISABLE KEYS */;
INSERT INTO `proforma_invoices` VALUES
(1,2,6,9,'PF-2026-00001','2026-04-22','AED',7420.70,5.00,175.00,7595.70,NULL,2,'2026-04-22 20:17:40','2026-04-22 20:17:40','2026-05-22',NULL),
(2,2,15,18,'PF-2026-00002','2026-05-02','AED',2000.00,5.00,100.00,2100.00,NULL,2,'2026-05-02 17:46:01','2026-05-02 17:46:01','2026-06-01',NULL),
(3,2,16,19,'PF-2026-00003','2026-05-02','AED',23400.00,5.00,1170.00,24570.00,NULL,2,'2026-05-02 17:54:21','2026-05-02 17:54:21','2026-06-01',NULL),
(4,2,16,19,'PF-2026-00004','2026-05-02','AED',23400.00,5.00,1170.00,24570.00,NULL,2,'2026-05-02 17:56:00','2026-05-02 17:56:00','2026-06-01',NULL),
(5,2,17,20,'PF-2026-00005','2026-05-09','AED',1400.00,5.00,70.00,1470.00,NULL,2,'2026-05-09 20:09:37','2026-05-09 20:09:37','2026-06-08',NULL),
(6,2,7,11,'PF-2026-00006','2026-05-19','AED',4499.94,5.00,225.00,4724.94,NULL,2,'2026-05-19 17:59:08','2026-05-19 17:59:08','2026-06-18',NULL),
(7,2,21,26,'PF-2026-00007','2026-05-22','AED',400.00,5.00,20.00,420.00,NULL,6,'2026-05-22 11:50:07','2026-05-22 11:50:07','2026-06-21',NULL);
/*!40000 ALTER TABLE `proforma_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

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
  PRIMARY KEY (`id`),
  KEY `idx_purchase_order_id` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES
(2,2,2,'Refurbishing','25.00','450.00','11250.00',0,'2026-03-08 22:16:19','2026-03-08 22:16:19',NULL),
(3,3,2,'100','10.00','100.00','1000.00',0,'2026-03-10 12:33:15','2026-03-10 12:33:15',NULL),
(4,4,3,NULL,'20.00','50','1000.00',0,'2026-03-10 13:12:25','2026-03-10 13:12:25',NULL),
(5,5,1,'Discounted Price','100.00','10.00','1000.00',0,'2026-03-19 13:07:11','2026-03-19 13:07:11',NULL),
(7,6,1,'Discounted Price','100.00','10.00','1000.00',0,'2026-03-23 08:54:44','2026-03-23 08:54:44',NULL),
(8,7,3,NULL,'100.00','84.99','8499.00',0,'2026-04-01 12:11:52','2026-04-01 12:11:52',NULL),
(11,1,4,NULL,'8.00','250','2000.00',0,'2026-04-02 00:44:32','2026-04-02 00:44:32',NULL),
(12,2,4,NULL,'8.00','250','2000.00',0,'2026-04-02 14:41:56','2026-04-02 14:41:56',NULL),
(16,5,2,NULL,'15.00','90.00','1350.00',0,'2026-04-02 15:15:03','2026-04-02 15:15:03',NULL),
(17,6,2,NULL,'15.00','90.00','1350.00',0,'2026-04-02 15:18:18','2026-04-02 15:18:18',NULL),
(18,7,2,NULL,'15.00','90.00','1350.00',0,'2026-04-02 15:22:12','2026-04-02 15:22:12',NULL),
(20,8,2,NULL,'15.00','90.00','1350.00',0,'2026-04-14 11:14:36','2026-04-14 11:14:36',NULL),
(21,9,2,NULL,'1.00','0.00','0.00',0,'2026-04-21 13:31:17','2026-04-21 13:31:17',NULL),
(22,9,2,NULL,'20.00','40.00','800.00',1,'2026-04-21 13:31:17','2026-04-21 13:31:17',NULL),
(23,10,2,NULL,'1.00','0.00','0.00',0,'2026-04-21 13:31:52','2026-04-21 13:31:52',NULL),
(24,10,2,NULL,'20.00','40.00','800.00',1,'2026-04-21 13:31:52','2026-04-21 13:31:52',NULL),
(25,11,2,NULL,'1.00','0.00','0.00',0,'2026-04-21 13:32:46','2026-04-21 13:32:46',NULL),
(26,11,2,NULL,'20.00','40.00','800.00',1,'2026-04-21 13:32:46','2026-04-21 13:32:46',NULL),
(27,12,1,NULL,'1.00','1','1.00',0,'2026-04-21 13:33:24','2026-04-21 13:33:24',NULL),
(28,13,4,NULL,'13.00','2500.00','32500.00',0,'2026-04-24 18:23:25','2026-04-24 18:23:25',NULL),
(29,14,4,NULL,'13.00','2500.00','32500.00',0,'2026-04-24 18:30:35','2026-04-24 18:30:35',NULL),
(30,15,2,NULL,'1.00','800.00','800.00',0,'2026-04-25 12:05:32','2026-04-25 12:05:32',NULL),
(31,15,4,NULL,'13.00','2500.00','32500.00',1,'2026-04-25 12:05:32','2026-04-25 12:05:32',NULL),
(32,16,2,NULL,'1.00','800.00','800.00',0,'2026-04-25 12:12:39','2026-04-25 12:12:39',NULL),
(33,16,4,NULL,'13.00','2500.00','32500.00',1,'2026-04-25 12:12:39','2026-04-25 12:12:39',NULL),
(34,17,1,NULL,'50.00','1000.00','50000',0,'2026-04-25 12:15:53','2026-04-25 12:15:53',NULL),
(35,17,5,NULL,'6.00','749.99','4499',1,'2026-04-25 12:15:53','2026-04-25 12:15:53',NULL),
(36,18,4,NULL,'7.00','250.00','1750.00',0,'2026-04-30 13:13:48','2026-04-30 13:13:48',NULL),
(37,19,4,NULL,'7.00','250.00','1750.00',0,'2026-04-30 13:15:10','2026-04-30 13:15:10',NULL),
(38,20,5,'Chocolate','7.00','200.00','1400.00',0,'2026-05-04 16:51:49','2026-05-04 16:51:49',NULL),
(39,21,6,NULL,'25.00','400.00','10000.00',0,'2026-05-20 07:58:10','2026-05-20 07:58:10',NULL),
(40,22,6,NULL,'25.00','400.00','10000.00',0,'2026-05-20 07:59:12','2026-05-20 07:59:12',NULL),
(41,23,6,NULL,'25.00','400.00','10000.00',0,'2026-05-20 08:00:13','2026-05-20 08:00:13',NULL),
(42,24,6,NULL,'25.00','400.00','10000.00',0,'2026-05-20 08:00:41','2026-05-20 08:00:41',NULL),
(43,25,5,NULL,'15.00','200.00','3000.00',0,'2026-05-20 13:46:59','2026-05-20 13:46:59',NULL),
(44,26,5,NULL,'15.00','200.00','3000.00',0,'2026-05-20 13:48:22','2026-05-20 13:48:22',NULL),
(45,27,5,NULL,'15.00','200.00','3000.00',0,'2026-05-20 13:50:01','2026-05-20 13:50:01',NULL),
(46,28,5,NULL,'15.00','200.00','3000.00',0,'2026-05-20 13:51:00','2026-05-20 13:51:00',NULL),
(47,29,5,'def','15.00','200.00','3000.00',0,'2026-05-20 20:07:38','2026-05-20 20:07:38',NULL),
(48,30,5,'789','50.00','200.00','10000.00',0,'2026-05-20 20:08:31','2026-05-20 20:08:31',NULL),
(49,31,5,'jkl','50.00','200.00','10000.00',0,'2026-05-20 20:09:17','2026-05-20 20:09:17',NULL);
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_statuses`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=390 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_statuses`
--

LOCK TABLES `purchase_order_statuses` WRITE;
/*!40000 ALTER TABLE `purchase_order_statuses` DISABLE KEYS */;
INSERT INTO `purchase_order_statuses` VALUES
(384,'new','New',1,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(385,'sent','Sent',2,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(386,'under_review','Under Review',3,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(387,'revised','Revised',4,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(388,'approved','Approved',5,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(389,'rejected','Rejected',6,1,'2026-05-25 17:13:05','2026-05-25 17:13:05');
/*!40000 ALTER TABLE `purchase_order_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_terms`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_terms`
--

LOCK TABLES `purchase_order_terms` WRITE;
/*!40000 ALTER TABLE `purchase_order_terms` DISABLE KEYS */;
INSERT INTO `purchase_order_terms` VALUES
(2,2,1,0,'2026-03-08 22:16:19','2026-03-08 22:16:19',NULL),
(3,3,1,0,'2026-03-10 12:33:15','2026-03-10 12:33:15',NULL),
(4,4,1,0,'2026-03-10 13:12:25','2026-03-10 13:12:25',NULL),
(5,4,2,1,'2026-03-10 13:12:25','2026-03-10 13:12:25',NULL),
(7,6,1,0,'2026-03-23 08:54:44','2026-03-23 08:54:44',NULL),
(11,1,1,0,'2026-04-02 00:44:32','2026-04-02 00:44:32',NULL),
(12,1,2,1,'2026-04-02 00:44:32','2026-04-02 00:44:32',NULL),
(13,2,2,0,'2026-04-02 14:41:56','2026-04-02 14:41:56',NULL),
(18,8,1,0,'2026-04-14 11:14:36','2026-04-14 11:14:36',NULL),
(19,8,2,1,'2026-04-14 11:14:36','2026-04-14 11:14:36',NULL),
(20,9,1,0,'2026-04-21 13:31:17','2026-04-21 13:31:17',NULL),
(21,9,2,1,'2026-04-21 13:31:17','2026-04-21 13:31:17',NULL),
(22,10,1,0,'2026-04-21 13:31:52','2026-04-21 13:31:52',NULL),
(23,10,2,1,'2026-04-21 13:31:52','2026-04-21 13:31:52',NULL),
(24,11,1,0,'2026-04-21 13:32:46','2026-04-21 13:32:46',NULL),
(25,11,2,1,'2026-04-21 13:32:46','2026-04-21 13:32:46',NULL),
(26,12,1,0,'2026-04-21 13:33:24','2026-04-21 13:33:24',NULL),
(27,12,2,1,'2026-04-21 13:33:24','2026-04-21 13:33:24',NULL),
(28,13,3,0,'2026-04-24 18:23:25','2026-04-24 18:23:25',NULL),
(29,14,3,0,'2026-04-24 18:30:35','2026-04-24 18:30:35',NULL),
(30,15,1,0,'2026-04-25 12:05:32','2026-04-25 12:05:32',NULL),
(31,15,3,1,'2026-04-25 12:05:32','2026-04-25 12:05:32',NULL),
(32,16,1,0,'2026-04-25 12:12:39','2026-04-25 12:12:39',NULL),
(33,16,3,1,'2026-04-25 12:12:39','2026-04-25 12:12:39',NULL),
(34,17,1,0,'2026-04-25 12:15:53','2026-04-25 12:15:53',NULL),
(35,17,4,1,'2026-04-25 12:15:53','2026-04-25 12:15:53',NULL),
(36,17,2,2,'2026-04-25 12:15:53','2026-04-25 12:15:53',NULL),
(37,18,3,0,'2026-04-30 13:13:48','2026-04-30 13:13:48',NULL),
(38,18,4,1,'2026-04-30 13:13:48','2026-04-30 13:13:48',NULL),
(39,19,3,0,'2026-04-30 13:15:10','2026-04-30 13:15:10',NULL),
(40,19,4,1,'2026-04-30 13:15:10','2026-04-30 13:15:10',NULL),
(41,20,3,0,'2026-05-04 16:51:49','2026-05-04 16:51:49',NULL),
(42,20,2,1,'2026-05-04 16:51:49','2026-05-04 16:51:49',NULL),
(43,22,3,0,'2026-05-20 07:59:12','2026-05-20 07:59:12',NULL),
(44,23,3,0,'2026-05-20 08:00:13','2026-05-20 08:00:13',NULL),
(45,24,3,0,'2026-05-20 08:00:41','2026-05-20 08:00:41',NULL),
(46,25,2,0,'2026-05-20 13:46:59','2026-05-20 13:46:59',NULL),
(47,26,2,0,'2026-05-20 13:48:22','2026-05-20 13:48:22',NULL),
(48,27,2,0,'2026-05-20 13:50:01','2026-05-20 13:50:01',NULL),
(49,28,2,0,'2026-05-20 13:51:00','2026-05-20 13:51:00',NULL),
(50,29,2,0,'2026-05-20 20:07:38','2026-05-20 20:07:38',NULL),
(51,30,3,0,'2026-05-20 20:08:31','2026-05-20 20:08:31',NULL),
(52,31,3,0,'2026-05-20 20:09:17','2026-05-20 20:09:17',NULL);
/*!40000 ALTER TABLE `purchase_order_terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

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
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `company_id` int(11) DEFAULT NULL,
  `payment_status` varchar(20) NOT NULL DEFAULT 'unpaid',
  `paid_amount` decimal(15,2) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `work_order_id` int(11) DEFAULT NULL,
  `document_type` varchar(20) NOT NULL DEFAULT 'quotation',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_po_status` (`status`),
  KEY `idx_po_company` (`company_id`),
  KEY `idx_po_payment` (`payment_status`),
  KEY `fk_po_work_order` (`work_order_id`),
  CONSTRAINT `fk_po_work_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES
(1,2,NULL,'2026-04-01',NULL,'2026-04-02 00:05:39','2026-04-02 00:44:32',3,'approved',33,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(2,2,NULL,'2026-04-02',NULL,'2026-04-02 14:41:56','2026-04-02 14:41:56',3,'new',33,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(7,2,NULL,'2026-04-02',NULL,'2026-04-02 15:22:12','2026-04-02 15:22:12',6,'new',31,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(8,2,NULL,'2026-04-14',NULL,'2026-04-14 11:05:33','2026-04-14 11:14:36',6,'approved',31,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(10,2,5,'2026-04-21',NULL,'2026-04-21 13:31:52','2026-04-21 13:31:52',8,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(11,2,NULL,'2026-04-21',NULL,'2026-04-21 13:32:46','2026-04-21 13:32:46',8,'new',35,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(12,2,NULL,'2026-04-21',NULL,'2026-04-21 13:33:24','2026-04-21 13:33:24',7,'new',35,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(13,2,NULL,'2026-04-24',NULL,'2026-04-24 18:23:25','2026-04-24 18:23:25',10,'approved',26,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(14,2,NULL,'2026-04-24',NULL,'2026-04-24 18:30:35','2026-04-24 18:30:35',10,'approved',26,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(15,2,NULL,'2026-04-25',NULL,'2026-04-25 12:05:32','2026-04-25 12:05:32',10,'new',26,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(16,2,NULL,'2026-04-25',NULL,'2026-04-25 12:12:39','2026-04-25 12:12:39',10,'new',26,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(17,2,3,'2026-04-25',NULL,'2026-04-25 12:15:53','2026-04-25 12:15:53',11,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(18,2,NULL,'2026-04-30',NULL,'2026-04-30 13:13:48','2026-05-02 18:07:22',17,'approved',22,'partial',1500.00,'2026-10-05',NULL,NULL,'quotation'),
(19,2,NULL,'2026-04-30',NULL,'2026-04-30 13:15:10','2026-04-30 13:15:10',17,'new',22,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(20,2,NULL,'2026-05-04',NULL,'2026-05-04 16:51:49','2026-05-04 16:51:49',17,'new',22,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(21,2,6,'2026-05-20',NULL,'2026-05-20 07:58:10','2026-05-20 07:58:10',21,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(22,2,NULL,'2026-05-20','25/05/2026','2026-05-20 07:59:12','2026-05-20 07:59:12',21,'approved',39,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(23,2,NULL,'2026-05-20',NULL,'2026-05-20 08:00:13','2026-05-20 08:00:13',21,'sent',39,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(24,2,NULL,'2026-05-20','25/05/2026','2026-05-20 08:00:41','2026-05-20 08:00:41',21,'approved',39,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(25,2,NULL,'2026-05-20',NULL,'2026-05-20 13:46:59','2026-05-20 13:46:59',22,'new',39,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(26,2,6,'2026-05-20',NULL,'2026-05-20 13:48:22','2026-05-20 13:48:22',22,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(27,2,4,'2026-05-20',NULL,'2026-05-20 13:50:01','2026-05-20 13:50:01',22,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(28,2,NULL,'2026-05-20','25/05/2026','2026-05-20 13:51:00','2026-05-20 13:51:00',22,'new',39,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(29,2,7,'2026-05-20','25/05/2026','2026-05-20 20:07:38','2026-05-20 20:07:38',22,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(30,2,6,'2026-05-20','25/05/2026','2026-05-20 20:08:31','2026-05-20 20:08:31',23,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation'),
(31,2,6,'2026-05-20','25/05/2026','2026-05-20 20:09:17','2026-05-20 20:09:17',23,'approved',NULL,'unpaid',NULL,NULL,NULL,NULL,'quotation');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_statuses`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=339 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_statuses`
--

LOCK TABLES `quotation_statuses` WRITE;
/*!40000 ALTER TABLE `quotation_statuses` DISABLE KEYS */;
INSERT INTO `quotation_statuses` VALUES
(333,'new','New',1,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(334,'sent','Sent',2,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(335,'under_review','Under Review',3,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(336,'revised','Revised',4,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(337,'approved','Approved',5,1,'2026-05-25 17:13:05','2026-05-25 17:13:05'),
(338,'rejected','Rejected',6,1,'2026-05-25 17:13:05','2026-05-25 17:13:05');
/*!40000 ALTER TABLE `quotation_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotations`
--

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
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `remarks` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_prepared_by` (`prepared_by`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotations`
--

LOCK TABLES `quotations` WRITE;
/*!40000 ALTER TABLE `quotations` DISABLE KEYS */;
INSERT INTO `quotations` VALUES
(1,2,2,2,'2026-04-01',9454.73,'AED','new',NULL,'2026-04-01 23:19:52','2026-04-01 23:19:52',NULL),
(2,2,2,2,'2026-04-01',9454.73,'AED','approved',NULL,'2026-04-01 23:23:34','2026-04-01 23:30:37',NULL),
(3,2,5,10,'2026-04-02',845.25,'AED','new',NULL,'2026-04-02 14:59:16','2026-04-02 14:59:16',NULL),
(4,2,7,6,'2026-04-03',6720.00,'AED','new',NULL,'2026-04-03 14:50:26','2026-04-03 14:50:26',NULL),
(5,2,8,2,'2026-04-14',840.00,'AED','approved',NULL,'2026-04-14 10:59:59','2026-04-14 11:12:40',NULL),
(6,2,9,2,'2026-04-20',3675.00,'AED','new',NULL,'2026-04-20 15:53:26','2026-04-20 15:53:26',NULL),
(7,2,11,2,'2026-04-24',4724.94,'AED','approved',NULL,'2026-04-24 18:54:17','2026-04-24 18:54:17',NULL),
(8,2,11,2,'2026-04-24',4724.94,'AED','approved',NULL,'2026-04-24 18:56:16','2026-04-24 18:56:16',NULL),
(9,2,11,12,'2026-04-25',4724.94,'AED','new',NULL,'2026-04-25 11:42:31','2026-04-25 11:42:31',NULL),
(10,2,11,10,'2026-04-25',4724.94,'AED','new',NULL,'2026-04-25 12:13:48','2026-04-25 12:13:48',NULL),
(11,2,11,2,'2026-04-30',4724.94,'AED','approved',NULL,'2026-04-30 13:38:34','2026-04-30 13:38:34',NULL),
(12,2,11,2,'2026-04-30',4724.94,'AED','approved',NULL,'2026-04-30 13:39:05','2026-04-30 13:39:05',NULL),
(13,2,18,2,'2026-04-30',2100.00,'AED','approved',NULL,'2026-04-30 13:46:58','2026-04-30 13:46:58',NULL),
(14,2,18,2,'2026-04-30',2100.00,'AED','approved',NULL,'2026-04-30 13:51:22','2026-04-30 13:51:22',NULL),
(15,2,18,2,'2026-04-30',2100.00,'AED','approved',NULL,'2026-04-30 13:54:15','2026-04-30 13:54:15',NULL),
(16,2,19,10,'2026-05-02',24570.00,'AED','approved',NULL,'2026-05-02 17:52:05','2026-05-02 17:52:43',NULL),
(17,2,20,6,'2026-05-09',1470.00,'AED','approved',NULL,'2026-05-09 19:19:52','2026-05-09 19:22:12',NULL),
(18,2,21,6,'2026-05-20',10500.00,'AED','under_review',NULL,'2026-05-20 07:57:30','2026-05-20 07:57:30',NULL),
(19,2,20,6,'2026-05-20',1470.00,'AED','approved',NULL,'2026-05-20 13:45:47','2026-05-25 16:54:26',NULL),
(20,2,22,14,'2026-05-20',3150.00,'AED','approved','456','2026-05-20 20:06:34','2026-05-20 20:06:34',NULL),
(21,2,26,6,'2026-05-22',420.00,'AED','approved',NULL,'2026-05-22 09:46:58','2026-05-22 09:48:31',NULL),
(22,2,28,6,'2026-05-25',630.00,'AED','approved',NULL,'2026-05-25 14:59:45','2026-05-25 15:00:03',NULL),
(23,2,30,6,'2026-05-25',1050.00,'AED','approved',NULL,'2026-05-25 16:53:07','2026-05-25 16:53:55',NULL);
/*!40000 ALTER TABLE `quotations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=17623 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES
(1,1,1,NULL),
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
(16006,7,26,NULL);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,1,'tenant_admin','Tenant Administrator','Full access to tenant resources',1,'active','2026-02-13 23:32:05','2026-02-13 23:32:05',NULL),
(2,2,'admin','Administrator','Full access',0,'active','2026-02-22 11:34:40','2026-02-22 11:34:40',NULL),
(3,NULL,'super_admin','Super Administrator','Full system access - manage roles, permissions, and users',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(4,NULL,'inspection_team','Inspection Team','View inspection requests and add inspection reports',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(5,NULL,'sales_manager','Sales Manager','Full access to leads, deals, contacts, quotations, inspection requests',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(6,NULL,'sales','Sales','Access to own leads, deals, contacts, quotations, and inspection requests only',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(7,NULL,'operations_manager','Operations Manager','Full access to Operations (work orders); view-only deals',1,'active','2026-04-30 11:09:27','2026-04-30 11:09:27',NULL),
(8,NULL,'accounts','Accounts','Full access to Accounts (invoices, receivables, payables, expenses); view-only deals',1,'active','2026-04-30 11:09:27','2026-04-30 11:09:27',NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizemeta`
--

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_interests`
--

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

--
-- Dumping data for table `service_interests`
--

LOCK TABLES `service_interests` WRITE;
/*!40000 ALTER TABLE `service_interests` DISABLE KEYS */;
INSERT INTO `service_interests` VALUES
(1,'Waste Collection','Waste Collection',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Recycling','Recycling',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Disposal','Disposal',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'ITAD Services','ITAD Services',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Hazardous Waste','Hazardous Waste',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Consulting','Consulting',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Other','Other',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `service_interests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_types`
--

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

--
-- Dumping data for table `service_types`
--

LOCK TABLES `service_types` WRITE;
/*!40000 ALTER TABLE `service_types` DISABLE KEYS */;
INSERT INTO `service_types` VALUES
(1,'Waste Collection','Regular waste collection services',1,1,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(2,'Recycling','Recycling services for various materials',1,2,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(3,'Disposal','Waste disposal services',1,3,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(4,'ITAD Services','IT Asset Disposition services',1,4,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(5,'Hazardous Waste','Hazardous waste management',1,5,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(6,'Consulting','Environmental consulting services',1,6,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL),
(7,'Other','Other services',1,7,'2026-02-23 00:11:44','2026-02-23 00:11:44',NULL);
/*!40000 ALTER TABLE `service_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `statuses`
--

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

--
-- Dumping data for table `statuses`
--

LOCK TABLES `statuses` WRITE;
/*!40000 ALTER TABLE `statuses` DISABLE KEYS */;
INSERT INTO `statuses` VALUES
(1,'active','Active',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'inactive','Inactive',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_contacts`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_contacts`
--

LOCK TABLES `supplier_contacts` WRITE;
/*!40000 ALTER TABLE `supplier_contacts` DISABLE KEYS */;
INSERT INTO `supplier_contacts` VALUES
(1,1,1,NULL,0,'2026-02-27 13:49:55','2026-02-27 13:49:55',NULL),
(3,2,19,'Management',1,'2026-03-05 15:56:32','2026-03-05 15:56:32','2026-03-06 09:46:31'),
(4,3,31,'Management',1,'2026-03-08 22:01:47','2026-03-08 22:01:47',NULL),
(5,6,35,'Operations',1,'2026-03-10 12:50:33','2026-03-10 12:50:33',NULL),
(6,5,27,'Technical',0,'2026-03-19 13:01:38','2026-03-19 13:01:38',NULL),
(8,3,46,NULL,1,'2026-05-02 19:10:46','2026-05-02 19:10:46',NULL),
(9,7,40,'Sales',1,'2026-05-02 19:16:20','2026-05-02 19:16:20',NULL);
/*!40000 ALTER TABLE `supplier_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES
(1,2,'1','Test Supplier',2,'Manufacturing',NULL,NULL,NULL,'0562933755','UAE','Dubai',NULL,NULL,'active','2026-02-27 13:49:55','2026-02-27 13:49:55',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(2,2,'SUP-MMDDDO7H-62F98466','Prasad N',19,NULL,'',NULL,'prasadn@gmail.com',NULL,'UAE','Dubai','morocco',NULL,'active','2026-03-05 15:15:54','2026-03-06 09:46:31','2026-03-06 09:46:31','individual',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(3,2,'3','Pfizer',31,'Hospitality',NULL,NULL,'Pfizer@gmail.com','732469234','UAE','Abu Dhabi','mussafah',NULL,'active','2026-03-08 22:01:47','2026-03-08 22:01:47',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(4,2,'4','SHOBA',NULL,'Construction',NULL,NULL,'shobagroups@gmail.com','3425545','UAE','Dubai','Dubai',NULL,'active','2026-03-09 14:23:41','2026-03-09 14:23:41',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(5,2,'5','test vendor123',27,'Manufacturing','',NULL,'test@gmail.com','6456465456','UAE','Dubai','asdfghjk',NULL,'active','2026-03-09 14:25:03','2026-03-19 13:01:38',NULL,'organization','55555555',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(6,2,'6','EvoGreen',35,'Environmental Services','https://www.evogreen.com',NULL,'abc@evogreen.com','042232322','UAE','Sharjah','17th Street, Sharjah',NULL,'active','2026-03-10 12:50:33','2026-03-10 12:50:33',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(7,2,'7','FC Industries',40,'Finance','',NULL,'IndustriesFC@gmail.com','4395830','UAE','Abu Dhabi','Hamdan St',NULL,'active','2026-03-26 21:49:49','2026-05-02 19:16:20',NULL,'organization',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_invoice_items`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_invoice_items`
--

LOCK TABLES `tax_invoice_items` WRITE;
/*!40000 ALTER TABLE `tax_invoice_items` DISABLE KEYS */;
INSERT INTO `tax_invoice_items` VALUES
(1,1,2,'Data  Erasure',56.0100,70.00,3920.70,'piece',0,'2026-04-22 20:18:06','2026-04-22 20:18:06',NULL),
(2,1,3,'Chemical Disposal',10.0000,350.00,3500.00,'ton',1,'2026-04-22 20:18:06','2026-04-22 20:18:06',NULL),
(3,2,6,'Lights and Bulbs Recycling ',100.0000,20.00,2000.00,'piece',0,'2026-05-02 17:46:11','2026-05-02 17:46:11',NULL),
(4,3,6,'Lights and Bulbs Recycling ',78.0000,300.00,23400.00,'kg',0,'2026-05-02 17:54:58','2026-05-02 17:54:58',NULL),
(5,4,6,'Lights and Bulbs Recycling ',78.0000,300.00,23400.00,'kg',0,'2026-05-02 17:56:17','2026-05-02 17:56:17',NULL),
(6,5,5,'Food Disposal - onion',7.0000,200.00,1400.00,'ton',0,'2026-05-09 20:10:40','2026-05-09 20:10:40',NULL),
(7,6,5,'Food Disposal',6.0000,749.99,4499.94,'ton',0,'2026-05-19 17:59:24','2026-05-19 18:00:46',NULL),
(8,7,6,'Lights and Bulbs Recycling ',1.0000,400.00,400.00,'ton',0,'2026-05-22 11:51:01','2026-05-22 11:51:01',NULL);
/*!40000 ALTER TABLE `tax_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_invoices`
--

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ti_proforma` (`proforma_invoice_id`),
  UNIQUE KEY `uk_tenant_tax_number` (`tenant_id`,`tax_invoice_number`),
  KEY `idx_ti_tenant` (`tenant_id`),
  KEY `idx_ti_payment` (`payment_status`),
  KEY `fk_ti_user` (`created_by`),
  CONSTRAINT `fk_ti_proforma` FOREIGN KEY (`proforma_invoice_id`) REFERENCES `proforma_invoices` (`id`),
  CONSTRAINT `fk_ti_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`),
  CONSTRAINT `fk_ti_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_invoices`
--

LOCK TABLES `tax_invoices` WRITE;
/*!40000 ALTER TABLE `tax_invoices` DISABLE KEYS */;
INSERT INTO `tax_invoices` VALUES
(1,2,1,'TI-2026-00001','2026-04-22','2026-05-22','AED',7420.70,5.00,175.00,7595.70,5000.00,'partial','Bank transfer',NULL,NULL,'Payment 2026-04-30',2,'2026-04-22 20:18:06','2026-04-30 11:09:03',NULL),
(2,2,2,'TI-2026-00002','2026-05-02','2026-06-01','AED',2000.00,5.00,100.00,2100.00,2100.00,'paid','bank transfer',NULL,NULL,'Payment 2026-05-02\nPayment 2026-05-02',2,'2026-05-02 17:46:11','2026-05-02 17:47:28',NULL),
(3,2,3,'TI-2026-00003','2026-05-02','2026-06-01','AED',23400.00,5.00,1170.00,24570.00,NULL,'unpaid',NULL,NULL,NULL,NULL,2,'2026-05-02 17:54:58','2026-05-02 17:54:58',NULL),
(4,2,4,'TI-2026-00004','2026-05-02','2026-06-01','AED',23400.00,5.00,1170.00,24570.00,NULL,'unpaid',NULL,NULL,NULL,NULL,2,'2026-05-02 17:56:17','2026-05-02 17:56:17',NULL),
(5,2,5,'TI-2026-00005','2026-05-09','2026-06-08','AED',1400.00,5.00,70.00,1470.00,1470.00,'paid','Bank transfer',NULL,NULL,'Payment 2026-05-09',2,'2026-05-09 20:10:40','2026-05-09 20:11:20',NULL),
(6,2,6,'TI-2026-00006','2026-05-19','2026-06-18','AED',4499.94,5.00,225.00,4724.94,2000.00,'partial','Bank transfer',NULL,NULL,NULL,2,'2026-05-19 17:59:24','2026-05-19 18:00:46',NULL),
(7,2,7,'TI-2026-00007','2026-05-22','2026-06-21','AED',400.00,5.00,20.00,420.00,NULL,'unpaid','Cash','1231223','documents/8ba77700-eb6c-4e99-a584-7c7dc3b4eaaf.pdf',NULL,6,'2026-05-22 11:51:01','2026-05-22 11:51:01',NULL);
/*!40000 ALTER TABLE `tax_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

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
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES
(1,'Demo Company','Demo Company LLC','admin@demo.com','+971501234567',NULL,NULL,'UAE',NULL,NULL,NULL,NULL,'active','basic','2026-02-13 23:32:05',NULL,'{}','2026-02-13 23:32:05','2026-02-13 23:32:05',NULL),
(2,'ClearEarth ERP','Clear Earth Recycling LLC','admin@clearearth.com','9715235689','56th street ','Dubai','UAE','555','78963','12345',NULL,'active','basic',NULL,NULL,'{}','2026-02-22 11:34:40','2026-05-20 20:15:49',NULL);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terms_and_conditions`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terms_and_conditions`
--

LOCK TABLES `terms_and_conditions` WRITE;
/*!40000 ALTER TABLE `terms_and_conditions` DISABLE KEYS */;
INSERT INTO `terms_and_conditions` VALUES
(1,2,'Updated Standard Terms','These are the standard terms and conditions for all deals.','Standard',0,'active','2026-02-24 11:02:14','2026-03-10 12:58:20'),
(2,2,'Expiry Date','Expiry: 30 Days','Service',1,'active','2026-03-10 12:58:20','2026-03-10 12:58:20'),
(3,2,'This Transaction is subject to RCM.','Reverse Charge Mechanism','Tax',0,'active','2026-04-24 17:36:49','2026-05-09 16:54:50'),
(4,2,'Quotation is valid for 30 days.','Quotation','Service',0,'active','2026-04-24 18:46:04','2026-05-09 16:54:39'),
(5,2,'standard sales term','30 days service return','services',0,'active','2026-05-20 20:13:21','2026-05-20 20:13:21');
/*!40000 ALTER TABLE `terms_and_conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uae_cities`
--

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

--
-- Dumping data for table `uae_cities`
--

LOCK TABLES `uae_cities` WRITE;
/*!40000 ALTER TABLE `uae_cities` DISABLE KEYS */;
INSERT INTO `uae_cities` VALUES
(1,'Dubai','Dubai',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'Abu Dhabi','Abu Dhabi',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'Sharjah','Sharjah',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'Ajman','Ajman',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'Ras Al Khaimah','Ras Al Khaimah',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'Fujairah','Fujairah',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'Umm Al Quwain','Umm Al Quwain',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'Al Ain','Al Ain',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `uae_cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units_of_measure`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units_of_measure`
--

LOCK TABLES `units_of_measure` WRITE;
/*!40000 ALTER TABLE `units_of_measure` DISABLE KEYS */;
INSERT INTO `units_of_measure` VALUES
(1,'kg','Kilograms (kg)',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'ton','Tons (ton)',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'piece','Piece (pc)',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'hour','Hour (hr)',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'day','Day',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'month','Month',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(7,'unit','Unit',7,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(8,'service','Service',8,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
/*!40000 ALTER TABLE `units_of_measure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_tenant_id_email` (`tenant_id`,`email`),
  UNIQUE KEY `users_tenant_id_username` (`tenant_id`,`username`),
  KEY `users_tenant_id` (`tenant_id`),
  KEY `users_role_id` (`role_id`),
  KEY `users_status` (`status`),
  KEY `users_employee_id` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,1,1,NULL,'admin','admin@demo.com','$2a$10$sMg04Eri.xz1jIy4bEDEBuNeuJ1wiiS0y.4S13G8/6mREOt730LUy','Admin','User','+971501234567',NULL,'active','2026-02-14 00:53:38',NULL,NULL,NULL,'2026-02-13 23:32:05',0,NULL,'2026-02-13 23:32:05','2026-02-14 00:53:38',NULL),
(2,2,1,NULL,'admin','admin@clearearth.com','$2a$10$K1YXsNV2FDONsiwY2REA4OL1PyWXUDueNi2RB1YCXc8Nqb4n.fqza','Admin','User',NULL,NULL,'active','2026-05-25 15:29:26',NULL,NULL,NULL,NULL,0,NULL,'2026-02-22 11:34:41','2026-05-25 15:29:26',NULL),
(3,1,3,NULL,'superadmin','superadmin@clearearth.com','$2a$10$3hgq//t3NIMkjVIoiFBYJuUyfjIQkGkeEhN2nSEJFnPaPNekUCzhe','Super','Admin',NULL,NULL,'active',NULL,NULL,NULL,NULL,'2026-03-04 20:19:15',0,NULL,'2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(4,2,5,NULL,'salesmanager','salesmanager@clearearth.com','$2a$10$Aq8TbgG..1qhl1mTjZZbkOMQ7nRmApABF6hkJyrJudx9iVFSYnIL6','Sales','Manager',NULL,NULL,'active','2026-05-25 14:31:09',NULL,NULL,NULL,'2026-03-04 20:27:59',0,NULL,'2026-03-04 20:27:59','2026-05-25 14:31:09',NULL),
(5,2,4,NULL,'inspection','inspection@clearearth.com','$2a$10$hrhsIm7mfQ9Pz8CODQ5HOOMGrqbb9C/rUdUHA3HGxbH2jGlpOKWYy','Inspection','User',NULL,NULL,'active','2026-05-25 16:37:35',NULL,NULL,NULL,'2026-03-04 20:27:59',0,NULL,'2026-03-04 20:27:59','2026-05-25 16:37:35',NULL),
(6,2,6,NULL,'sales','sales@clearearth.com','$2a$10$DTuV.c.ai6l2Sm8Qlx7QNukfkWx/RoXX2MMsespUMsnb3w/xFfqk2','Sales','Representative',NULL,NULL,'active','2026-05-25 16:51:48',NULL,NULL,NULL,'2026-03-04 20:27:59',0,NULL,'2026-03-04 20:27:59','2026-05-25 16:51:48',NULL),
(7,2,4,NULL,'newinspection','newinspection@gmail.com','$2a$10$GdA3XE/cTqU42fdDqbbMLeNELD/snvcGGSBIISkQYikzHRVpWkDZm','jameel','saleem','1234567890',NULL,'active','2026-03-08 14:54:16',NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 14:53:53','2026-03-08 15:51:52','2026-03-08 15:51:52'),
(8,2,6,NULL,'sales2','sales2@gmail.com','$2a$10$aRld1JOmKjCAxC2F8ndRpuvbL1/HzT80xB0wUFznMpBVFuSUx61pO','sales2','sales',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 15:36:20','2026-03-08 15:51:44','2026-03-08 15:51:44'),
(10,2,6,NULL,'sales3','sales3@gmail.com','$2a$10$0pvEO2Zpj77Igq5zUCVT7OeDwGhe62bNIHGDloo1MkTACYi0thYRC','sales','3',NULL,NULL,'active','2026-03-08 15:58:49',NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 15:53:11','2026-03-08 15:58:49',NULL),
(11,2,4,NULL,'inspection3','inspection3@gmail.com','$2a$10$3dHV3dypUiXJHbqT8hwPs.aGdyzTFewFgKN5DETj6t.xeZ1a8mHta','inspection','3',NULL,NULL,'active','2026-03-08 16:23:49',NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 15:53:41','2026-03-08 16:23:49',NULL),
(12,2,2,NULL,'test','test@gmail.com','$2a$10$y8CZbuGkx5r5agRxFo2Hguc8WogpNuIqhiIb/1VFSQll3hWX4jETq','Alisha','Sk',NULL,NULL,'suspended',NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-03-19 13:33:16','2026-03-19 13:33:45',NULL),
(13,2,8,NULL,'accountant','accountant@clearearth.com','$2a$10$WASHrvIY30Jp9DewFFFwMeVMCmsIPnvw1xtZ42CsbMvY7HjqaYZce','Accountant','1',NULL,NULL,'active','2026-05-25 18:14:34',NULL,NULL,NULL,NULL,0,NULL,'2026-05-19 14:12:31','2026-05-25 18:14:34',NULL),
(14,2,7,NULL,'operations','operations@gmail.com','$2a$10$lm61MT6IUBGt4W8J0IjcyeMkFds3i9KvvRoZdzs2tRwJHADkvOvo2','Operations','Manager',NULL,NULL,'active','2026-05-25 17:48:22',NULL,NULL,NULL,NULL,0,NULL,'2026-05-19 14:25:48','2026-05-25 17:48:22',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_order_task_expenses`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_order_task_expenses`
--

LOCK TABLES `work_order_task_expenses` WRITE;
/*!40000 ALTER TABLE `work_order_task_expenses` DISABLE KEYS */;
INSERT INTO `work_order_task_expenses` VALUES
(6,6,'fork lifting',150.00,0,'2026-04-11 12:30:25','2026-04-24 15:51:10','approved','2026-04-24 15:51:10',2,NULL,NULL,NULL,NULL,NULL),
(7,6,'labour charges',70.00,1,'2026-04-11 12:30:25','2026-04-24 15:51:13','approved','2026-04-24 15:51:13',2,NULL,NULL,NULL,NULL,NULL),
(8,7,NULL,500.00,0,'2026-04-11 12:30:25','2026-04-24 15:51:16','approved','2026-04-24 15:51:16',2,NULL,NULL,NULL,NULL,NULL),
(9,8,NULL,300.00,0,'2026-04-11 12:30:25','2026-04-24 15:51:19','approved','2026-04-24 15:51:19',2,NULL,NULL,NULL,NULL,NULL),
(13,12,'fork lifting',100.00,0,'2026-04-25 11:58:27','2026-04-25 12:00:15','approved','2026-04-25 12:00:15',2,NULL,NULL,NULL,NULL,NULL),
(14,12,'labor charges',75.00,1,'2026-04-25 11:58:27','2026-04-25 12:00:21','approved','2026-04-25 12:00:21',2,NULL,NULL,NULL,NULL,NULL),
(15,13,'labor and tools',300.00,0,'2026-04-25 11:58:27','2026-05-02 18:01:46','approved','2026-05-02 18:01:46',2,NULL,NULL,NULL,NULL,NULL),
(16,15,'labor charges',100.00,0,'2026-04-25 12:18:51','2026-04-25 12:19:48','approved','2026-04-25 12:19:48',2,NULL,NULL,NULL,NULL,NULL),
(17,15,'fork lifting',200.00,1,'2026-04-25 12:18:51','2026-04-25 12:24:00','approved','2026-04-25 12:24:00',2,NULL,NULL,NULL,NULL,NULL),
(18,16,'labor charges',100.00,0,'2026-04-25 12:18:51','2026-04-25 12:19:56','rejected',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(24,35,'Fuel expense',100.00,0,'2026-05-09 19:57:50','2026-05-19 17:26:06','approved','2026-05-19 17:26:06',13,NULL,NULL,NULL,NULL,NULL),
(25,35,'labour',200.00,1,'2026-05-09 19:57:50','2026-05-19 17:50:48','approved','2026-05-19 17:50:48',13,NULL,NULL,NULL,NULL,NULL),
(26,35,'fork lifting',149.99,2,'2026-05-09 19:57:50','2026-05-09 20:12:23','approved','2026-05-09 20:12:23',2,NULL,NULL,NULL,NULL,NULL),
(27,37,'Shredding',1000.00,0,'2026-05-09 19:57:50','2026-05-09 19:57:50','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(28,40,'scrap metal',500.00,0,'2026-05-20 20:12:01','2026-05-20 20:12:01','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(29,43,'Labour',80.00,0,'2026-05-25 12:56:02','2026-05-25 12:56:02','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(30,43,'Fuel',139.99,1,'2026-05-25 12:56:02','2026-05-25 12:56:02','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(31,44,'Fork lifting',120.00,0,'2026-05-25 12:56:02','2026-05-25 12:56:02','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(32,44,'labour charges',60.00,1,'2026-05-25 12:56:02','2026-05-25 12:56:02','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(33,45,'machinery',100.00,0,'2026-05-25 15:23:30','2026-05-25 15:23:30','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(34,45,'transportation',59.99,1,'2026-05-25 15:23:30','2026-05-25 15:23:30','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(35,46,'vehilce',80.00,0,'2026-05-25 15:23:30','2026-05-25 15:23:30','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(36,46,'fork lifting',80.00,1,'2026-05-25 15:23:30','2026-05-25 15:23:30','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(37,46,'labour',80.00,2,'2026-05-25 15:23:30','2026-05-25 15:23:30','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(48,52,'machinery',100.00,0,'2026-05-25 17:52:50','2026-05-25 17:52:50','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(49,52,'transportation',59.99,1,'2026-05-25 17:52:50','2026-05-25 17:52:50','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(50,53,'vehilce',80.00,0,'2026-05-25 17:52:50','2026-05-25 17:52:50','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(51,53,'fork lifting',80.00,1,'2026-05-25 17:52:50','2026-05-25 17:52:50','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(52,53,'labour',80.00,2,'2026-05-25 17:52:50','2026-05-25 17:52:50','pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
(53,54,NULL,2199.99,0,'2026-05-25 17:52:50','2026-05-25 17:54:20','approved','2026-05-25 17:54:20',13,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `work_order_task_expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_order_tasks`
--

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
  PRIMARY KEY (`id`),
  KEY `idx_work_order_tasks_wo` (`work_order_id`),
  KEY `idx_work_order_tasks_assigned` (`assigned_to`),
  KEY `idx_work_order_tasks_work_type` (`work_type_id`),
  CONSTRAINT `fk_work_order_tasks_work_type` FOREIGN KEY (`work_type_id`) REFERENCES `work_types` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_order_tasks`
--

LOCK TABLES `work_order_tasks` WRITE;
/*!40000 ALTER TABLE `work_order_tasks` DISABLE KEYS */;
INSERT INTO `work_order_tasks` VALUES
(6,1,'Pickup',220.00,'5 hours','2026-04-03','2026-04-03',12,'completed',NULL,'2026-04-11 12:30:25','2026-04-24 15:50:50',1,NULL),
(7,1,'Destruction of material',500.00,'2 days','2026-04-05','2026-04-07',12,'completed',NULL,'2026-04-11 12:30:25','2026-04-24 15:51:40',3,NULL),
(8,1,'Delivery',300.00,'8 hours','2026-04-06','2026-04-06',12,'completed',NULL,'2026-04-11 12:30:25','2026-04-30 13:26:15',2,NULL),
(12,3,'Pickup',175.00,NULL,NULL,NULL,NULL,'completed',NULL,'2026-04-25 11:58:27','2026-04-25 12:01:00',1,NULL),
(13,3,'Destruction of material',300.00,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-04-25 11:58:27','2026-04-25 11:58:27',3,NULL),
(14,3,'Delivery',NULL,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-04-25 11:58:27','2026-04-25 11:58:27',2,NULL),
(15,4,'Pickup',300.00,'3 hours',NULL,NULL,NULL,'completed',NULL,'2026-04-25 12:18:51','2026-05-04 16:38:24',1,NULL),
(16,4,'Destruction of material',100.00,NULL,NULL,NULL,NULL,'in_progress','Exception Approved by CEO','2026-04-25 12:18:51','2026-05-04 16:38:52',3,NULL),
(17,4,'Delivery',NULL,NULL,NULL,NULL,NULL,'in_progress',NULL,'2026-04-25 12:18:52','2026-05-04 16:38:55',2,NULL),
(20,5,'Pickup',NULL,NULL,NULL,NULL,NULL,'completed',NULL,'2026-05-02 17:53:52','2026-05-02 17:53:58',1,NULL),
(21,5,'Delivery',NULL,NULL,NULL,NULL,NULL,'completed',NULL,'2026-05-02 17:53:52','2026-05-02 17:54:01',2,NULL),
(24,6,'Delivery',NULL,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-02 19:17:17','2026-05-02 19:17:17',2,NULL),
(25,6,'Pickup',NULL,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-02 19:17:17','2026-05-02 19:17:17',1,NULL),
(35,7,'Pickup',449.99,'2 hours','2026-05-09','2026-05-09',NULL,'completed',NULL,'2026-05-09 19:57:50','2026-05-09 19:57:50',1,NULL),
(36,7,'Municipality Inspection',NULL,NULL,NULL,NULL,NULL,'completed',NULL,'2026-05-09 19:57:50','2026-05-09 19:57:50',4,NULL),
(37,7,'Destruction of material',1000.00,'5 hours','2026-05-09','2026-05-09',12,'completed',NULL,'2026-05-09 19:57:50','2026-05-09 19:58:09',3,NULL),
(38,8,'Delivery',NULL,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-20 20:12:01','2026-05-20 20:12:01',2,NULL),
(39,8,'Pickup',NULL,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-20 20:12:01','2026-05-20 20:12:01',1,NULL),
(40,8,'Pickup',500.00,'1 hours','2026-05-22','2026-05-23',2,'not_started','plm','2026-05-20 20:12:01','2026-05-20 20:12:01',1,NULL),
(41,9,'Delivery',NULL,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-22 09:50:55','2026-05-22 09:50:55',2,NULL),
(42,9,'Pickup',NULL,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-22 09:50:55','2026-05-22 09:50:55',1,NULL),
(43,10,'Delivery',219.99,'4 hours','2026-05-25','2026-05-27',13,'not_started',NULL,'2026-05-25 12:56:02','2026-05-25 12:56:02',2,NULL),
(44,10,'Pickup',180.00,'4 hours','2026-05-24','2026-05-24',13,'not_started',NULL,'2026-05-25 12:56:02','2026-05-25 12:56:02',1,NULL),
(45,11,'Destruction of material',159.99,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-25 15:23:30','2026-05-25 15:23:30',3,NULL),
(46,11,'Pickup',240.00,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-25 15:23:30','2026-05-25 15:23:30',1,NULL),
(52,12,'Destruction of material',159.99,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-25 17:52:50','2026-05-25 17:52:50',3,NULL),
(53,12,'Pickup',240.00,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-25 17:52:50','2026-05-25 17:52:50',1,NULL),
(54,12,'Dumber Truck Expense',2199.99,NULL,NULL,NULL,NULL,'not_started',NULL,'2026-05-25 17:52:50','2026-05-25 17:52:50',5,NULL);
/*!40000 ALTER TABLE `work_order_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_orders`
--

DROP TABLE IF EXISTS `work_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_orders`
--

LOCK TABLES `work_orders` WRITE;
/*!40000 ALTER TABLE `work_orders` DISABLE KEYS */;
INSERT INTO `work_orders` VALUES
(1,2,2,'sample work order',NULL,'draft',2,'2026-04-03 18:51:58','2026-04-03 18:51:58',NULL),
(2,2,2,NULL,NULL,'draft',2,'2026-04-09 11:42:23','2026-04-09 12:02:50','2026-04-09 12:02:50'),
(3,2,11,NULL,NULL,'draft',2,'2026-04-25 11:58:10','2026-04-25 11:58:10',NULL),
(4,2,11,'Work order new',NULL,'draft',2,'2026-04-25 12:18:51','2026-04-25 12:18:51',NULL),
(5,2,19,NULL,NULL,'draft',2,'2026-05-02 17:53:21','2026-05-02 17:53:21',NULL),
(6,2,19,'Test 1','Test','completed',2,'2026-05-02 19:17:07','2026-05-02 19:17:17',NULL),
(7,2,20,'Food Disposal - onion',NULL,'in_progress',2,'2026-05-09 19:36:14','2026-05-09 19:50:22',NULL),
(8,2,21,'manager','dfg','in_progress',4,'2026-05-20 20:12:01','2026-05-20 20:12:01',NULL),
(9,2,26,'Lights & Bulbs Recycling',NULL,'in_progress',6,'2026-05-22 09:50:55','2026-05-22 09:50:55',NULL),
(10,2,26,NULL,NULL,'draft',6,'2026-05-25 12:56:02','2026-05-25 12:56:02',NULL),
(11,2,28,NULL,NULL,'draft',6,'2026-05-25 15:23:30','2026-05-25 15:23:30',NULL),
(12,2,28,NULL,NULL,'draft',6,'2026-05-25 15:23:36','2026-05-25 15:23:36',NULL);
/*!40000 ALTER TABLE `work_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_types`
--

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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_types`
--

LOCK TABLES `work_types` WRITE;
/*!40000 ALTER TABLE `work_types` DISABLE KEYS */;
INSERT INTO `work_types` VALUES
(1,2,'Pickup',0,1,'2026-04-03 18:47:45','2026-04-09 11:41:10',1),
(2,2,'Delivery',0,1,'2026-04-03 18:47:51','2026-04-09 11:41:14',1),
(3,2,'Destruction of material',0,1,'2026-04-03 18:48:16','2026-04-03 18:48:16',0),
(4,2,'Municipality Inspection',1,1,'2026-04-22 20:04:44','2026-04-22 20:04:57',0),
(5,2,'Dumber Truck Expense',0,1,'2026-05-25 17:38:44','2026-05-25 17:38:44',1);
/*!40000 ALTER TABLE `work_types` ENABLE KEYS */;
UNLOCK TABLES;

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

-- Dump completed on 2026-05-27 11:20:56
