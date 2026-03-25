/*M!999999\- enable the sandbox mode */ 
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
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES
(1,2,'COM-MLY4IEZS-89D5EC25','Knapp Oneill Trading',NULL,NULL,'https://www.fywirip.tv',NULL,'wyfewivyt@mailinator.com','+1 (324) 369-5819','Placeat doloremque ','Ducimus ut saepe ci','Obcaecati vel incidi',NULL,'active','2026-02-22 23:11:06','2026-02-22 23:11:06',NULL,'organization',NULL,NULL),
(2,2,'COM-MLY4KU7W-4BC889FD','Harding Small Co',1,'Technology','https://www.marycicy.org.au',NULL,'tysyfudi@mailinator.com','+1 (141) 105-2988','Aliquam voluptates s','Est expedita est ni','Proident aspernatur','Officia obcaecati ut','active','2026-02-22 23:12:59','2026-02-22 23:13:31',NULL,'organization',NULL,NULL),
(3,2,'COM-MM0II4OC-5776C8EB','Morin Goodwin LLC',4,NULL,'https://www.hij.ws',NULL,'gipege@mailinator.com','+1 (399) 495-9256','UAE',NULL,'Rerum facere fugit ',NULL,'active','2026-02-24 15:18:20','2026-02-24 15:18:28',NULL,'organization',NULL,NULL),
(4,2,'COM-MM4PLRQX-356F9BFE','Test company',5,NULL,NULL,NULL,NULL,'0562933733','UAE',NULL,NULL,NULL,'active','2026-02-27 13:48:12','2026-02-27 13:48:19',NULL,'organization',NULL,NULL),
(5,2,'COM-MMBSHDRW-5072707A','ADONC',6,'Finance','',NULL,'adonc.uae@gmail.com','098987987','UAE','Abu Dhabi','mussafah','','active','2026-03-04 12:43:09','2026-03-05 09:44:30','2026-03-05 09:44:30','organization',NULL,NULL),
(6,2,'COM-MMD1MSSA-7FE17BEE','Codegnan pvt',8,'Education','',NULL,'codegnan@destinations.com','987987987','UAE','Abu Dhabi','Al mirfa','','active','2026-03-05 09:47:05','2026-03-05 14:29:39','2026-03-05 14:29:39','individual',NULL,NULL),
(7,2,'COM-MMD2E06H-DB3593D5','TSC',9,'Technology','',NULL,'TSCgroups@gmail.com','567567567','UAE','Ajman','ajman','','active','2026-03-05 10:08:14','2026-03-05 14:29:33','2026-03-05 14:29:33','organization',NULL,NULL),
(8,2,'COM-MMD84H02-380C4664','Al Sama',12,'Construction',NULL,NULL,'alsama@gmail.com','87878787','UAE','Dubai','international city',NULL,'active','2026-03-05 12:48:47','2026-03-05 14:29:27','2026-03-05 14:29:27','organization',6,NULL),
(9,2,'COM-MMD9HPAT-D3093BE1','Chavez Mckenzie Inc',13,NULL,'https://www.tuvoha.com',NULL,'hotorery@mailinator.com',NULL,'UAE','Dubai','Eveniet expedita do',NULL,'active','2026-03-05 13:27:04','2026-03-05 14:29:18','2026-03-05 14:29:18','organization',NULL,NULL),
(10,2,'COM-MMD9LP26-2EBE52A0','testabc',15,'Technology',NULL,NULL,NULL,'1234567890','UAE','Dubai','abcd',NULL,'active','2026-03-05 13:30:10','2026-03-05 13:30:32',NULL,'organization',6,NULL),
(11,2,'COM-MMDBSGJG-6F24E37E','Codegnan',16,'Education','',NULL,'codegnan@destinations.com','4504504500','UAE','Umm Al Quwain','al quwain','','active','2026-03-05 14:31:25','2026-03-06 09:46:00','2026-03-06 09:46:00','organization',NULL,NULL),
(12,2,'COM-MMDBZ21K-3C402301','TSC',17,'Technology','',NULL,'tscgroups@gmail.com','769088709','UAE','Abu Dhabi','mirfa','','active','2026-03-05 14:36:33','2026-03-06 09:46:06','2026-03-06 09:46:06','organization',NULL,NULL),
(13,2,'COM-MMDD7QXS-B6A0E2F6','al sama',18,'Construction',NULL,NULL,'alsama@gmail.com','8211231313123','UAE','Dubai','Inter City',NULL,'active','2026-03-05 15:11:18','2026-03-06 09:46:12','2026-03-06 09:46:12','organization',NULL,NULL),
(14,2,'COM-MMDDDO7H-E531640E','Prasad N',19,NULL,NULL,NULL,'prasadn@gmail.com',NULL,'UAE','Dubai','morocco',NULL,'active','2026-03-05 15:15:54','2026-03-06 09:46:18','2026-03-06 09:46:18','individual',NULL,NULL),
(15,2,'COM-MMEH52MQ-77A9AC50','TSC',20,'Technology',NULL,NULL,'tscgroups@gmail.com','878769675','UAE','Dubai','madhapur',NULL,'active','2026-03-06 09:48:58','2026-03-06 18:49:55','2026-03-06 18:49:55','organization',NULL,NULL),
(16,2,'COM-MMEH8BAH-FE264503','Codegnan',21,'','',NULL,'codegnan@destinations.com','87687676','UAE','Abu Dhabi','03','','active','2026-03-06 09:51:29','2026-03-06 18:50:07','2026-03-06 18:50:07','organization',NULL,NULL),
(17,2,'COM-MMF0XO0N-83C36A3C','TCS',22,'Technology','',NULL,'tcsgroups@gmail.com','948504275','UAE','Dubai','Madhapur','','active','2026-03-06 19:03:04','2026-03-06 19:05:19',NULL,'organization',NULL,NULL),
(18,2,'COM-MMF16QK6-8A786443','Codegnan Destinations',23,NULL,NULL,NULL,'codegnan@destinations.com','875962750375','UAE','Dubai','kphb',NULL,'active','2026-03-06 19:10:08','2026-03-06 19:10:08',NULL,'organization',NULL,NULL),
(19,2,'COM-MMFAXOX1-920BF079','test company',25,'Technology',NULL,NULL,'abdulkareemmain@gmail.com','0562933739','UAE','Dubai','Jumeirah Lake Towers',NULL,'active','2026-03-06 23:43:02','2026-03-06 23:49:29',NULL,'organization',NULL,NULL),
(20,2,'COM-MMHMLQJ8-D92941FC','checking',27,NULL,NULL,NULL,'abc@abc.com',NULL,'UAE',NULL,NULL,NULL,'active','2026-03-08 14:45:12','2026-03-08 14:46:08',NULL,'organization',NULL,NULL),
(21,2,'COM-MMHP9C7T-4134A44D','new company',28,'Technology',NULL,NULL,'new@gmail.com','1234567890','UAE','Dubai','asdfghjkl',NULL,'active','2026-03-08 15:59:32','2026-03-08 16:00:12',NULL,'organization',10,NULL),
(22,2,'COM-MMI1VCOI-BCB9DD15','Aramco',29,'Energy',NULL,NULL,'aramcooils@gmail.com','8748974534','UAE','Umm Al Quwain','umm al quwain',NULL,'active','2026-03-08 21:52:35','2026-03-08 21:52:44',NULL,'organization',NULL,NULL),
(23,2,'COM-MMI21690-640606B8','PSL',30,NULL,NULL,NULL,'PSL@gmail.com','99999988','UAE','Dubai','nyc',NULL,'active','2026-03-08 21:57:06','2026-03-08 21:57:06',NULL,'organization',NULL,NULL),
(24,2,'COM-MMI2773V-B19920AE','Pfizer',31,'Hospitality',NULL,NULL,'Pfizer@gmail.com','732469234','UAE','Abu Dhabi','mussafah',NULL,'active','2026-03-08 22:01:47','2026-03-08 22:01:47',NULL,'organization',NULL,NULL),
(25,2,'COM-MMIY39G3-C14525C9','Al Sama',32,'Construction',NULL,NULL,'Alsama@gmail.com','3475834579','UAE','Dubai','International city',NULL,'active','2026-03-09 12:54:31','2026-03-09 12:54:38',NULL,'individual',NULL,NULL),
(26,2,'COM-MMIYQ6AF-DEDA7DA9','AS Gates& Barriers',33,'Construction',NULL,NULL,'asgb@gmail.com','45353453','UAE','Dubai','Morocco city',NULL,'active','2026-03-09 13:12:20','2026-03-09 13:12:23',NULL,'individual',NULL,NULL),
(27,2,'COM-MMJ19X4V-F864290B','SHOBA',34,'Construction',NULL,NULL,'shobagroups@gmail.com','3425545','UAE','Dubai','Dubai',NULL,'active','2026-03-09 14:23:41','2026-03-09 14:23:56',NULL,'organization',NULL,NULL),
(28,2,'COM-MMJ1BOIY-1C44D733','test vendor123',NULL,'Manufacturing',NULL,NULL,NULL,'6456465456','UAE','Dubai','asdfghjk',NULL,'active','2026-03-09 14:25:03','2026-03-09 14:25:03',NULL,'organization',NULL,'55555555'),
(29,2,'COM-MMX8JQP9-1109D720','Test 1',38,'','',NULL,'alisha011@gmail.com','','UAE','Dubai','Dubai','','active','2026-03-19 12:56:03','2026-03-19 12:59:50','2026-03-19 12:59:50','organization',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(44,29,38,NULL,1,'2026-03-19 12:58:04','2026-03-19 12:58:04','2026-03-19 12:59:50');
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
INSERT INTO `contacts` VALUES
(1,2,'CON-MLY4IN2O-FBD838BC','Elizabeth','Contreras','wopy@mailinator.com','+1 (883) 267-9465','Voluptas aut eiusmod',NULL,'Nostrum dicta magni ','Magni exercitation e','active',NULL,'2026-02-22 23:11:17','2026-02-22 23:11:17',NULL,'Dolor in voluptatem ',1,NULL,NULL,NULL),
(2,2,'CON-MLY7ZI65-89CD6904','Bethany','French','raqexoqyr@mailinator.com','+1 (204) 445-4255','Vel temporibus natus',NULL,'Consectetur odit lib','Dolores voluptas asp','active',NULL,'2026-02-23 00:48:22','2026-02-23 00:48:22',NULL,NULL,2,NULL,NULL,NULL),
(3,2,'CON-MLYAZWIE-0044E9FD','saleem','javed',NULL,'12345678',NULL,NULL,NULL,NULL,'active',NULL,'2026-02-23 02:12:40','2026-02-23 02:12:40',NULL,'Managing Director',2,NULL,NULL,NULL),
(4,2,'CON-MM0IIB5W-FBD8A07A','Karyn','Campos','kavysy@mailinator.com','+1 (244) 761-6436','Hic numquam et ipsa',NULL,'Praesentium quas vol','Non laboris itaque p','active',NULL,'2026-02-24 15:18:28','2026-02-24 15:18:28',NULL,NULL,3,NULL,NULL,NULL),
(5,2,'CON-MM4PLWXP-3412D379','Test User','Testing','abdulkareemmain@gmail.com','0562933739','','','','','active','clients','2026-02-27 13:48:19','2026-03-19 12:52:57',NULL,'',4,NULL,NULL,NULL),
(6,2,'CON-MMBSHNVU-2E1E180E','Saleem','bakhtal',NULL,'123123123',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-04 12:43:22','2026-03-04 12:46:57',NULL,'Manager',5,NULL,NULL,NULL),
(7,2,'CON-MMBSRVJC-76274F85','code','gnan','codegnan@gmail.com','123123123',NULL,NULL,'sales',NULL,'active',NULL,'2026-03-04 12:51:19','2026-03-05 09:44:10','2026-03-05 09:44:10',NULL,NULL,NULL,NULL,NULL),
(8,2,'CON-MMD1N33K-F20CBCD0','Saketh','G','codegnan@destinations.com','123123123','','','','','active','clients','2026-03-05 09:47:18','2026-03-05 09:48:17',NULL,'Director',6,NULL,NULL,NULL),
(9,2,'CON-MMD1TBU4-3032777E','Krithi','Vasan','kvasan@gmail.com','23123123','','','IT','','active','vendors','2026-03-05 09:52:09','2026-03-05 11:05:45',NULL,'Manager',7,NULL,NULL,NULL),
(10,2,'CON-MMD2USEJ-FF3BDD78','alex','williams','awiiliams@gmail.com','765765765',NULL,NULL,'LAW',NULL,'active',NULL,'2026-03-05 10:21:17','2026-03-05 10:21:17',NULL,'Assistant Manager',NULL,NULL,NULL,NULL),
(11,2,'CON-MMD2WY1O-959E3A4D','hv','spec','hv@gmail.com','765765765',NULL,NULL,'Consultancy',NULL,'active',NULL,'2026-03-05 10:22:58','2026-03-05 10:22:58',NULL,'Consultant',NULL,NULL,NULL,NULL),
(12,2,'CON-MMD84K3G-45908BDD','Shiva','P',NULL,'654654654',NULL,NULL,NULL,NULL,'active','clients','2026-03-05 12:48:51','2026-03-05 12:48:51',NULL,'Managing Director',8,NULL,NULL,NULL),
(13,2,'CON-MMD86ACJ-2EB95950','Prasad','N',NULL,'7373737373',NULL,NULL,NULL,NULL,'active','vendors','2026-03-05 12:50:12','2026-03-05 13:27:04',NULL,'Engineer',9,NULL,NULL,NULL),
(14,2,'CON-MMD9GR46-D5632DE5','Imani',NULL,'sesy@mailinator.com','+1 (291) 838-5536',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-05 13:26:19','2026-03-05 13:26:19',NULL,NULL,6,NULL,NULL,NULL),
(15,2,'CON-MMD9M6C2-723BF392','jameel','lateef','abc@abc.com','1234567890',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-05 13:30:32','2026-03-05 13:30:32',NULL,'Managing Director',10,NULL,6,NULL),
(16,2,'CON-MMDBSLPK-F5A21C67','Saketh','','sakethgnan@gmail.com','098098090','','','','','active','clients','2026-03-05 14:31:32','2026-03-06 09:47:06','2026-03-06 09:47:06','Managing Director',11,NULL,NULL,NULL),
(17,2,'CON-MMDC15JZ-3D49E426','Kriti','sanon','kriti321@gmail.com','37462384683','','','tech','','active','clients','2026-03-05 14:38:11','2026-03-06 09:47:00','2026-03-06 09:47:00','Team Leader',12,NULL,NULL,NULL),
(18,2,'CON-MMDD83TQ-CD0A1F3D','Siva','P','sivap@gmail.com','8768768667',NULL,NULL,NULL,NULL,'active','vendors','2026-03-05 15:11:35','2026-03-06 09:46:54','2026-03-06 09:46:54','Managing Director',13,NULL,NULL,NULL),
(19,2,'CON-MMDDCWYO-38CF4939','Prasad N','','prasadn@gmail.com','65757899879','','','','','active','vendors','2026-03-05 15:15:19','2026-03-06 09:46:47','2026-03-06 09:46:47','Engineer',14,NULL,NULL,NULL),
(20,2,'CON-MMEH590Y-2C0C91D4','Krithi','vasan','krithi@gmail.com','765675765','','','','','active','clients','2026-03-06 09:49:06','2026-03-06 18:51:13','2026-03-06 18:51:13','CEO',15,NULL,NULL,NULL),
(21,2,'CON-MMEH81X6-CF681058','Saketh',NULL,'saketh@gmail.com','908964334',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-06 09:51:17','2026-03-06 18:50:45','2026-03-06 18:50:45','CEO',16,NULL,NULL,NULL),
(22,2,'CON-MMF0Y30D-71070AFD','Kriti','vasan','krithitcs@gmail.com','7365745032','','','','','active','vendors','2026-03-06 19:03:24','2026-03-06 19:06:32',NULL,'CEO',17,NULL,NULL,NULL),
(23,2,'CON-MMF15XI1-F5070AEE','Saketh','','sakethg@gmail.com','47349625','','','','','active','clients','2026-03-06 19:09:30','2026-03-06 19:10:47',NULL,'CEO',18,NULL,NULL,NULL),
(24,2,'CON-MMFAU5EX-38946DE6','Eaton','Pierce','fosojacyfy@mailinator.com','1234567890',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-06 23:40:17','2026-03-06 23:40:17',NULL,NULL,18,NULL,NULL,NULL),
(25,2,'CON-MMFB5ZNQ-E3342549','Susan',NULL,'qonu@mailinator.com','5666789',NULL,NULL,NULL,NULL,'active','clients','2026-03-06 23:49:29','2026-03-06 23:49:29',NULL,'Director',19,NULL,NULL,NULL),
(26,2,'CON-MMFB75FS-84EC1424','Galvin',NULL,'jysaz@mailinator.com','+1 (523) 667-7327',NULL,NULL,'Commodo soluta venia',NULL,'active',NULL,'2026-03-06 23:50:23','2026-03-06 23:50:23',NULL,NULL,NULL,NULL,NULL,NULL),
(27,2,'CON-MMHMMYAW-F87EBCA2','test contact',NULL,'abdulkareemmain1@gmail.com','0562933739',NULL,NULL,NULL,NULL,'active','vendors','2026-03-08 14:46:08','2026-03-08 14:46:08',NULL,'CEO',20,NULL,NULL,NULL),
(28,2,'CON-MMHPA72B-D88B251B','checking','abc','a5@gmail.com','234567890',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-08 16:00:12','2026-03-08 16:00:12',NULL,'Manager',21,NULL,10,NULL),
(29,2,'CON-MMI1VK74-1A58CD13','John','Greesham','john@gmail.com','579853433','','','','','active','vendors','2026-03-08 21:52:44','2026-03-08 21:52:58',NULL,'Executive',22,NULL,NULL,NULL),
(30,2,'CON-MMI20V9H-2C9B53DA','Harvey ','Specter','harveys@gmail.com','31243243213','','','','','active','clients','2026-03-08 21:56:52','2026-03-08 21:57:37',NULL,'Director',23,NULL,NULL,NULL),
(31,2,'CON-MMI26VBY-D5F834E3','Tony','G','tony@gmail.com','73497342234',NULL,NULL,NULL,NULL,'active',NULL,'2026-03-08 22:01:32','2026-03-08 22:01:47',NULL,'CEO',24,NULL,NULL,NULL),
(32,2,'CON-MMIY3EB4-E22DDB82','Prasad N',NULL,NULL,'657657658',NULL,NULL,NULL,NULL,'active','vendors','2026-03-09 12:54:38','2026-03-09 12:54:38',NULL,'Executive',25,NULL,NULL,NULL),
(33,2,'CON-MMIYQ852-BF80D457','Ponnada','Shankar','pshankar@gmail.com','58340958345','','','','','active','vendors','2026-03-09 13:12:23','2026-03-09 14:06:28',NULL,'Managing Director',26,NULL,NULL,NULL),
(34,2,NULL,'Naidu ','G','naidugm@gmail.com','487328947',NULL,NULL,NULL,NULL,'active','vendors','2026-03-09 14:23:56','2026-03-09 14:23:56',NULL,'General Manager',27,NULL,NULL,NULL),
(35,2,NULL,'Silvaraj','Jain','silva@evogreen.com','0545335333',NULL,NULL,NULL,NULL,'active','vendors','2026-03-10 12:48:46','2026-03-10 12:50:33',NULL,'Manager',NULL,NULL,NULL,6),
(36,2,NULL,'Alisha','sk',NULL,'98765434567',NULL,NULL,NULL,NULL,'active','clients','2026-03-19 12:55:41','2026-03-19 12:57:17',NULL,'Manager',NULL,NULL,NULL,NULL),
(37,2,NULL,'Alisha','sk',NULL,'y6ttui98765678i',NULL,NULL,NULL,NULL,'active','clients','2026-03-19 12:56:42','2026-03-19 12:56:42',NULL,'Manager',NULL,NULL,NULL,NULL),
(38,2,NULL,'Alisha','sk',NULL,'12345678tf',NULL,NULL,NULL,NULL,'active','clients','2026-03-19 12:57:10','2026-03-19 12:58:03',NULL,NULL,29,NULL,NULL,NULL);
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
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_images`
--

LOCK TABLES `deal_images` WRITE;
/*!40000 ALTER TABLE `deal_images` DISABLE KEYS */;
INSERT INTO `deal_images` VALUES
(1,6,'images/45f34a82-a469-4b5c-985d-9a20abc895fd.png',0,'2026-02-27 11:55:20','2026-02-27 11:55:20'),
(2,6,'images/1845f8db-b414-4f82-a814-1ec45cd40ed6.png',1,'2026-02-27 11:55:20','2026-02-27 11:55:20'),
(3,6,'images/e9f06979-fdc2-42d7-80ec-d85932bb8e77.png',2,'2026-02-27 11:55:20','2026-02-27 11:55:20'),
(4,7,'images/49f9e150-5b40-43cc-8fbc-45f887fbe042.png',0,'2026-02-27 13:53:20','2026-02-27 13:53:20'),
(5,7,'images/e6c901b8-68cc-4c08-98d9-ea3735934cae.png',1,'2026-02-27 13:53:20','2026-02-27 13:53:20'),
(6,7,'images/fb8dd6d4-8c81-4423-a808-ec8fcd324283.png',2,'2026-02-27 13:53:20','2026-02-27 13:53:20'),
(7,10,'images/f30b6db8-ae1d-4c49-99b0-d9d46fb31318.jpeg',0,'2026-03-06 23:47:16','2026-03-06 23:47:16'),
(10,11,'images/9cb2cb70-709d-4471-b39e-814730e2d42a.png',0,'2026-03-08 16:23:11','2026-03-08 16:23:11'),
(11,11,'images/4ce68463-093f-4788-b970-69e1071498eb.jpeg',1,'2026-03-08 16:23:11','2026-03-08 16:23:11'),
(13,12,'images/2c6d80dd-d4c6-483c-a94e-cc5306e15683.png',0,'2026-03-08 22:15:43','2026-03-08 22:15:43');
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
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_inspection_reports`
--

LOCK TABLES `deal_inspection_reports` WRITE;
/*!40000 ALTER TABLE `deal_inspection_reports` DISABLE KEYS */;
INSERT INTO `deal_inspection_reports` VALUES
(1,6,'2026-02-12 15:00:00',15.00,'tons','unpacked','3 ton',15000.00,'[\"images/3ac7b943-f91f-48cc-95c8-77092cfd2b1a.png\"]',2,2,'abcd','2026-02-27 12:13:50','2026-02-27 12:13:50'),
(2,7,'2026-02-28 13:05:00',5500.00,'tons','packed','3 ton',449999.00,'[\"images/f00b7e9f-cb27-43d8-b342-d3beff150870.png\",\"images/d42f17d5-8921-46bf-aac8-ba1d910f3b74.png\",\"images/db423891-2fd0-435c-8e21-533b81c35528.png\",\"images/a6989dc0-71a5-4d65-a905-61059a782755.png\"]',NULL,NULL,NULL,'2026-02-27 13:54:21','2026-03-03 14:09:59'),
(3,11,'2026-03-10 12:00:00',1000.00,'tons','packed','trailer',2.00,'[\"images/ca1600e3-7972-4072-b443-7efa973fc81d.png\"]',5,NULL,'inspection done','2026-03-08 16:31:28','2026-03-08 16:31:28'),
(4,12,'2026-03-20 14:30:00',25.00,'kg','palletized','1 ton',12000.00,'[\"images/76e3cdea-e4a8-49dd-b968-3cd951b03ad6.jpeg\"]',5,11,NULL,'2026-03-08 22:20:20','2026-03-08 22:20:20');
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
  PRIMARY KEY (`id`),
  KEY `idx_deal_id` (`deal_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_inspection_requests`
--

LOCK TABLES `deal_inspection_requests` WRITE;
/*!40000 ALTER TABLE `deal_inspection_requests` DISABLE KEYS */;
INSERT INTO `deal_inspection_requests` VALUES
(1,6,1,'500',1,'images/790e9487-c57a-4ce0-982f-d12fb3258d2a.jpeg',2,'check properly','2026-02-27 11:49:17','2026-02-27 11:49:17',NULL,NULL,NULL,NULL,NULL,NULL),
(2,7,1,'5000',1,'images/b54a56fa-8064-4083-b43c-ff4f47ba9fd1.png',2,'check properly weight and material','2026-02-27 13:53:20','2026-02-27 13:53:20',NULL,NULL,NULL,NULL,NULL,NULL),
(3,8,6,'65',1,'images/8a48672c-8de1-4b75-af62-a06e057a7282.jpg',6,'Destructing Hard disks to wipe off the data','2026-03-05 11:09:41','2026-03-05 11:09:41','ajman','yes','purchase','mainland',NULL,NULL),
(4,9,6,'55',1,'images/c60eb1a3-a97a-4184-8b2e-06a04933368b.jpg',4,NULL,'2026-03-05 16:01:36','2026-03-05 16:01:36','dxb','no','purchase','freezone',NULL,NULL),
(5,10,1,'1000',1,NULL,4,NULL,'2026-03-06 23:46:54','2026-03-06 23:46:54','ASXSJJK','yes','purchase','mainland',NULL,NULL),
(6,11,1,'1000',1,NULL,10,'check properly, weight has doubts','2026-03-08 16:22:43','2026-03-08 16:22:43','Abudhabi','no','purchase','mainland','ton',NULL),
(7,12,6,'60',1,'images/86fa7ee3-c0af-49d5-9846-228084eb76ba.jpeg',5,NULL,'2026-03-08 22:11:59','2026-03-08 22:11:59','RAK','yes','purchase','mainland','piece',NULL),
(8,15,7,'20',1,NULL,2,NULL,'2026-03-10 13:02:22','2026-03-10 13:02:22','DIP','no','service','mainland','kg','[\"safety_mask\"]');
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
  PRIMARY KEY (`id`),
  KEY `deal_items_deal_id` (`deal_id`),
  KEY `deal_items_product_service_id` (`product_service_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_items`
--

LOCK TABLES `deal_items` WRITE;
/*!40000 ALTER TABLE `deal_items` DISABLE KEYS */;
INSERT INTO `deal_items` VALUES
(1,1,1,1.00,100.00,100.00,NULL,'2026-02-26 12:10:56','2026-02-26 12:10:56'),
(2,2,1,1.00,100.00,100.00,NULL,'2026-02-26 12:11:12','2026-02-26 12:11:12'),
(3,3,1,1.00,100.00,100.00,NULL,'2026-02-26 12:12:27','2026-02-26 12:12:27'),
(4,4,1,1.00,100.00,100.00,NULL,'2026-02-26 12:20:33','2026-02-26 12:20:33'),
(5,5,1,1.00,100.00,100.00,NULL,'2026-02-26 12:21:18','2026-02-26 12:21:18'),
(7,6,1,1.00,100.00,100.00,NULL,'2026-02-27 11:55:20','2026-02-27 11:55:20'),
(8,7,1,1.00,500555.00,500555.00,NULL,'2026-02-27 13:53:20','2026-02-27 13:53:20'),
(9,8,2,1.00,0.00,0.00,NULL,'2026-03-05 11:09:41','2026-03-05 11:09:41'),
(10,9,2,56.01,70.00,3920.70,NULL,'2026-03-05 16:01:36','2026-03-05 16:01:36'),
(12,10,2,1.00,800.00,800.00,NULL,'2026-03-06 23:47:16','2026-03-06 23:47:16'),
(14,11,1,50.00,1000.00,50000.00,NULL,'2026-03-08 16:23:11','2026-03-08 16:23:11'),
(16,12,2,25.00,450.00,11250.00,'Refurbishing','2026-03-08 22:15:43','2026-03-08 22:15:43'),
(18,13,2,1.00,60.00,60.00,NULL,'2026-03-10 12:14:16','2026-03-10 12:14:16'),
(20,14,2,10.00,80.00,800.00,NULL,'2026-03-10 12:35:21','2026-03-10 12:35:21'),
(22,15,3,20.00,120.00,2400.00,NULL,'2026-03-10 13:28:06','2026-03-10 13:28:06'),
(26,16,1,100.00,10.00,1000.00,'Discounted Price','2026-03-19 13:06:24','2026-03-19 13:06:24');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_statuses`
--

LOCK TABLES `deal_statuses` WRITE;
/*!40000 ALTER TABLE `deal_statuses` DISABLE KEYS */;
INSERT INTO `deal_statuses` VALUES
(1,'draft','Draft',1,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(2,'pending','Pending Approval',2,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(3,'approved','Approved',3,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(4,'in_progress','In Progress',4,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(5,'completed','Completed',5,1,'2026-02-22 22:06:13','2026-02-22 22:06:13'),
(6,'cancelled','Cancelled',6,1,'2026-02-22 22:06:13','2026-02-22 22:06:13');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_deal_terms` (`deal_id`,`terms_and_conditions_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_terms_id` (`terms_and_conditions_id`)
) ENGINE=InnoDB AUTO_INCREMENT=163 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deal_terms`
--

LOCK TABLES `deal_terms` WRITE;
/*!40000 ALTER TABLE `deal_terms` DISABLE KEYS */;
INSERT INTO `deal_terms` VALUES
(1,1,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(2,2,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(3,4,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(4,5,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(5,6,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(6,7,1,0,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(25,8,1,0,'2026-03-05 11:09:41','2026-03-05 11:09:41'),
(33,9,1,0,'2026-03-05 16:01:36','2026-03-05 16:01:36'),
(63,10,1,0,'2026-03-06 23:47:16','2026-03-06 23:47:16'),
(89,11,1,0,'2026-03-08 16:23:11','2026-03-08 16:23:11'),
(100,12,1,0,'2026-03-08 22:15:43','2026-03-08 22:15:43'),
(144,13,1,0,'2026-03-10 12:14:16','2026-03-10 12:14:16'),
(146,14,1,0,'2026-03-10 12:35:21','2026-03-10 12:35:21'),
(148,15,1,0,'2026-03-10 13:28:06','2026-03-10 13:28:06'),
(149,15,2,1,'2026-03-10 13:28:06','2026-03-10 13:28:06');
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
(1,1,'In omnis aliquip off','2004-05-11','Odonnell Wells LLC','In animi necessitat','ssdfghjkl','Qui ea veniam natus','Voluptas deserunt co','637','Minus ipsum delectus','Voluptas dolorem sun','Laborum sint dolore','Vel nostrud maxime t','Commodo tenetur dign','2026-02-26 12:10:56','2026-02-26 12:10:56'),
(2,2,'In omnis aliquip off','2004-05-11','Odonnell Wells LLC','In animi necessitat','ssdfghjkl','Qui ea veniam natus','Voluptas deserunt co','637','Minus ipsum delectus','Voluptas dolorem sun','Laborum sint dolore','Vel nostrud maxime t','Commodo tenetur dign','2026-02-26 12:11:12','2026-02-26 12:11:12'),
(3,3,'aa11','2026-02-26','abcd','1234567','aaaaaaaaa',NULL,NULL,'111',NULL,'1234567',NULL,NULL,NULL,'2026-02-26 12:12:27','2026-02-26 12:12:27'),
(4,4,'aaaa','2026-02-26','Morin Goodwin LLC','12345678','sdsda545511',NULL,NULL,NULL,NULL,'1515aa',NULL,NULL,NULL,'2026-02-26 12:20:33','2026-02-26 12:20:33'),
(5,5,'aaaa','2026-02-26','Morin Goodwin LLC','12345678','sdsda545511',NULL,NULL,NULL,NULL,'1515aa',NULL,NULL,NULL,'2026-02-26 12:21:18','2026-02-26 12:21:18'),
(6,7,'abc123','2026-02-27','Test company','456789','asdfghjkl',NULL,NULL,NULL,NULL,'A555',NULL,NULL,NULL,'2026-02-27 13:53:20','2026-02-27 13:53:20');
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
  `status` enum('draft','pending','approved','in_progress','completed','cancelled') DEFAULT 'draft',
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
  CONSTRAINT `deals_terms_and_conditions_id_foreign_idx` FOREIGN KEY (`terms_and_conditions_id`) REFERENCES `terms_and_conditions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deals`
--

LOCK TABLES `deals` WRITE;
/*!40000 ALTER TABLE `deals` DISABLE KEYS */;
INSERT INTO `deals` VALUES
(1,2,'DEAL-MM36OU8C-EA7FCAF5',NULL,NULL,NULL,NULL,'Explicabo Dolor fac','Laboris error id en','1977-09-18 04:00:00',100.00,5.00,5.00,105.00,'AED','draft','unpaid',0.00,NULL,'Similique quod numqu','2026-02-26 12:10:56','2026-02-26 12:10:56',NULL,1,'offer_to_charge','LCL','Main Land',1,1,1,0,0),
(2,2,'DEAL-MM36P685-F29BD795',NULL,NULL,NULL,NULL,'Explicabo Dolor fac','Laboris error id en','1977-09-18 04:00:00',100.00,5.00,5.00,105.00,'AED','draft','unpaid',0.00,NULL,'Similique quod numqu','2026-02-26 12:11:12','2026-02-26 12:11:12',NULL,1,'offer_to_charge','LCL','Main Land',1,1,1,0,0),
(3,2,'DEAL-MM36QS89-55160CC4',2,3,4,NULL,'abc','','2026-02-26 04:00:00',100.00,5.00,5.00,105.00,'AED','draft','unpaid',0.00,2,'','2026-02-26 12:12:27','2026-02-26 12:12:27',NULL,NULL,'offer_to_charge','LCL','Main Land',1,1,1,0,0),
(4,2,'DEAL-MM3717EJ-20F5C2CD',2,3,NULL,NULL,'Perspiciatis lorem ','Repudiandae rerum at','2009-10-24 04:00:00',100.00,5.00,5.00,105.00,'AED','draft','unpaid',0.00,NULL,'Molestiae dolor offi','2026-02-26 12:20:33','2026-02-26 12:20:33',NULL,1,'offer_to_charge','FCL','Main Land',1,0,0,0,0),
(5,2,'DEAL-MM3725NA-CD8B63C0',2,3,NULL,NULL,'Perspiciatis lorem ','Repudiandae rerum at','2009-10-24 04:00:00',100.00,5.00,5.00,105.00,'AED','draft','unpaid',0.00,NULL,'Molestiae dolor offi','2026-02-26 12:21:17','2026-02-26 12:21:17',NULL,1,'offer_to_charge','FCL','Main Land',1,0,0,0,0),
(6,2,'DEAL-MM4LCUI2-B2CF474C',2,3,4,NULL,'Nulla non mollit non','Sit accusantium qui','1975-08-14 04:00:00',100.00,5.00,5.00,105.00,'AED','in_progress','unpaid',0.00,2,'Animi exercitatione','2026-02-27 11:49:17','2026-02-27 11:49:17',NULL,1,'offer_to_charge','LCL','Main Land',0,1,1,1,1),
(7,2,'DEAL-MM4PSD7H-321C6BDF',3,4,5,1,'Deal from Lead LEAD-MM4POZWG-A4923900','to be called at 5pm','2026-02-27 04:00:00',500555.00,5.00,25027.75,525582.75,'AED','in_progress','unpaid',0.00,2,'','2026-02-27 13:53:20','2026-02-27 13:53:20',NULL,1,'offer_to_charge','LCL','Main Land',1,1,1,1,0),
(8,2,'DEAL-MMD4L15W-0784A5DF',4,7,9,NULL,'Deal from Lead LEAD-MMD33RB9-57F5209C','','2026-03-05 04:00:00',0.00,5.00,0.00,0.00,'AED','draft','unpaid',0.00,2,'','2026-03-05 11:09:41','2026-03-05 15:57:33','2026-03-05 15:57:33',1,'offer_to_purchase',NULL,NULL,0,1,0,0,0),
(9,2,'DEAL-MMDF0FMO-E4F9CE6F',6,12,17,NULL,'Deal from Lead LEAD-MMDEXFRZ-5C319775','ITAD SERVICE','2026-03-05 04:00:00',3920.70,5.00,196.03,4116.73,'AED','draft','unpaid',0.00,6,'','2026-03-05 16:01:36','2026-03-05 16:01:36',NULL,1,'offer_to_purchase',NULL,NULL,0,1,0,0,0),
(10,2,'DEAL-MMFB2NWP-F00920DD',7,19,14,1,'Deal from Lead LEAD-MMFAY3AI-71220A61','','2026-03-06 04:00:00',800.00,5.00,40.00,840.00,'AED','draft','unpaid',0.00,6,'','2026-03-06 23:46:54','2026-03-06 23:46:54',NULL,1,'offer_to_purchase',NULL,NULL,0,1,0,0,0),
(11,2,'DEAL-MMHQ35KB-9491A6ED',5,10,15,1,'Deal from Lead LEAD-MMD9MQ2L-B0A5CC03','finalized','2026-03-08 04:00:00',50000.00,5.00,2500.00,52500.00,'AED','draft','unpaid',0.00,10,'','2026-03-08 16:22:43','2026-03-08 16:23:11',NULL,1,'offer_to_purchase',NULL,NULL,0,1,0,0,0),
(12,2,'DEAL-MMI2KAVJ-A881B785',9,24,30,3,'Deal from Lead LEAD-MMI29PUM-F5755257','Refurbishing of laptops','2026-03-08 04:00:00',11250.00,5.00,562.50,11812.50,'AED','draft','unpaid',0.00,2,'','2026-03-08 22:11:59','2026-03-08 22:15:43',NULL,1,'offer_to_purchase',NULL,NULL,0,1,0,0,0),
(13,2,'DEAL-MMIWMZX3-7B04279B',9,24,27,1,'Totam sit aut ut qu','Praesentium velit la','2015-05-23 04:00:00',60.00,5.00,3.00,63.00,'AED','draft','unpaid',0.00,10,'Velit ex repudiandae','2026-03-09 12:13:53','2026-03-09 12:13:53',NULL,1,'offer_to_charge',NULL,NULL,0,0,0,0,0),
(14,2,'DEAL-MMKCD9UK-0E36E5A5',10,23,34,NULL,'Deal from Lead LEAD-MMKC9CMB-2A51FFD4','','2026-03-10 04:00:00',800.00,5.00,40.00,840.00,'AED','draft','unpaid',0.00,2,'','2026-03-10 12:21:59','2026-03-10 12:35:21',NULL,1,'offer_to_purchase',NULL,NULL,0,0,0,0,0),
(15,2,'DEAL-MMKDT784-FEED4E52',11,23,34,NULL,'Deal from Lead LEAD-MMKDKZED-C85215E5','20 Kgs of Form','2026-03-10 04:00:00',2400.00,5.00,120.00,2520.00,'AED','draft','unpaid',0.00,2,'','2026-03-10 13:02:22','2026-03-10 13:28:06',NULL,1,'offer_to_charge',NULL,NULL,0,1,0,0,0),
(16,2,'DEAL-MMX8U8WO-BD038BA5',12,19,38,NULL,'Deal from Lead LEAD-MMX8TMU8-0F6BFCF4','This is a test deal ','2026-03-19 04:00:00',1000.00,5.00,50.00,1050.00,'AED','draft','partial',525.00,6,'','2026-03-19 13:04:13','2026-03-19 13:06:24',NULL,NULL,'offer_to_purchase',NULL,NULL,0,0,0,0,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
INSERT INTO `leads` VALUES
(1,2,'LEAD-MLY61TE8-CA1C4AA1','tymecireqi@mailinator.com','+1 (242) 972-8153','Website','[\"Waste Collection\"]',555000.00,'Adipisci incidunt e',NULL,'converted',NULL,NULL,'2026-02-24 10:34:00','2026-02-22 23:54:11','2026-02-24 10:34:00',NULL,2,1,NULL,NULL,NULL,NULL),
(2,2,'LEAD-MM0IGHMT-4CB795E3','abdulkareemmain@gmail.com','0562933739','Cold Call','[]',5000.00,'',NULL,'converted',NULL,NULL,NULL,'2026-02-24 15:17:03','2026-02-27 11:49:17',NULL,2,3,NULL,NULL,1,NULL),
(3,2,'LEAD-MM4POZWG-A4923900','abdulkareemmain@gmail.com','0562933739','Cold Call','[]',500555.00,'to be called at 5pm',NULL,'converted',NULL,NULL,NULL,'2026-02-27 13:50:42','2026-02-27 13:53:20',NULL,4,5,NULL,NULL,1,NULL),
(4,2,'LEAD-MMD33RB9-57F5209C','kvasan@gmail.com','5675678899','Cold Call','[]',NULL,NULL,NULL,'converted',NULL,NULL,NULL,'2026-03-05 10:28:16','2026-03-05 11:09:41',NULL,7,9,NULL,NULL,2,NULL),
(5,2,'LEAD-MMD9MQ2L-B0A5CC03','abc@abc.com','1234567890','Cold Call','[]',NULL,NULL,10,'converted',NULL,NULL,NULL,'2026-03-05 13:30:58','2026-03-08 16:22:43',NULL,10,15,NULL,NULL,1,6),
(6,2,'LEAD-MMDEXFRZ-5C319775','kriti321@gmail.com','37462384683','Cold Call','[]',NULL,NULL,NULL,'converted',NULL,NULL,NULL,'2026-03-05 15:59:16','2026-03-05 16:01:36',NULL,12,17,NULL,NULL,2,NULL),
(7,2,'LEAD-MMFAY3AI-71220A61','sesy@mailinator.com','+1 (291) 838-5536','Website','[]',NULL,NULL,NULL,'converted',NULL,NULL,NULL,'2026-03-06 23:43:20','2026-03-06 23:46:54',NULL,19,14,NULL,NULL,2,NULL),
(8,2,'LEAD-MMHPQWR5-41DE3AE0','a5@gmail.com','234567890','Social Media','[]',NULL,NULL,10,'disqualified',NULL,'false data',NULL,'2026-03-08 16:13:12','2026-03-08 16:13:33',NULL,21,28,NULL,NULL,1,10),
(9,2,'LEAD-MMI29PUM-F5755257','john@gmail.com','579853433','Cold Call','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-03-08 22:03:45','2026-03-09 12:13:53',NULL,22,29,NULL,NULL,2,NULL),
(10,2,'LEAD-MMKC9CMB-2A51FFD4','naidugm@gmail.com','487328947','Website','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-03-10 12:18:56','2026-03-10 12:21:59',NULL,23,34,NULL,NULL,2,NULL),
(11,2,'LEAD-MMKDKZED-C85215E5','naidugm@gmail.com','487328947','Cold Call','[]',NULL,NULL,2,'converted',NULL,NULL,NULL,'2026-03-10 12:55:59','2026-03-10 13:02:22',NULL,23,34,NULL,NULL,3,NULL),
(12,2,'LEAD-MMX8TMU8-0F6BFCF4',NULL,'12345678tf','Website','[]',NULL,NULL,6,'converted',NULL,NULL,NULL,'2026-03-19 13:03:44','2026-03-19 13:04:13',NULL,19,38,NULL,NULL,1,NULL),
(13,2,'LEAD-MN2Q0GWI-6E51ECC3','harveys@gmail.com','31243243213','Social Media','[]',NULL,NULL,2,'qualified',NULL,NULL,NULL,'2026-03-23 09:03:48','2026-03-23 09:03:56',NULL,23,30,NULL,NULL,2,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=171 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=493 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES
(1,'dashboard.create','Create Dashboard','','create','Permission to create dashboard'),
(2,'dashboard.read','Read Dashboard','','read','Permission to read dashboard'),
(3,'dashboard.update','Update Dashboard','','update','Permission to update dashboard'),
(4,'dashboard.delete','Delete Dashboard','','delete','Permission to delete dashboard'),
(5,'dashboard.approve','Approve Dashboard','','approve','Permission to approve dashboard'),
(6,'dashboard.export','Export Dashboard','','export','Permission to export dashboard'),
(7,'clients.create','Create Clients','','create','Permission to create clients'),
(8,'clients.read','Read Clients','','read','Permission to read clients'),
(9,'clients.update','Update Clients','','update','Permission to update clients'),
(10,'clients.delete','Delete Clients','','delete','Permission to delete clients'),
(11,'clients.approve','Approve Clients','','approve','Permission to approve clients'),
(12,'clients.export','Export Clients','','export','Permission to export clients'),
(13,'vendors.create','Create Vendors','','create','Permission to create vendors'),
(14,'vendors.read','Read Vendors','','read','Permission to read vendors'),
(15,'vendors.update','Update Vendors','','update','Permission to update vendors'),
(16,'vendors.delete','Delete Vendors','','delete','Permission to delete vendors'),
(17,'vendors.approve','Approve Vendors','','approve','Permission to approve vendors'),
(18,'vendors.export','Export Vendors','','export','Permission to export vendors'),
(19,'leads.create','Create Leads','leads','create','Permission to create leads'),
(20,'leads.read','Read Leads','leads','read','Permission to read leads'),
(21,'leads.update','Update Leads','leads','update','Permission to update leads'),
(22,'leads.delete','Delete Leads','leads','delete','Permission to delete leads'),
(23,'leads.approve','Approve Leads','leads','approve','Permission to approve leads'),
(24,'leads.export','Export Leads','leads','export','Permission to export leads'),
(25,'deals.create','Create Deals','','create','Permission to create deals'),
(26,'deals.read','Read Deals','','read','Permission to read deals'),
(27,'deals.update','Update Deals','','update','Permission to update deals'),
(28,'deals.delete','Delete Deals','','delete','Permission to delete deals'),
(29,'deals.approve','Approve Deals','','approve','Permission to approve deals'),
(30,'deals.export','Export Deals','','export','Permission to export deals'),
(31,'products.create','Create Products','','create','Permission to create products'),
(32,'products.read','Read Products','','read','Permission to read products'),
(33,'products.update','Update Products','','update','Permission to update products'),
(34,'products.delete','Delete Products','','delete','Permission to delete products'),
(35,'products.approve','Approve Products','','approve','Permission to approve products'),
(36,'products.export','Export Products','','export','Permission to export products'),
(37,'services.create','Create Services','','create','Permission to create services'),
(38,'services.read','Read Services','','read','Permission to read services'),
(39,'services.update','Update Services','','update','Permission to update services'),
(40,'services.delete','Delete Services','','delete','Permission to delete services'),
(41,'services.approve','Approve Services','','approve','Permission to approve services'),
(42,'services.export','Export Services','','export','Permission to export services'),
(43,'accounting.create','Create Accounting','','create','Permission to create accounting'),
(44,'accounting.read','Read Accounting','','read','Permission to read accounting'),
(45,'accounting.update','Update Accounting','','update','Permission to update accounting'),
(46,'accounting.delete','Delete Accounting','','delete','Permission to delete accounting'),
(47,'accounting.approve','Approve Accounting','','approve','Permission to approve accounting'),
(48,'accounting.export','Export Accounting','','export','Permission to export accounting'),
(49,'commissions.create','Create Commissions','','create','Permission to create commissions'),
(50,'commissions.read','Read Commissions','','read','Permission to read commissions'),
(51,'commissions.update','Update Commissions','','update','Permission to update commissions'),
(52,'commissions.delete','Delete Commissions','','delete','Permission to delete commissions'),
(53,'commissions.approve','Approve Commissions','','approve','Permission to approve commissions'),
(54,'commissions.export','Export Commissions','','export','Permission to export commissions'),
(55,'documents.create','Create Documents','','create','Permission to create documents'),
(56,'documents.read','Read Documents','','read','Permission to read documents'),
(57,'documents.update','Update Documents','','update','Permission to update documents'),
(58,'documents.delete','Delete Documents','','delete','Permission to delete documents'),
(59,'documents.approve','Approve Documents','','approve','Permission to approve documents'),
(60,'documents.export','Export Documents','','export','Permission to export documents'),
(61,'operations.create','Create Operations','','create','Permission to create operations'),
(62,'operations.read','Read Operations','','read','Permission to read operations'),
(63,'operations.update','Update Operations','','update','Permission to update operations'),
(64,'operations.delete','Delete Operations','','delete','Permission to delete operations'),
(65,'operations.approve','Approve Operations','','approve','Permission to approve operations'),
(66,'operations.export','Export Operations','','export','Permission to export operations'),
(67,'reports.create','Create Reports','','create','Permission to create reports'),
(68,'reports.read','Read Reports','','read','Permission to read reports'),
(69,'reports.update','Update Reports','','update','Permission to update reports'),
(70,'reports.delete','Delete Reports','','delete','Permission to delete reports'),
(71,'reports.approve','Approve Reports','','approve','Permission to approve reports'),
(72,'reports.export','Export Reports','','export','Permission to export reports'),
(73,'settings.create','Create Settings','','create','Permission to create settings'),
(74,'settings.read','Read Settings','','read','Permission to read settings'),
(75,'settings.update','Update Settings','','update','Permission to update settings'),
(76,'settings.delete','Delete Settings','','delete','Permission to delete settings'),
(77,'settings.approve','Approve Settings','','approve','Permission to approve settings'),
(78,'settings.export','Export Settings','','export','Permission to export settings'),
(79,'users.create','Create Users','users','create','Permission to create users'),
(80,'users.read','Read Users','users','read','Permission to read users'),
(81,'users.update','Update Users','users','update','Permission to update users'),
(82,'users.delete','Delete Users','users','delete','Permission to delete users'),
(83,'users.approve','Approve Users','users','approve','Permission to approve users'),
(84,'users.export','Export Users','users','export','Permission to export users'),
(85,'masters.create','Create Masters','','create','Permission to create masters'),
(86,'masters.read','Read Masters','','read','Permission to read masters'),
(87,'masters.update','Update Masters','','update','Permission to update masters'),
(88,'masters.delete','Delete Masters','','delete','Permission to delete masters'),
(89,'masters.approve','Approve Masters','','approve','Permission to approve masters'),
(90,'masters.export','Export Masters','','export','Permission to export masters'),
(91,'certificates.create','Create Certificates','','create','Permission to create certificates'),
(92,'certificates.read','Read Certificates','','read','Permission to read certificates'),
(93,'certificates.update','Update Certificates','','update','Permission to update certificates'),
(94,'certificates.delete','Delete Certificates','','delete','Permission to delete certificates'),
(95,'certificates.approve','Approve Certificates','','approve','Permission to approve certificates'),
(96,'certificates.export','Export Certificates','','export','Permission to export certificates'),
(97,'fleets.create','Create Fleets','','create','Permission to create fleets'),
(98,'fleets.read','Read Fleets','','read','Permission to read fleets'),
(99,'fleets.update','Update Fleets','','update','Permission to update fleets'),
(100,'fleets.delete','Delete Fleets','','delete','Permission to delete fleets'),
(101,'fleets.approve','Approve Fleets','','approve','Permission to approve fleets'),
(102,'fleets.export','Export Fleets','','export','Permission to export fleets'),
(103,'hr.create','Create Hr','','create','Permission to create hr'),
(104,'hr.read','Read Hr','','read','Permission to read hr'),
(105,'hr.update','Update Hr','','update','Permission to update hr'),
(106,'hr.delete','Delete Hr','','delete','Permission to delete hr'),
(107,'hr.approve','Approve Hr','','approve','Permission to approve hr'),
(108,'hr.export','Export Hr','','export','Permission to export hr'),
(109,'payroll.create','Create Payroll','','create','Permission to create payroll'),
(110,'payroll.read','Read Payroll','','read','Permission to read payroll'),
(111,'payroll.update','Update Payroll','','update','Permission to update payroll'),
(112,'payroll.delete','Delete Payroll','','delete','Permission to delete payroll'),
(113,'payroll.approve','Approve Payroll','','approve','Permission to approve payroll'),
(114,'payroll.export','Export Payroll','','export','Permission to export payroll'),
(115,'inbound.create','Create Inbound','','create','Permission to create inbound'),
(116,'inbound.read','Read Inbound','','read','Permission to read inbound'),
(117,'inbound.update','Update Inbound','','update','Permission to update inbound'),
(118,'inbound.delete','Delete Inbound','','delete','Permission to delete inbound'),
(119,'inbound.approve','Approve Inbound','','approve','Permission to approve inbound'),
(120,'inbound.export','Export Inbound','','export','Permission to export inbound'),
(121,'inventory.create','Create Inventory','','create','Permission to create inventory'),
(122,'inventory.read','Read Inventory','','read','Permission to read inventory'),
(123,'inventory.update','Update Inventory','','update','Permission to update inventory'),
(124,'inventory.delete','Delete Inventory','','delete','Permission to delete inventory'),
(125,'inventory.approve','Approve Inventory','','approve','Permission to approve inventory'),
(126,'inventory.export','Export Inventory','','export','Permission to export inventory'),
(127,'outbound.create','Create Outbound','','create','Permission to create outbound'),
(128,'outbound.read','Read Outbound','','read','Permission to read outbound'),
(129,'outbound.update','Update Outbound','','update','Permission to update outbound'),
(130,'outbound.delete','Delete Outbound','','delete','Permission to delete outbound'),
(131,'outbound.approve','Approve Outbound','','approve','Permission to approve outbound'),
(132,'outbound.export','Export Outbound','','export','Permission to export outbound'),
(133,'contacts.create','Create Contacts','contacts','create','Permission to create contacts'),
(134,'contacts.read','Read Contacts','contacts','read','Permission to read contacts'),
(135,'contacts.update','Update Contacts','contacts','update','Permission to update contacts'),
(136,'contacts.delete','Delete Contacts','contacts','delete','Permission to delete contacts'),
(137,'contacts.approve','Approve Contacts','contacts','approve','Permission to approve contacts'),
(138,'contacts.export','Export Contacts','contacts','export','Permission to export contacts'),
(139,'companies.create','Create Companies','companies','create','Permission to create companies'),
(140,'companies.read','Read Companies','companies','read','Permission to read companies'),
(141,'companies.update','Update Companies','companies','update','Permission to update companies'),
(142,'companies.delete','Delete Companies','companies','delete','Permission to delete companies'),
(143,'companies.approve','Approve Companies','companies','approve','Permission to approve companies'),
(144,'companies.export','Export Companies','companies','export','Permission to export companies'),
(145,'suppliers.create','Create Suppliers','suppliers','create','Permission to create suppliers'),
(146,'suppliers.read','Read Suppliers','suppliers','read','Permission to read suppliers'),
(147,'suppliers.update','Update Suppliers','suppliers','update','Permission to update suppliers'),
(148,'suppliers.delete','Delete Suppliers','suppliers','delete','Permission to delete suppliers'),
(149,'suppliers.approve','Approve Suppliers','suppliers','approve','Permission to approve suppliers'),
(150,'suppliers.export','Export Suppliers','suppliers','export','Permission to export suppliers'),
(433,'inspection_requests.read','Read Inspection Requests','inspection_requests','read','Permission to read inspection requests'),
(434,'inspection_reports.read','Read Inspection Reports','inspection_reports','read','Permission to read inspection reports'),
(435,'inspection_reports.create','Create Inspection Reports','inspection_reports','create','Permission to create inspection reports'),
(436,'inspection_reports.update','Update Inspection Reports','inspection_reports','update','Permission to update inspection reports');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products_services`
--

LOCK TABLES `products_services` WRITE;
/*!40000 ALTER TABLE `products_services` DISABLE KEYS */;
INSERT INTO `products_services` VALUES
(1,2,'Test Product','product','Recycling','Test product for QA',NULL,100.00,'AED','active','2026-02-23 01:52:41','2026-02-23 01:52:41',NULL),
(2,2,'Data  Erasure','product','ITAD Services','Destruction of Hard disks','piece',60.00,'AED','active','2026-03-05 11:03:43','2026-03-05 11:03:43',NULL),
(3,2,'Chemical Disposal','product','Disposal','Chemical Disposal ','kg',20.00,'AED','active','2026-03-10 12:51:10','2026-03-10 12:51:10',NULL);
/*!40000 ALTER TABLE `products_services` ENABLE KEYS */;
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
  PRIMARY KEY (`id`),
  KEY `idx_purchase_order_id` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES
(2,2,2,'Refurbishing','25.00','450.00','11250.00',0,'2026-03-08 22:16:19','2026-03-08 22:16:19'),
(3,3,2,'100','10.00','100.00','1000.00',0,'2026-03-10 12:33:15','2026-03-10 12:33:15'),
(4,4,3,NULL,'20.00','50','1000.00',0,'2026-03-10 13:12:25','2026-03-10 13:12:25'),
(5,5,1,'Discounted Price','100.00','10.00','1000.00',0,'2026-03-19 13:07:11','2026-03-19 13:07:11'),
(6,1,1,NULL,'1.00','500555.00','500555.00',0,'2026-03-21 13:56:18','2026-03-21 13:56:18'),
(7,6,1,'Discounted Price','100.00','10.00','1000.00',0,'2026-03-23 08:54:44','2026-03-23 08:54:44');
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
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_statuses`
--

LOCK TABLES `purchase_order_statuses` WRITE;
/*!40000 ALTER TABLE `purchase_order_statuses` DISABLE KEYS */;
INSERT INTO `purchase_order_statuses` VALUES
(1,'draft','Draft',1,1,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(2,'sent','Sent',2,1,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(3,'approved','Approved',3,1,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(4,'rejected','Rejected',4,1,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(5,'delivered','Delivered',5,1,'2026-03-04 17:46:03','2026-03-04 17:46:03');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_po_terms` (`purchase_order_id`,`terms_and_conditions_id`),
  KEY `idx_purchase_order_id` (`purchase_order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_terms`
--

LOCK TABLES `purchase_order_terms` WRITE;
/*!40000 ALTER TABLE `purchase_order_terms` DISABLE KEYS */;
INSERT INTO `purchase_order_terms` VALUES
(2,2,1,0,'2026-03-08 22:16:19','2026-03-08 22:16:19'),
(3,3,1,0,'2026-03-10 12:33:15','2026-03-10 12:33:15'),
(4,4,1,0,'2026-03-10 13:12:25','2026-03-10 13:12:25'),
(5,4,2,1,'2026-03-10 13:12:25','2026-03-10 13:12:25'),
(6,1,1,0,'2026-03-21 13:56:18','2026-03-21 13:56:18'),
(7,6,1,0,'2026-03-23 08:54:44','2026-03-23 08:54:44');
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
  `supplier_id` int(11) NOT NULL,
  `po_date` date NOT NULL,
  `expected_delivery` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_po_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES
(1,2,1,'2026-03-06',NULL,'2026-03-06 15:30:36','2026-03-21 13:56:18',7,'approved'),
(2,2,3,'2026-03-08',NULL,'2026-03-08 22:16:19','2026-03-08 22:16:19',12,'draft'),
(3,2,5,'2026-03-10',NULL,'2026-03-10 12:33:15','2026-03-10 12:33:15',14,'draft'),
(4,2,6,'2026-03-10',NULL,'2026-03-10 13:12:25','2026-03-10 13:12:25',15,'draft'),
(5,2,5,'2026-03-19',NULL,'2026-03-19 13:07:11','2026-03-19 13:07:11',16,'draft'),
(6,2,6,'2026-03-23',NULL,'2026-03-23 08:54:44','2026-03-23 08:54:44',16,'approved');
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
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_statuses`
--

LOCK TABLES `quotation_statuses` WRITE;
/*!40000 ALTER TABLE `quotation_statuses` DISABLE KEYS */;
INSERT INTO `quotation_statuses` VALUES
(1,'draft','Draft',1,1,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(2,'sent','Sent',2,1,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(3,'approved','Approved',3,1,'2026-03-04 17:46:03','2026-03-04 17:46:03'),
(4,'rejected','Rejected',4,1,'2026-03-04 17:46:03','2026-03-04 17:46:03');
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
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_deal_id` (`deal_id`),
  KEY `idx_prepared_by` (`prepared_by`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotations`
--

LOCK TABLES `quotations` WRITE;
/*!40000 ALTER TABLE `quotations` DISABLE KEYS */;
INSERT INTO `quotations` VALUES
(1,2,8,6,'2026-03-05',2699.99,'AED','draft',NULL,'2026-03-05 11:35:53','2026-03-05 11:35:53'),
(2,2,9,6,'2026-03-06',4116.73,'AED','approved',NULL,'2026-03-06 23:52:55','2026-03-06 23:52:55'),
(3,2,10,4,'2026-03-06',840.00,'AED','draft',NULL,'2026-03-07 00:03:35','2026-03-07 00:03:35'),
(4,2,11,10,'2026-03-08',52500.00,'AED','draft',NULL,'2026-03-08 16:32:28','2026-03-08 16:32:28'),
(5,2,14,2,'2026-03-10',1050.00,'AED','approved',NULL,'2026-03-10 12:29:25','2026-03-10 12:39:05'),
(6,2,15,2,'2026-03-10',2520.00,'AED','approved',NULL,'2026-03-10 13:06:03','2026-03-22 10:11:18');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_permission_id_role_id_unique` (`role_id`,`permission_id`),
  UNIQUE KEY `role_permissions_role_id_permission_id` (`role_id`,`permission_id`),
  KEY `role_permissions_role_id` (`role_id`),
  KEY `role_permissions_permission_id` (`permission_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4400 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES
(1,1,1),
(2,1,2),
(3,1,3),
(4,1,4),
(5,1,5),
(6,1,6),
(7,1,7),
(8,1,8),
(9,1,9),
(10,1,10),
(11,1,11),
(12,1,12),
(13,1,13),
(14,1,14),
(15,1,15),
(16,1,16),
(17,1,17),
(18,1,18),
(19,1,19),
(20,1,20),
(21,1,21),
(22,1,22),
(23,1,23),
(24,1,24),
(25,1,25),
(26,1,26),
(27,1,27),
(28,1,28),
(29,1,29),
(30,1,30),
(31,1,31),
(32,1,32),
(33,1,33),
(34,1,34),
(35,1,35),
(36,1,36),
(37,1,37),
(38,1,38),
(39,1,39),
(40,1,40),
(41,1,41),
(42,1,42),
(43,1,43),
(44,1,44),
(45,1,45),
(46,1,46),
(47,1,47),
(48,1,48),
(49,1,49),
(50,1,50),
(51,1,51),
(52,1,52),
(53,1,53),
(54,1,54),
(55,1,55),
(56,1,56),
(57,1,57),
(58,1,58),
(59,1,59),
(60,1,60),
(61,1,61),
(62,1,62),
(63,1,63),
(64,1,64),
(65,1,65),
(66,1,66),
(67,1,67),
(68,1,68),
(69,1,69),
(70,1,70),
(71,1,71),
(72,1,72),
(73,1,73),
(74,1,74),
(75,1,75),
(76,1,76),
(77,1,77),
(78,1,78),
(79,1,79),
(80,1,80),
(81,1,81),
(82,1,82),
(83,1,83),
(84,1,84),
(85,1,85),
(86,1,86),
(87,1,87),
(88,1,88),
(89,1,89),
(90,1,90),
(91,1,91),
(92,1,92),
(93,1,93),
(94,1,94),
(95,1,95),
(96,1,96),
(97,1,97),
(98,1,98),
(99,1,99),
(100,1,100),
(101,1,101),
(102,1,102),
(103,1,103),
(104,1,104),
(105,1,105),
(106,1,106),
(107,1,107),
(108,1,108),
(109,1,109),
(110,1,110),
(111,1,111),
(112,1,112),
(113,1,113),
(114,1,114),
(115,1,115),
(116,1,116),
(117,1,117),
(118,1,118),
(119,1,119),
(120,1,120),
(121,1,121),
(122,1,122),
(123,1,123),
(124,1,124),
(125,1,125),
(126,1,126),
(127,1,127),
(128,1,128),
(129,1,129),
(130,1,130),
(131,1,131),
(132,1,132),
(265,1,133),
(266,1,134),
(267,1,135),
(268,1,136),
(269,1,137),
(270,1,138),
(271,1,139),
(272,1,140),
(273,1,141),
(274,1,142),
(275,1,143),
(276,1,144),
(277,1,145),
(278,1,146),
(279,1,147),
(280,1,148),
(281,1,149),
(282,1,150),
(287,1,433),
(288,1,434),
(289,1,435),
(290,1,436),
(133,2,1),
(134,2,2),
(135,2,3),
(136,2,4),
(137,2,5),
(138,2,6),
(139,2,7),
(140,2,8),
(141,2,9),
(142,2,10),
(143,2,11),
(144,2,12),
(145,2,13),
(146,2,14),
(147,2,15),
(148,2,16),
(149,2,17),
(150,2,18),
(151,2,19),
(152,2,20),
(153,2,21),
(154,2,22),
(155,2,23),
(156,2,24),
(157,2,25),
(158,2,26),
(159,2,27),
(160,2,28),
(161,2,29),
(162,2,30),
(163,2,31),
(164,2,32),
(165,2,33),
(166,2,34),
(167,2,35),
(168,2,36),
(169,2,37),
(170,2,38),
(171,2,39),
(172,2,40),
(173,2,41),
(174,2,42),
(175,2,43),
(176,2,44),
(177,2,45),
(178,2,46),
(179,2,47),
(180,2,48),
(181,2,49),
(182,2,50),
(183,2,51),
(184,2,52),
(185,2,53),
(186,2,54),
(187,2,55),
(188,2,56),
(189,2,57),
(190,2,58),
(191,2,59),
(192,2,60),
(193,2,61),
(194,2,62),
(195,2,63),
(196,2,64),
(197,2,65),
(198,2,66),
(199,2,67),
(200,2,68),
(201,2,69),
(202,2,70),
(203,2,71),
(204,2,72),
(205,2,73),
(206,2,74),
(207,2,75),
(208,2,76),
(209,2,77),
(210,2,78),
(211,2,79),
(212,2,80),
(213,2,81),
(214,2,82),
(215,2,83),
(216,2,84),
(217,2,85),
(218,2,86),
(219,2,87),
(220,2,88),
(221,2,89),
(222,2,90),
(223,2,91),
(224,2,92),
(225,2,93),
(226,2,94),
(227,2,95),
(228,2,96),
(229,2,97),
(230,2,98),
(231,2,99),
(232,2,100),
(233,2,101),
(234,2,102),
(235,2,103),
(236,2,104),
(237,2,105),
(238,2,106),
(239,2,107),
(240,2,108),
(241,2,109),
(242,2,110),
(243,2,111),
(244,2,112),
(245,2,113),
(246,2,114),
(247,2,115),
(248,2,116),
(249,2,117),
(250,2,118),
(251,2,119),
(252,2,120),
(253,2,121),
(254,2,122),
(255,2,123),
(256,2,124),
(257,2,125),
(258,2,126),
(259,2,127),
(260,2,128),
(261,2,129),
(262,2,130),
(263,2,131),
(264,2,132),
(1005,2,133),
(1006,2,134),
(1007,2,135),
(1008,2,136),
(1009,2,137),
(1010,2,138),
(1011,2,139),
(1012,2,140),
(1013,2,141),
(1014,2,142),
(1015,2,143),
(1016,2,144),
(1017,2,145),
(1018,2,146),
(1019,2,147),
(1020,2,148),
(1021,2,149),
(1022,2,150),
(1029,2,433),
(1030,2,434),
(1031,2,435),
(1032,2,436),
(2186,4,80),
(283,4,433),
(284,4,434),
(285,4,435),
(286,4,436),
(303,5,19),
(304,5,20),
(305,5,21),
(306,5,22),
(307,5,23),
(308,5,24),
(345,5,25),
(346,5,26),
(347,5,27),
(348,5,28),
(349,5,29),
(350,5,30),
(1789,5,80),
(291,5,133),
(292,5,134),
(293,5,135),
(294,5,136),
(295,5,137),
(296,5,138),
(297,5,139),
(298,5,140),
(299,5,141),
(300,5,142),
(301,5,143),
(302,5,144),
(2154,5,146),
(309,5,433),
(310,5,434),
(311,5,435),
(312,5,436),
(325,6,19),
(326,6,20),
(327,6,21),
(328,6,22),
(329,6,23),
(330,6,24),
(373,6,25),
(374,6,26),
(375,6,27),
(376,6,28),
(377,6,29),
(378,6,30),
(2185,6,80),
(313,6,133),
(314,6,134),
(315,6,135),
(316,6,136),
(317,6,137),
(318,6,138),
(319,6,139),
(320,6,140),
(321,6,141),
(322,6,142),
(323,6,143),
(324,6,144),
(2184,6,146),
(331,6,433),
(332,6,434),
(333,6,435),
(334,6,436);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(6,NULL,'sales','Sales','Access to own leads, deals, contacts, quotations, and inspection requests only',1,'active','2026-03-04 20:19:15','2026-03-04 20:19:15',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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
(6,5,27,'Technical',0,'2026-03-19 13:01:38','2026-03-19 13:01:38',NULL);
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
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES
(1,2,'SUP-MM4PNZIA-D8F68530','Test Supplier',2,'Manufacturing',NULL,NULL,NULL,'0562933755','UAE','Dubai',NULL,NULL,'active','2026-02-27 13:49:55','2026-02-27 13:49:55',NULL,'organization',NULL),
(2,2,'SUP-MMDDDO7H-62F98466','Prasad N',19,NULL,'',NULL,'prasadn@gmail.com',NULL,'UAE','Dubai','morocco',NULL,'active','2026-03-05 15:15:54','2026-03-06 09:46:31','2026-03-06 09:46:31','individual',NULL),
(3,2,'SUP-MMI2773V-8943B772','Pfizer',31,'Hospitality',NULL,NULL,'Pfizer@gmail.com','732469234','UAE','Abu Dhabi','mussafah',NULL,'active','2026-03-08 22:01:47','2026-03-08 22:01:47',NULL,'organization',NULL),
(4,2,'SUP-MMJ19X4V-B1D03AC7','SHOBA',NULL,'Construction',NULL,NULL,'shobagroups@gmail.com','3425545','UAE','Dubai','Dubai',NULL,'active','2026-03-09 14:23:41','2026-03-09 14:23:41',NULL,'organization',NULL),
(5,2,'SUP-MMJ1BOIY-0F75D307','test vendor123',27,'Manufacturing','',NULL,'test@gmail.com','6456465456','UAE','Dubai','asdfghjk',NULL,'active','2026-03-09 14:25:03','2026-03-19 13:01:38',NULL,'organization','55555555'),
(6,2,'SUP-MMKDE0KD-126C768F','EvoGreen',35,'Environmental Services','https://www.evogreen.com',NULL,'abc@evogreen.com','042232322','UAE','Sharjah','17th Street, Sharjah',NULL,'active','2026-03-10 12:50:33','2026-03-10 12:50:33',NULL,'organization',NULL);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
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
(2,'ClearEarth ERP','ClearEarth LLC','admin@clearearth.com','','','','UAE','','','',NULL,'active','basic',NULL,NULL,'{}','2026-02-22 11:34:40','2026-03-19 13:35:49',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terms_and_conditions`
--

LOCK TABLES `terms_and_conditions` WRITE;
/*!40000 ALTER TABLE `terms_and_conditions` DISABLE KEYS */;
INSERT INTO `terms_and_conditions` VALUES
(1,2,'Updated Standard Terms','These are the standard terms and conditions for all deals.','Standard',0,'active','2026-02-24 11:02:14','2026-03-10 12:58:20'),
(2,2,'Expiry Date','Expiry: 30 Days','Service',1,'active','2026-03-10 12:58:20','2026-03-10 12:58:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,1,1,NULL,'admin','admin@demo.com','$2a$10$sMg04Eri.xz1jIy4bEDEBuNeuJ1wiiS0y.4S13G8/6mREOt730LUy','Admin','User','+971501234567',NULL,'active','2026-02-14 00:53:38',NULL,NULL,NULL,'2026-02-13 23:32:05',0,NULL,'2026-02-13 23:32:05','2026-02-14 00:53:38',NULL),
(2,2,1,NULL,'admin','admin@clearearth.com','$2a$10$K1YXsNV2FDONsiwY2REA4OL1PyWXUDueNi2RB1YCXc8Nqb4n.fqza','Admin','User',NULL,NULL,'active','2026-03-23 12:46:17',NULL,NULL,NULL,NULL,0,NULL,'2026-02-22 11:34:41','2026-03-23 12:46:17',NULL),
(3,1,3,NULL,'superadmin','superadmin@clearearth.com','$2a$10$3hgq//t3NIMkjVIoiFBYJuUyfjIQkGkeEhN2nSEJFnPaPNekUCzhe','Super','Admin',NULL,NULL,'active',NULL,NULL,NULL,NULL,'2026-03-04 20:19:15',0,NULL,'2026-03-04 20:19:15','2026-03-04 20:19:15',NULL),
(4,2,5,NULL,'salesmanager','salesmanager@clearearth.com','$2a$10$ziF2lHt8tcLFrv/wZIykZeA6fp0.eC6bEhHBMCRYyP.WzDOJXGBWG','Sales','Manager',NULL,NULL,'active','2026-03-08 15:54:07',NULL,NULL,NULL,'2026-03-04 20:27:59',0,NULL,'2026-03-04 20:27:59','2026-03-08 15:54:07',NULL),
(5,2,4,NULL,'inspection','inspection@clearearth.com','$2a$10$ziF2lHt8tcLFrv/wZIykZeA6fp0.eC6bEhHBMCRYyP.WzDOJXGBWG','Inspection','User',NULL,NULL,'active','2026-03-08 22:18:47',NULL,NULL,NULL,'2026-03-04 20:27:59',0,NULL,'2026-03-04 20:27:59','2026-03-08 22:18:47',NULL),
(6,2,6,NULL,'sales','sales@clearearth.com','$2a$10$ziF2lHt8tcLFrv/wZIykZeA6fp0.eC6bEhHBMCRYyP.WzDOJXGBWG','Sales','Representative',NULL,NULL,'active','2026-03-19 13:09:03',NULL,NULL,NULL,'2026-03-04 20:27:59',0,NULL,'2026-03-04 20:27:59','2026-03-19 13:09:03',NULL),
(7,2,4,NULL,'newinspection','newinspection@gmail.com','$2a$10$GdA3XE/cTqU42fdDqbbMLeNELD/snvcGGSBIISkQYikzHRVpWkDZm','jameel','saleem','1234567890',NULL,'active','2026-03-08 14:54:16',NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 14:53:53','2026-03-08 15:51:52','2026-03-08 15:51:52'),
(8,2,6,NULL,'sales2','sales2@gmail.com','$2a$10$aRld1JOmKjCAxC2F8ndRpuvbL1/HzT80xB0wUFznMpBVFuSUx61pO','sales2','sales',NULL,NULL,'active',NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 15:36:20','2026-03-08 15:51:44','2026-03-08 15:51:44'),
(10,2,6,NULL,'sales3','sales3@gmail.com','$2a$10$0pvEO2Zpj77Igq5zUCVT7OeDwGhe62bNIHGDloo1MkTACYi0thYRC','sales','3',NULL,NULL,'active','2026-03-08 15:58:49',NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 15:53:11','2026-03-08 15:58:49',NULL),
(11,2,4,NULL,'inspection3','inspection3@gmail.com','$2a$10$3dHV3dypUiXJHbqT8hwPs.aGdyzTFewFgKN5DETj6t.xeZ1a8mHta','inspection','3',NULL,NULL,'active','2026-03-08 16:23:49',NULL,NULL,NULL,NULL,0,NULL,'2026-03-08 15:53:41','2026-03-08 16:23:49',NULL),
(12,2,2,NULL,'test','test@gmail.com','$2a$10$y8CZbuGkx5r5agRxFo2Hguc8WogpNuIqhiIb/1VFSQll3hWX4jETq','Alisha','Sk',NULL,NULL,'suspended',NULL,NULL,NULL,NULL,NULL,0,NULL,'2026-03-19 13:33:16','2026-03-19 13:33:45',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'clearearth_erp'
--

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

-- Dump completed on 2026-03-24  6:20:17
