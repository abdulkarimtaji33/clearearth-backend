-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 23, 2026 at 03:37 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `clearearth_erp`
--

-- --------------------------------------------------------

--
-- Table structure for table `asset_custody`
--

CREATE TABLE `asset_custody` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `tenant_id`, `company_code`, `company_name`, `primary_contact_id`, `industry_type`, `website`, `industry_type_id`, `email`, `phone`, `country`, `city`, `address`, `notes`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 'COM-MLY4IEZS-89D5EC25', 'Knapp Oneill Trading', NULL, NULL, 'https://www.fywirip.tv', NULL, 'wyfewivyt@mailinator.com', '+1 (324) 369-5819', 'Placeat doloremque ', 'Ducimus ut saepe ci', 'Obcaecati vel incidi', NULL, 'active', '2026-02-22 23:11:06', '2026-02-22 23:11:06', NULL),
(2, 2, 'COM-MLY4KU7W-4BC889FD', 'Harding Small Co', 1, 'Technology', 'https://www.marycicy.org.au', NULL, 'tysyfudi@mailinator.com', '+1 (141) 105-2988', 'Aliquam voluptates s', 'Est expedita est ni', 'Proident aspernatur', 'Officia obcaecati ut', 'active', '2026-02-22 23:12:59', '2026-02-22 23:13:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `company_contacts`
--

CREATE TABLE `company_contacts` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `contact_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL COMMENT 'e.g. Sales, Finance, HR, Operations',
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_contacts`
--

INSERT INTO `company_contacts` (`id`, `company_id`, `contact_id`, `role`, `is_primary`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 1, 'Sales', 0, '2026-02-22 23:12:59', '2026-02-22 23:12:59', '2026-02-22 23:13:31');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `contact_code` varchar(50) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `designation` varchar(150) DEFAULT NULL COMMENT 'Job title or designation',
  `company_id` int(11) DEFAULT NULL COMMENT 'Optional company association',
  `designation_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `tenant_id`, `contact_code`, `first_name`, `last_name`, `email`, `phone`, `mobile`, `job_title`, `department`, `notes`, `status`, `created_at`, `updated_at`, `deleted_at`, `designation`, `company_id`, `designation_id`) VALUES
(1, 2, 'CON-MLY4IN2O-FBD838BC', 'Elizabeth', 'Contreras', 'wopy@mailinator.com', '+1 (883) 267-9465', 'Voluptas aut eiusmod', NULL, 'Nostrum dicta magni ', 'Magni exercitation e', 'active', '2026-02-22 23:11:17', '2026-02-22 23:11:17', NULL, 'Dolor in voluptatem ', 1, NULL),
(2, 2, 'CON-MLY7ZI65-89CD6904', 'Bethany', 'French', 'raqexoqyr@mailinator.com', '+1 (204) 445-4255', 'Vel temporibus natus', NULL, 'Consectetur odit lib', 'Dolores voluptas asp', 'active', '2026-02-23 00:48:22', '2026-02-23 00:48:22', NULL, NULL, 2, NULL),
(3, 2, 'CON-MLYAZWIE-0044E9FD', 'saleem', 'javed', NULL, '12345678', NULL, NULL, NULL, NULL, 'active', '2026-02-23 02:12:40', '2026-02-23 02:12:40', NULL, 'Managing Director', 2, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `contact_roles`
--

CREATE TABLE `contact_roles` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contact_roles`
--

INSERT INTO `contact_roles` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Sales', 'Sales', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'Finance', 'Finance', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'HR', 'HR', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'Operations', 'Operations', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'Technical', 'Technical', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'Management', 'Management', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'Other', 'Other', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'UAE', 'United Arab Emirates', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `deals`
--

CREATE TABLE `deals` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deal_items`
--

CREATE TABLE `deal_items` (
  `id` int(11) NOT NULL,
  `deal_id` int(11) NOT NULL,
  `product_service_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(15,2) NOT NULL COMMENT 'Price per unit at time of deal',
  `line_total` decimal(15,2) NOT NULL COMMENT 'quantity * unit_price',
  `notes` text DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `deal_statuses`
--

CREATE TABLE `deal_statuses` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deal_statuses`
--

INSERT INTO `deal_statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'draft', 'Draft', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'pending', 'Pending Approval', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'approved', 'Approved', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'in_progress', 'In Progress', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'completed', 'Completed', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'cancelled', 'Cancelled', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `deal_types`
--

CREATE TABLE `deal_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `deal_types`
--

INSERT INTO `deal_types` (`id`, `name`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'New Business', 'New customer acquisition', 1, 1, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(2, 'Renewal', 'Contract renewal', 1, 2, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(3, 'Upsell', 'Additional services to existing customer', 1, 3, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(4, 'Cross-sell', 'Different services to existing customer', 1, 4, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `designations`
--

CREATE TABLE `designations` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `designations`
--

INSERT INTO `designations` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'CEO', 'CEO', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'Managing Director', 'Managing Director', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'Director', 'Director', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'General Manager', 'General Manager', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'Manager', 'Manager', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'Assistant Manager', 'Assistant Manager', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'Senior Executive', 'Senior Executive', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(8, 'Executive', 'Executive', 8, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(9, 'Officer', 'Officer', 9, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(10, 'Coordinator', 'Coordinator', 10, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(11, 'Supervisor', 'Supervisor', 11, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(12, 'Team Leader', 'Team Leader', 12, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(13, 'Specialist', 'Specialist', 13, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(14, 'Consultant', 'Consultant', 14, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(15, 'Engineer', 'Engineer', 15, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(16, 'Technician', 'Technician', 16, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(17, 'Administrator', 'Administrator', 17, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(18, 'Accountant', 'Accountant', 18, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(19, 'Other', 'Other', 19, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `industry_types`
--

CREATE TABLE `industry_types` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `industry_types`
--

INSERT INTO `industry_types` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Technology', 'Technology', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'Manufacturing', 'Manufacturing', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'Retail', 'Retail', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'Healthcare', 'Healthcare', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'Finance', 'Finance', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'Construction', 'Construction', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'Education', 'Education', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(8, 'Transportation & Logistics', 'Transportation & Logistics', 8, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(9, 'Energy', 'Energy', 9, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(10, 'Real Estate', 'Real Estate', 10, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(11, 'Hospitality', 'Hospitality', 11, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(12, 'Agriculture', 'Agriculture', 12, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(13, 'Environmental Services', 'Environmental Services', 13, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(14, 'Other', 'Other', 14, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `material_type_id` int(11) NOT NULL,
  `total_quantity` decimal(15,2) DEFAULT 0.00,
  `unit_of_measure` varchar(20) DEFAULT 'kg',
  `total_value` decimal(15,2) DEFAULT 0.00,
  `last_updated` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
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
  `product_service_id` int(11) DEFAULT NULL COMMENT 'Link to product/service'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `tenant_id`, `lead_number`, `email`, `phone`, `source`, `service_interest`, `estimated_value`, `notes`, `assigned_to`, `status`, `qualification_notes`, `disqualification_reason`, `converted_at`, `created_at`, `updated_at`, `deleted_at`, `company_id`, `contact_id`, `lead_source_id`, `service_type_id`, `product_service_id`) VALUES
(1, 2, 'LEAD-MLY61TE8-CA1C4AA1', 'tymecireqi@mailinator.com', '+1 (242) 972-8153', 'Website', '[\"Waste Collection\"]', '555000.00', 'Adipisci incidunt e', NULL, 'new', NULL, NULL, NULL, '2026-02-22 23:54:11', '2026-02-23 00:08:33', NULL, 2, 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `lead_sources`
--

CREATE TABLE `lead_sources` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `lead_sources`
--

INSERT INTO `lead_sources` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Website', 'Website', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'Referral', 'Referral', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'Cold Call', 'Cold Call', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'Email', 'Email', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'Social Media', 'Social Media', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'Trade Show', 'Trade Show', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'Advertisement', 'Advertisement', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(8, 'Partner', 'Partner', 8, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(9, 'Other', 'Other', 9, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `migration_history`
--

CREATE TABLE `migration_history` (
  `id` int(11) NOT NULL,
  `migration_name` varchar(255) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migration_history`
--

INSERT INTO `migration_history` (`id`, `migration_name`, `applied_at`) VALUES
(1, '20260223000000-initial-schema.js', '2026-02-22 21:40:11'),
(2, '20260223000001-drop-deals-create-dropdowns.js', '2026-02-22 21:40:35'),
(3, '20260223000002-create-products-services.js', '2026-02-22 21:40:36'),
(4, '20260223000003-create-deals.js', '2026-02-22 21:40:36'),
(5, '20260223100000-create-separate-dropdown-tables.js', '2026-02-22 22:06:13'),
(6, '20260223110000-add-product-type.js', '2026-02-23 14:04:27'),
(7, '20260223120000-add-dynamic-categories.js', '2026-02-23 14:07:21');

-- --------------------------------------------------------

--
-- Table structure for table `payment_statuses`
--

CREATE TABLE `payment_statuses` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_statuses`
--

INSERT INTO `payment_statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'unpaid', 'Unpaid', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'partial', 'Partially Paid', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'paid', 'Fully Paid', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL COMMENT 'e.g., clients.create, deals.update, invoices.delete',
  `display_name` varchar(100) NOT NULL,
  `module` enum('users','roles','contacts','companies','suppliers','leads','products','deals') DEFAULT NULL,
  `action` enum('create','read','update','delete','approve','export') NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `display_name`, `module`, `action`, `description`) VALUES
(1, 'dashboard.create', 'Create Dashboard', '', 'create', 'Permission to create dashboard'),
(2, 'dashboard.read', 'Read Dashboard', '', 'read', 'Permission to read dashboard'),
(3, 'dashboard.update', 'Update Dashboard', '', 'update', 'Permission to update dashboard'),
(4, 'dashboard.delete', 'Delete Dashboard', '', 'delete', 'Permission to delete dashboard'),
(5, 'dashboard.approve', 'Approve Dashboard', '', 'approve', 'Permission to approve dashboard'),
(6, 'dashboard.export', 'Export Dashboard', '', 'export', 'Permission to export dashboard'),
(7, 'clients.create', 'Create Clients', '', 'create', 'Permission to create clients'),
(8, 'clients.read', 'Read Clients', '', 'read', 'Permission to read clients'),
(9, 'clients.update', 'Update Clients', '', 'update', 'Permission to update clients'),
(10, 'clients.delete', 'Delete Clients', '', 'delete', 'Permission to delete clients'),
(11, 'clients.approve', 'Approve Clients', '', 'approve', 'Permission to approve clients'),
(12, 'clients.export', 'Export Clients', '', 'export', 'Permission to export clients'),
(13, 'vendors.create', 'Create Vendors', '', 'create', 'Permission to create vendors'),
(14, 'vendors.read', 'Read Vendors', '', 'read', 'Permission to read vendors'),
(15, 'vendors.update', 'Update Vendors', '', 'update', 'Permission to update vendors'),
(16, 'vendors.delete', 'Delete Vendors', '', 'delete', 'Permission to delete vendors'),
(17, 'vendors.approve', 'Approve Vendors', '', 'approve', 'Permission to approve vendors'),
(18, 'vendors.export', 'Export Vendors', '', 'export', 'Permission to export vendors'),
(19, 'leads.create', 'Create Leads', 'leads', 'create', 'Permission to create leads'),
(20, 'leads.read', 'Read Leads', 'leads', 'read', 'Permission to read leads'),
(21, 'leads.update', 'Update Leads', 'leads', 'update', 'Permission to update leads'),
(22, 'leads.delete', 'Delete Leads', 'leads', 'delete', 'Permission to delete leads'),
(23, 'leads.approve', 'Approve Leads', 'leads', 'approve', 'Permission to approve leads'),
(24, 'leads.export', 'Export Leads', 'leads', 'export', 'Permission to export leads'),
(25, 'deals.create', 'Create Deals', '', 'create', 'Permission to create deals'),
(26, 'deals.read', 'Read Deals', '', 'read', 'Permission to read deals'),
(27, 'deals.update', 'Update Deals', '', 'update', 'Permission to update deals'),
(28, 'deals.delete', 'Delete Deals', '', 'delete', 'Permission to delete deals'),
(29, 'deals.approve', 'Approve Deals', '', 'approve', 'Permission to approve deals'),
(30, 'deals.export', 'Export Deals', '', 'export', 'Permission to export deals'),
(31, 'products.create', 'Create Products', '', 'create', 'Permission to create products'),
(32, 'products.read', 'Read Products', '', 'read', 'Permission to read products'),
(33, 'products.update', 'Update Products', '', 'update', 'Permission to update products'),
(34, 'products.delete', 'Delete Products', '', 'delete', 'Permission to delete products'),
(35, 'products.approve', 'Approve Products', '', 'approve', 'Permission to approve products'),
(36, 'products.export', 'Export Products', '', 'export', 'Permission to export products'),
(37, 'services.create', 'Create Services', '', 'create', 'Permission to create services'),
(38, 'services.read', 'Read Services', '', 'read', 'Permission to read services'),
(39, 'services.update', 'Update Services', '', 'update', 'Permission to update services'),
(40, 'services.delete', 'Delete Services', '', 'delete', 'Permission to delete services'),
(41, 'services.approve', 'Approve Services', '', 'approve', 'Permission to approve services'),
(42, 'services.export', 'Export Services', '', 'export', 'Permission to export services'),
(43, 'accounting.create', 'Create Accounting', '', 'create', 'Permission to create accounting'),
(44, 'accounting.read', 'Read Accounting', '', 'read', 'Permission to read accounting'),
(45, 'accounting.update', 'Update Accounting', '', 'update', 'Permission to update accounting'),
(46, 'accounting.delete', 'Delete Accounting', '', 'delete', 'Permission to delete accounting'),
(47, 'accounting.approve', 'Approve Accounting', '', 'approve', 'Permission to approve accounting'),
(48, 'accounting.export', 'Export Accounting', '', 'export', 'Permission to export accounting'),
(49, 'commissions.create', 'Create Commissions', '', 'create', 'Permission to create commissions'),
(50, 'commissions.read', 'Read Commissions', '', 'read', 'Permission to read commissions'),
(51, 'commissions.update', 'Update Commissions', '', 'update', 'Permission to update commissions'),
(52, 'commissions.delete', 'Delete Commissions', '', 'delete', 'Permission to delete commissions'),
(53, 'commissions.approve', 'Approve Commissions', '', 'approve', 'Permission to approve commissions'),
(54, 'commissions.export', 'Export Commissions', '', 'export', 'Permission to export commissions'),
(55, 'documents.create', 'Create Documents', '', 'create', 'Permission to create documents'),
(56, 'documents.read', 'Read Documents', '', 'read', 'Permission to read documents'),
(57, 'documents.update', 'Update Documents', '', 'update', 'Permission to update documents'),
(58, 'documents.delete', 'Delete Documents', '', 'delete', 'Permission to delete documents'),
(59, 'documents.approve', 'Approve Documents', '', 'approve', 'Permission to approve documents'),
(60, 'documents.export', 'Export Documents', '', 'export', 'Permission to export documents'),
(61, 'operations.create', 'Create Operations', '', 'create', 'Permission to create operations'),
(62, 'operations.read', 'Read Operations', '', 'read', 'Permission to read operations'),
(63, 'operations.update', 'Update Operations', '', 'update', 'Permission to update operations'),
(64, 'operations.delete', 'Delete Operations', '', 'delete', 'Permission to delete operations'),
(65, 'operations.approve', 'Approve Operations', '', 'approve', 'Permission to approve operations'),
(66, 'operations.export', 'Export Operations', '', 'export', 'Permission to export operations'),
(67, 'reports.create', 'Create Reports', '', 'create', 'Permission to create reports'),
(68, 'reports.read', 'Read Reports', '', 'read', 'Permission to read reports'),
(69, 'reports.update', 'Update Reports', '', 'update', 'Permission to update reports'),
(70, 'reports.delete', 'Delete Reports', '', 'delete', 'Permission to delete reports'),
(71, 'reports.approve', 'Approve Reports', '', 'approve', 'Permission to approve reports'),
(72, 'reports.export', 'Export Reports', '', 'export', 'Permission to export reports'),
(73, 'settings.create', 'Create Settings', '', 'create', 'Permission to create settings'),
(74, 'settings.read', 'Read Settings', '', 'read', 'Permission to read settings'),
(75, 'settings.update', 'Update Settings', '', 'update', 'Permission to update settings'),
(76, 'settings.delete', 'Delete Settings', '', 'delete', 'Permission to delete settings'),
(77, 'settings.approve', 'Approve Settings', '', 'approve', 'Permission to approve settings'),
(78, 'settings.export', 'Export Settings', '', 'export', 'Permission to export settings'),
(79, 'users.create', 'Create Users', 'users', 'create', 'Permission to create users'),
(80, 'users.read', 'Read Users', 'users', 'read', 'Permission to read users'),
(81, 'users.update', 'Update Users', 'users', 'update', 'Permission to update users'),
(82, 'users.delete', 'Delete Users', 'users', 'delete', 'Permission to delete users'),
(83, 'users.approve', 'Approve Users', 'users', 'approve', 'Permission to approve users'),
(84, 'users.export', 'Export Users', 'users', 'export', 'Permission to export users'),
(85, 'masters.create', 'Create Masters', '', 'create', 'Permission to create masters'),
(86, 'masters.read', 'Read Masters', '', 'read', 'Permission to read masters'),
(87, 'masters.update', 'Update Masters', '', 'update', 'Permission to update masters'),
(88, 'masters.delete', 'Delete Masters', '', 'delete', 'Permission to delete masters'),
(89, 'masters.approve', 'Approve Masters', '', 'approve', 'Permission to approve masters'),
(90, 'masters.export', 'Export Masters', '', 'export', 'Permission to export masters'),
(91, 'certificates.create', 'Create Certificates', '', 'create', 'Permission to create certificates'),
(92, 'certificates.read', 'Read Certificates', '', 'read', 'Permission to read certificates'),
(93, 'certificates.update', 'Update Certificates', '', 'update', 'Permission to update certificates'),
(94, 'certificates.delete', 'Delete Certificates', '', 'delete', 'Permission to delete certificates'),
(95, 'certificates.approve', 'Approve Certificates', '', 'approve', 'Permission to approve certificates'),
(96, 'certificates.export', 'Export Certificates', '', 'export', 'Permission to export certificates'),
(97, 'fleets.create', 'Create Fleets', '', 'create', 'Permission to create fleets'),
(98, 'fleets.read', 'Read Fleets', '', 'read', 'Permission to read fleets'),
(99, 'fleets.update', 'Update Fleets', '', 'update', 'Permission to update fleets'),
(100, 'fleets.delete', 'Delete Fleets', '', 'delete', 'Permission to delete fleets'),
(101, 'fleets.approve', 'Approve Fleets', '', 'approve', 'Permission to approve fleets'),
(102, 'fleets.export', 'Export Fleets', '', 'export', 'Permission to export fleets'),
(103, 'hr.create', 'Create Hr', '', 'create', 'Permission to create hr'),
(104, 'hr.read', 'Read Hr', '', 'read', 'Permission to read hr'),
(105, 'hr.update', 'Update Hr', '', 'update', 'Permission to update hr'),
(106, 'hr.delete', 'Delete Hr', '', 'delete', 'Permission to delete hr'),
(107, 'hr.approve', 'Approve Hr', '', 'approve', 'Permission to approve hr'),
(108, 'hr.export', 'Export Hr', '', 'export', 'Permission to export hr'),
(109, 'payroll.create', 'Create Payroll', '', 'create', 'Permission to create payroll'),
(110, 'payroll.read', 'Read Payroll', '', 'read', 'Permission to read payroll'),
(111, 'payroll.update', 'Update Payroll', '', 'update', 'Permission to update payroll'),
(112, 'payroll.delete', 'Delete Payroll', '', 'delete', 'Permission to delete payroll'),
(113, 'payroll.approve', 'Approve Payroll', '', 'approve', 'Permission to approve payroll'),
(114, 'payroll.export', 'Export Payroll', '', 'export', 'Permission to export payroll'),
(115, 'inbound.create', 'Create Inbound', '', 'create', 'Permission to create inbound'),
(116, 'inbound.read', 'Read Inbound', '', 'read', 'Permission to read inbound'),
(117, 'inbound.update', 'Update Inbound', '', 'update', 'Permission to update inbound'),
(118, 'inbound.delete', 'Delete Inbound', '', 'delete', 'Permission to delete inbound'),
(119, 'inbound.approve', 'Approve Inbound', '', 'approve', 'Permission to approve inbound'),
(120, 'inbound.export', 'Export Inbound', '', 'export', 'Permission to export inbound'),
(121, 'inventory.create', 'Create Inventory', '', 'create', 'Permission to create inventory'),
(122, 'inventory.read', 'Read Inventory', '', 'read', 'Permission to read inventory'),
(123, 'inventory.update', 'Update Inventory', '', 'update', 'Permission to update inventory'),
(124, 'inventory.delete', 'Delete Inventory', '', 'delete', 'Permission to delete inventory'),
(125, 'inventory.approve', 'Approve Inventory', '', 'approve', 'Permission to approve inventory'),
(126, 'inventory.export', 'Export Inventory', '', 'export', 'Permission to export inventory'),
(127, 'outbound.create', 'Create Outbound', '', 'create', 'Permission to create outbound'),
(128, 'outbound.read', 'Read Outbound', '', 'read', 'Permission to read outbound'),
(129, 'outbound.update', 'Update Outbound', '', 'update', 'Permission to update outbound'),
(130, 'outbound.delete', 'Delete Outbound', '', 'delete', 'Permission to delete outbound'),
(131, 'outbound.approve', 'Approve Outbound', '', 'approve', 'Permission to approve outbound'),
(132, 'outbound.export', 'Export Outbound', '', 'export', 'Permission to export outbound'),
(133, 'contacts.create', 'Create Contacts', 'contacts', 'create', 'Permission to create contacts'),
(134, 'contacts.read', 'Read Contacts', 'contacts', 'read', 'Permission to read contacts'),
(135, 'contacts.update', 'Update Contacts', 'contacts', 'update', 'Permission to update contacts'),
(136, 'contacts.delete', 'Delete Contacts', 'contacts', 'delete', 'Permission to delete contacts'),
(137, 'contacts.approve', 'Approve Contacts', 'contacts', 'approve', 'Permission to approve contacts'),
(138, 'contacts.export', 'Export Contacts', 'contacts', 'export', 'Permission to export contacts'),
(139, 'companies.create', 'Create Companies', 'companies', 'create', 'Permission to create companies'),
(140, 'companies.read', 'Read Companies', 'companies', 'read', 'Permission to read companies'),
(141, 'companies.update', 'Update Companies', 'companies', 'update', 'Permission to update companies'),
(142, 'companies.delete', 'Delete Companies', 'companies', 'delete', 'Permission to delete companies'),
(143, 'companies.approve', 'Approve Companies', 'companies', 'approve', 'Permission to approve companies'),
(144, 'companies.export', 'Export Companies', 'companies', 'export', 'Permission to export companies'),
(145, 'suppliers.create', 'Create Suppliers', 'suppliers', 'create', 'Permission to create suppliers'),
(146, 'suppliers.read', 'Read Suppliers', 'suppliers', 'read', 'Permission to read suppliers'),
(147, 'suppliers.update', 'Update Suppliers', 'suppliers', 'update', 'Permission to update suppliers'),
(148, 'suppliers.delete', 'Delete Suppliers', 'suppliers', 'delete', 'Permission to delete suppliers'),
(149, 'suppliers.approve', 'Approve Suppliers', 'suppliers', 'approve', 'Permission to approve suppliers'),
(150, 'suppliers.export', 'Export Suppliers', 'suppliers', 'export', 'Permission to export suppliers');

-- --------------------------------------------------------

--
-- Table structure for table `products_services`
--

CREATE TABLE `products_services` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products_services`
--

INSERT INTO `products_services` (`id`, `tenant_id`, `name`, `type`, `category`, `description`, `unit_of_measure`, `price`, `currency`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 2, 'Test Product', 'product', 'Recycling', 'Test product for QA', NULL, '100.00', 'AED', 'active', '2026-02-23 01:52:41', '2026-02-23 01:52:41', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_categories`
--

CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_categories`
--

INSERT INTO `product_categories` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Waste Collection', 'Waste Collection', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'Recycling', 'Recycling', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'Disposal', 'Disposal', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'ITAD Services', 'ITAD Services', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'Hazardous Waste', 'Hazardous Waste', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'Consulting', 'Consulting', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'Equipment Rental', 'Equipment Rental', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(8, 'Other', 'Other', 8, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL COMMENT 'Null for system roles, tenant_id for custom roles',
  `name` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system_role` tinyint(1) DEFAULT 0 COMMENT 'System roles cannot be deleted',
  `status` enum('active','inactive','pending','approved','rejected','deleted') DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `tenant_id`, `name`, `display_name`, `description`, `is_system_role`, `status`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'tenant_admin', 'Tenant Administrator', 'Full access to tenant resources', 1, 'active', '2026-02-13 23:32:05', '2026-02-13 23:32:05', NULL),
(2, 2, 'admin', 'Administrator', 'Full access', 0, 'active', '2026-02-22 11:34:40', '2026-02-22 11:34:40', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_id`, `permission_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
(5, 1, 5),
(6, 1, 6),
(7, 1, 7),
(8, 1, 8),
(9, 1, 9),
(10, 1, 10),
(11, 1, 11),
(12, 1, 12),
(13, 1, 13),
(14, 1, 14),
(15, 1, 15),
(16, 1, 16),
(17, 1, 17),
(18, 1, 18),
(19, 1, 19),
(20, 1, 20),
(21, 1, 21),
(22, 1, 22),
(23, 1, 23),
(24, 1, 24),
(25, 1, 25),
(26, 1, 26),
(27, 1, 27),
(28, 1, 28),
(29, 1, 29),
(30, 1, 30),
(31, 1, 31),
(32, 1, 32),
(33, 1, 33),
(34, 1, 34),
(35, 1, 35),
(36, 1, 36),
(37, 1, 37),
(38, 1, 38),
(39, 1, 39),
(40, 1, 40),
(41, 1, 41),
(42, 1, 42),
(43, 1, 43),
(44, 1, 44),
(45, 1, 45),
(46, 1, 46),
(47, 1, 47),
(48, 1, 48),
(49, 1, 49),
(50, 1, 50),
(51, 1, 51),
(52, 1, 52),
(53, 1, 53),
(54, 1, 54),
(55, 1, 55),
(56, 1, 56),
(57, 1, 57),
(58, 1, 58),
(59, 1, 59),
(60, 1, 60),
(61, 1, 61),
(62, 1, 62),
(63, 1, 63),
(64, 1, 64),
(65, 1, 65),
(66, 1, 66),
(67, 1, 67),
(68, 1, 68),
(69, 1, 69),
(70, 1, 70),
(71, 1, 71),
(72, 1, 72),
(73, 1, 73),
(74, 1, 74),
(75, 1, 75),
(76, 1, 76),
(77, 1, 77),
(78, 1, 78),
(79, 1, 79),
(80, 1, 80),
(81, 1, 81),
(82, 1, 82),
(83, 1, 83),
(84, 1, 84),
(85, 1, 85),
(86, 1, 86),
(87, 1, 87),
(88, 1, 88),
(89, 1, 89),
(90, 1, 90),
(91, 1, 91),
(92, 1, 92),
(93, 1, 93),
(94, 1, 94),
(95, 1, 95),
(96, 1, 96),
(97, 1, 97),
(98, 1, 98),
(99, 1, 99),
(100, 1, 100),
(101, 1, 101),
(102, 1, 102),
(103, 1, 103),
(104, 1, 104),
(105, 1, 105),
(106, 1, 106),
(107, 1, 107),
(108, 1, 108),
(109, 1, 109),
(110, 1, 110),
(111, 1, 111),
(112, 1, 112),
(113, 1, 113),
(114, 1, 114),
(115, 1, 115),
(116, 1, 116),
(117, 1, 117),
(118, 1, 118),
(119, 1, 119),
(120, 1, 120),
(121, 1, 121),
(122, 1, 122),
(123, 1, 123),
(124, 1, 124),
(125, 1, 125),
(126, 1, 126),
(127, 1, 127),
(128, 1, 128),
(129, 1, 129),
(130, 1, 130),
(131, 1, 131),
(132, 1, 132),
(265, 1, 133),
(266, 1, 134),
(267, 1, 135),
(268, 1, 136),
(269, 1, 137),
(270, 1, 138),
(271, 1, 139),
(272, 1, 140),
(273, 1, 141),
(274, 1, 142),
(275, 1, 143),
(276, 1, 144),
(277, 1, 145),
(278, 1, 146),
(279, 1, 147),
(280, 1, 148),
(281, 1, 149),
(282, 1, 150),
(133, 2, 1),
(134, 2, 2),
(135, 2, 3),
(136, 2, 4),
(137, 2, 5),
(138, 2, 6),
(139, 2, 7),
(140, 2, 8),
(141, 2, 9),
(142, 2, 10),
(143, 2, 11),
(144, 2, 12),
(145, 2, 13),
(146, 2, 14),
(147, 2, 15),
(148, 2, 16),
(149, 2, 17),
(150, 2, 18),
(151, 2, 19),
(152, 2, 20),
(153, 2, 21),
(154, 2, 22),
(155, 2, 23),
(156, 2, 24),
(157, 2, 25),
(158, 2, 26),
(159, 2, 27),
(160, 2, 28),
(161, 2, 29),
(162, 2, 30),
(163, 2, 31),
(164, 2, 32),
(165, 2, 33),
(166, 2, 34),
(167, 2, 35),
(168, 2, 36),
(169, 2, 37),
(170, 2, 38),
(171, 2, 39),
(172, 2, 40),
(173, 2, 41),
(174, 2, 42),
(175, 2, 43),
(176, 2, 44),
(177, 2, 45),
(178, 2, 46),
(179, 2, 47),
(180, 2, 48),
(181, 2, 49),
(182, 2, 50),
(183, 2, 51),
(184, 2, 52),
(185, 2, 53),
(186, 2, 54),
(187, 2, 55),
(188, 2, 56),
(189, 2, 57),
(190, 2, 58),
(191, 2, 59),
(192, 2, 60),
(193, 2, 61),
(194, 2, 62),
(195, 2, 63),
(196, 2, 64),
(197, 2, 65),
(198, 2, 66),
(199, 2, 67),
(200, 2, 68),
(201, 2, 69),
(202, 2, 70),
(203, 2, 71),
(204, 2, 72),
(205, 2, 73),
(206, 2, 74),
(207, 2, 75),
(208, 2, 76),
(209, 2, 77),
(210, 2, 78),
(211, 2, 79),
(212, 2, 80),
(213, 2, 81),
(214, 2, 82),
(215, 2, 83),
(216, 2, 84),
(217, 2, 85),
(218, 2, 86),
(219, 2, 87),
(220, 2, 88),
(221, 2, 89),
(222, 2, 90),
(223, 2, 91),
(224, 2, 92),
(225, 2, 93),
(226, 2, 94),
(227, 2, 95),
(228, 2, 96),
(229, 2, 97),
(230, 2, 98),
(231, 2, 99),
(232, 2, 100),
(233, 2, 101),
(234, 2, 102),
(235, 2, 103),
(236, 2, 104),
(237, 2, 105),
(238, 2, 106),
(239, 2, 107),
(240, 2, 108),
(241, 2, 109),
(242, 2, 110),
(243, 2, 111),
(244, 2, 112),
(245, 2, 113),
(246, 2, 114),
(247, 2, 115),
(248, 2, 116),
(249, 2, 117),
(250, 2, 118),
(251, 2, 119),
(252, 2, 120),
(253, 2, 121),
(254, 2, 122),
(255, 2, 123),
(256, 2, 124),
(257, 2, 125),
(258, 2, 126),
(259, 2, 127),
(260, 2, 128),
(261, 2, 129),
(262, 2, 130),
(263, 2, 131),
(264, 2, 132);

-- --------------------------------------------------------

--
-- Table structure for table `sequelizemeta`
--

CREATE TABLE `sequelizemeta` (
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_interests`
--

CREATE TABLE `service_interests` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_interests`
--

INSERT INTO `service_interests` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Waste Collection', 'Waste Collection', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'Recycling', 'Recycling', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'Disposal', 'Disposal', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'ITAD Services', 'ITAD Services', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'Hazardous Waste', 'Hazardous Waste', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'Consulting', 'Consulting', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'Other', 'Other', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `service_types`
--

CREATE TABLE `service_types` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_types`
--

INSERT INTO `service_types` (`id`, `name`, `description`, `is_active`, `sort_order`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Waste Collection', 'Regular waste collection services', 1, 1, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(2, 'Recycling', 'Recycling services for various materials', 1, 2, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(3, 'Disposal', 'Waste disposal services', 1, 3, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(4, 'ITAD Services', 'IT Asset Disposition services', 1, 4, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(5, 'Hazardous Waste', 'Hazardous waste management', 1, 5, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(6, 'Consulting', 'Environmental consulting services', 1, 6, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL),
(7, 'Other', 'Other services', 1, 7, '2026-02-23 00:11:44', '2026-02-23 00:11:44', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `statuses`
--

CREATE TABLE `statuses` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `statuses`
--

INSERT INTO `statuses` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'active', 'Active', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'inactive', 'Inactive', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supplier_contacts`
--

CREATE TABLE `supplier_contacts` (
  `id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `contact_id` int(11) NOT NULL,
  `role` varchar(100) DEFAULT NULL COMMENT 'e.g. Sales, Finance, HR, Operations',
  `is_primary` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`id`, `name`, `company_name`, `email`, `phone`, `address`, `city`, `country`, `trn_number`, `vat_registration_number`, `license_number`, `logo`, `status`, `subscription_plan`, `subscription_start_date`, `subscription_end_date`, `settings`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Demo Company', 'Demo Company LLC', 'admin@demo.com', '+971501234567', NULL, NULL, 'UAE', NULL, NULL, NULL, NULL, 'active', 'basic', '2026-02-13 23:32:05', NULL, '{}', '2026-02-13 23:32:05', '2026-02-13 23:32:05', NULL),
(2, 'ClearEarth ERP', 'ClearEarth LLC', 'admin@clearearth.com', NULL, NULL, NULL, 'UAE', NULL, NULL, NULL, NULL, 'active', 'basic', NULL, NULL, '{}', '2026-02-22 11:34:40', '2026-02-22 11:34:40', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `uae_cities`
--

CREATE TABLE `uae_cities` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `uae_cities`
--

INSERT INTO `uae_cities` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Dubai', 'Dubai', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'Abu Dhabi', 'Abu Dhabi', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'Sharjah', 'Sharjah', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'Ajman', 'Ajman', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'Ras Al Khaimah', 'Ras Al Khaimah', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'Fujairah', 'Fujairah', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'Umm Al Quwain', 'Umm Al Quwain', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(8, 'Al Ain', 'Al Ain', 8, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `units_of_measure`
--

CREATE TABLE `units_of_measure` (
  `id` int(11) NOT NULL,
  `value` varchar(100) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `units_of_measure`
--

INSERT INTO `units_of_measure` (`id`, `value`, `display_name`, `display_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'kg', 'Kilograms (kg)', 1, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(2, 'ton', 'Tons (ton)', 2, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(3, 'piece', 'Piece (pc)', 3, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(4, 'hour', 'Hour (hr)', 4, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(5, 'day', 'Day', 5, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(6, 'month', 'Month', 6, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(7, 'unit', 'Unit', 7, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13'),
(8, 'service', 'Service', 8, 1, '2026-02-22 22:06:13', '2026-02-22 22:06:13');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
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
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `role_id`, `employee_id`, `username`, `email`, `password`, `first_name`, `last_name`, `phone`, `avatar`, `status`, `last_login_at`, `last_login_ip`, `password_reset_token`, `password_reset_expires`, `email_verified_at`, `two_factor_enabled`, `two_factor_secret`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 1, NULL, 'admin', 'admin@demo.com', '$2a$10$sMg04Eri.xz1jIy4bEDEBuNeuJ1wiiS0y.4S13G8/6mREOt730LUy', 'Admin', 'User', '+971501234567', NULL, 'active', '2026-02-14 00:53:38', NULL, NULL, NULL, '2026-02-13 23:32:05', 0, NULL, '2026-02-13 23:32:05', '2026-02-14 00:53:38', NULL),
(2, 2, 1, NULL, 'admin', 'admin@clearearth.com', '$2a$10$K1YXsNV2FDONsiwY2REA4OL1PyWXUDueNi2RB1YCXc8Nqb4n.fqza', 'Admin', 'User', NULL, NULL, 'active', '2026-02-23 02:08:42', NULL, NULL, NULL, NULL, 0, NULL, '2026-02-22 11:34:41', '2026-02-23 02:08:42', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `asset_custody`
--
ALTER TABLE `asset_custody`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_custody_tenant_id` (`tenant_id`),
  ADD KEY `asset_custody_employee_id` (`employee_id`),
  ADD KEY `asset_custody_asset_code` (`asset_code`),
  ADD KEY `asset_custody_is_returned` (`is_returned`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_tenant_id` (`tenant_id`),
  ADD KEY `audit_logs_user_id` (`user_id`),
  ADD KEY `audit_logs_module` (`module`),
  ADD KEY `audit_logs_action` (`action`),
  ADD KEY `audit_logs_record_id` (`record_id`),
  ADD KEY `audit_logs_created_at` (`created_at`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `company_code` (`company_code`),
  ADD UNIQUE KEY `companies_company_code` (`company_code`),
  ADD UNIQUE KEY `company_code_2` (`company_code`),
  ADD UNIQUE KEY `company_code_3` (`company_code`),
  ADD UNIQUE KEY `company_code_4` (`company_code`),
  ADD UNIQUE KEY `company_code_5` (`company_code`),
  ADD UNIQUE KEY `company_code_6` (`company_code`),
  ADD UNIQUE KEY `company_code_7` (`company_code`),
  ADD UNIQUE KEY `company_code_8` (`company_code`),
  ADD UNIQUE KEY `company_code_9` (`company_code`),
  ADD UNIQUE KEY `company_code_10` (`company_code`),
  ADD UNIQUE KEY `company_code_11` (`company_code`),
  ADD UNIQUE KEY `company_code_12` (`company_code`),
  ADD UNIQUE KEY `company_code_13` (`company_code`),
  ADD UNIQUE KEY `company_code_14` (`company_code`),
  ADD UNIQUE KEY `company_code_15` (`company_code`),
  ADD UNIQUE KEY `company_code_16` (`company_code`),
  ADD UNIQUE KEY `company_code_17` (`company_code`),
  ADD UNIQUE KEY `company_code_18` (`company_code`),
  ADD UNIQUE KEY `company_code_19` (`company_code`),
  ADD UNIQUE KEY `company_code_20` (`company_code`),
  ADD KEY `companies_tenant_id` (`tenant_id`),
  ADD KEY `companies_email` (`email`),
  ADD KEY `companies_status` (`status`),
  ADD KEY `primary_contact_id` (`primary_contact_id`);

--
-- Indexes for table `company_contacts`
--
ALTER TABLE `company_contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `company_contacts_company_id_contact_id_unique` (`company_id`,`contact_id`),
  ADD UNIQUE KEY `company_contacts_company_id_contact_id` (`company_id`,`contact_id`),
  ADD KEY `company_contacts_company_id` (`company_id`),
  ADD KEY `company_contacts_contact_id` (`contact_id`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contact_code` (`contact_code`),
  ADD UNIQUE KEY `contacts_contact_code` (`contact_code`),
  ADD UNIQUE KEY `contact_code_2` (`contact_code`),
  ADD UNIQUE KEY `contact_code_3` (`contact_code`),
  ADD UNIQUE KEY `contact_code_4` (`contact_code`),
  ADD UNIQUE KEY `contact_code_5` (`contact_code`),
  ADD UNIQUE KEY `contact_code_6` (`contact_code`),
  ADD UNIQUE KEY `contact_code_7` (`contact_code`),
  ADD UNIQUE KEY `contact_code_8` (`contact_code`),
  ADD UNIQUE KEY `contact_code_9` (`contact_code`),
  ADD UNIQUE KEY `contact_code_10` (`contact_code`),
  ADD UNIQUE KEY `contact_code_11` (`contact_code`),
  ADD UNIQUE KEY `contact_code_12` (`contact_code`),
  ADD UNIQUE KEY `contact_code_13` (`contact_code`),
  ADD UNIQUE KEY `contact_code_14` (`contact_code`),
  ADD UNIQUE KEY `contact_code_15` (`contact_code`),
  ADD UNIQUE KEY `contact_code_16` (`contact_code`),
  ADD UNIQUE KEY `contact_code_17` (`contact_code`),
  ADD UNIQUE KEY `contact_code_18` (`contact_code`),
  ADD UNIQUE KEY `contact_code_19` (`contact_code`),
  ADD UNIQUE KEY `contact_code_20` (`contact_code`),
  ADD KEY `contacts_tenant_id` (`tenant_id`),
  ADD KEY `contacts_email` (`email`),
  ADD KEY `contacts_status` (`status`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `contact_roles`
--
ALTER TABLE `contact_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `deals`
--
ALTER TABLE `deals`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `deal_number` (`deal_number`),
  ADD UNIQUE KEY `deals_deal_number` (`deal_number`),
  ADD KEY `contact_id` (`contact_id`),
  ADD KEY `deals_tenant_id` (`tenant_id`),
  ADD KEY `deals_lead_id` (`lead_id`),
  ADD KEY `deals_company_id` (`company_id`),
  ADD KEY `deals_supplier_id` (`supplier_id`),
  ADD KEY `deals_status` (`status`),
  ADD KEY `deals_payment_status` (`payment_status`),
  ADD KEY `deals_assigned_to` (`assigned_to`);

--
-- Indexes for table `deal_items`
--
ALTER TABLE `deal_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `deal_items_deal_id` (`deal_id`),
  ADD KEY `deal_items_product_service_id` (`product_service_id`);

--
-- Indexes for table `deal_statuses`
--
ALTER TABLE `deal_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `deal_types`
--
ALTER TABLE `deal_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `designations`
--
ALTER TABLE `designations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `industry_types`
--
ALTER TABLE `industry_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `inventory_tenant_id_warehouse_id_material_type_id` (`tenant_id`,`warehouse_id`,`material_type_id`),
  ADD KEY `inventory_tenant_id` (`tenant_id`),
  ADD KEY `inventory_warehouse_id` (`warehouse_id`),
  ADD KEY `inventory_material_type_id` (`material_type_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `lead_number` (`lead_number`),
  ADD UNIQUE KEY `leads_lead_number` (`lead_number`),
  ADD UNIQUE KEY `lead_number_2` (`lead_number`),
  ADD UNIQUE KEY `lead_number_3` (`lead_number`),
  ADD UNIQUE KEY `lead_number_4` (`lead_number`),
  ADD UNIQUE KEY `lead_number_5` (`lead_number`),
  ADD UNIQUE KEY `lead_number_6` (`lead_number`),
  ADD UNIQUE KEY `lead_number_7` (`lead_number`),
  ADD UNIQUE KEY `lead_number_8` (`lead_number`),
  ADD UNIQUE KEY `lead_number_9` (`lead_number`),
  ADD UNIQUE KEY `lead_number_10` (`lead_number`),
  ADD UNIQUE KEY `lead_number_11` (`lead_number`),
  ADD UNIQUE KEY `lead_number_12` (`lead_number`),
  ADD UNIQUE KEY `lead_number_13` (`lead_number`),
  ADD UNIQUE KEY `lead_number_14` (`lead_number`),
  ADD UNIQUE KEY `lead_number_15` (`lead_number`),
  ADD UNIQUE KEY `lead_number_16` (`lead_number`),
  ADD UNIQUE KEY `lead_number_17` (`lead_number`),
  ADD UNIQUE KEY `lead_number_18` (`lead_number`),
  ADD UNIQUE KEY `lead_number_19` (`lead_number`),
  ADD UNIQUE KEY `lead_number_20` (`lead_number`),
  ADD UNIQUE KEY `lead_number_21` (`lead_number`),
  ADD UNIQUE KEY `lead_number_22` (`lead_number`),
  ADD UNIQUE KEY `lead_number_23` (`lead_number`),
  ADD UNIQUE KEY `lead_number_24` (`lead_number`),
  ADD UNIQUE KEY `lead_number_25` (`lead_number`),
  ADD UNIQUE KEY `lead_number_26` (`lead_number`),
  ADD UNIQUE KEY `lead_number_27` (`lead_number`),
  ADD UNIQUE KEY `lead_number_28` (`lead_number`),
  ADD UNIQUE KEY `lead_number_29` (`lead_number`),
  ADD UNIQUE KEY `lead_number_30` (`lead_number`),
  ADD UNIQUE KEY `lead_number_31` (`lead_number`),
  ADD UNIQUE KEY `lead_number_32` (`lead_number`),
  ADD UNIQUE KEY `lead_number_33` (`lead_number`),
  ADD UNIQUE KEY `lead_number_34` (`lead_number`),
  ADD UNIQUE KEY `lead_number_35` (`lead_number`),
  ADD UNIQUE KEY `lead_number_36` (`lead_number`),
  ADD UNIQUE KEY `lead_number_37` (`lead_number`),
  ADD UNIQUE KEY `lead_number_38` (`lead_number`),
  ADD UNIQUE KEY `lead_number_39` (`lead_number`),
  ADD UNIQUE KEY `lead_number_40` (`lead_number`),
  ADD UNIQUE KEY `lead_number_41` (`lead_number`),
  ADD UNIQUE KEY `lead_number_42` (`lead_number`),
  ADD UNIQUE KEY `lead_number_43` (`lead_number`),
  ADD UNIQUE KEY `lead_number_44` (`lead_number`),
  ADD UNIQUE KEY `lead_number_45` (`lead_number`),
  ADD UNIQUE KEY `lead_number_46` (`lead_number`),
  ADD UNIQUE KEY `lead_number_47` (`lead_number`),
  ADD UNIQUE KEY `lead_number_48` (`lead_number`),
  ADD UNIQUE KEY `lead_number_49` (`lead_number`),
  ADD UNIQUE KEY `lead_number_50` (`lead_number`),
  ADD UNIQUE KEY `lead_number_51` (`lead_number`),
  ADD UNIQUE KEY `lead_number_52` (`lead_number`),
  ADD UNIQUE KEY `lead_number_53` (`lead_number`),
  ADD UNIQUE KEY `lead_number_54` (`lead_number`),
  ADD UNIQUE KEY `lead_number_55` (`lead_number`),
  ADD UNIQUE KEY `lead_number_56` (`lead_number`),
  ADD KEY `leads_tenant_id` (`tenant_id`),
  ADD KEY `leads_assigned_to` (`assigned_to`),
  ADD KEY `leads_status` (`status`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `contact_id` (`contact_id`),
  ADD KEY `leads_product_service_id_foreign_idx` (`product_service_id`);

--
-- Indexes for table `lead_sources`
--
ALTER TABLE `lead_sources`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `migration_history`
--
ALTER TABLE `migration_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `migration_name` (`migration_name`);

--
-- Indexes for table `payment_statuses`
--
ALTER TABLE `payment_statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `permissions_name` (`name`),
  ADD UNIQUE KEY `name_2` (`name`),
  ADD UNIQUE KEY `name_3` (`name`),
  ADD UNIQUE KEY `name_4` (`name`),
  ADD UNIQUE KEY `name_5` (`name`),
  ADD UNIQUE KEY `name_6` (`name`),
  ADD UNIQUE KEY `name_7` (`name`),
  ADD UNIQUE KEY `name_8` (`name`),
  ADD UNIQUE KEY `name_9` (`name`),
  ADD UNIQUE KEY `name_10` (`name`),
  ADD UNIQUE KEY `name_11` (`name`),
  ADD UNIQUE KEY `name_12` (`name`),
  ADD UNIQUE KEY `name_13` (`name`),
  ADD UNIQUE KEY `name_14` (`name`),
  ADD UNIQUE KEY `name_15` (`name`),
  ADD UNIQUE KEY `name_16` (`name`),
  ADD UNIQUE KEY `name_17` (`name`),
  ADD UNIQUE KEY `name_18` (`name`),
  ADD UNIQUE KEY `name_19` (`name`),
  ADD UNIQUE KEY `name_20` (`name`),
  ADD UNIQUE KEY `name_21` (`name`),
  ADD UNIQUE KEY `name_22` (`name`),
  ADD UNIQUE KEY `name_23` (`name`),
  ADD UNIQUE KEY `name_24` (`name`),
  ADD UNIQUE KEY `name_25` (`name`),
  ADD UNIQUE KEY `name_26` (`name`),
  ADD UNIQUE KEY `name_27` (`name`),
  ADD UNIQUE KEY `name_28` (`name`),
  ADD UNIQUE KEY `name_29` (`name`),
  ADD UNIQUE KEY `name_30` (`name`),
  ADD UNIQUE KEY `name_31` (`name`),
  ADD UNIQUE KEY `name_32` (`name`),
  ADD UNIQUE KEY `name_33` (`name`),
  ADD UNIQUE KEY `name_34` (`name`),
  ADD UNIQUE KEY `name_35` (`name`),
  ADD UNIQUE KEY `name_36` (`name`),
  ADD UNIQUE KEY `name_37` (`name`),
  ADD UNIQUE KEY `name_38` (`name`),
  ADD UNIQUE KEY `name_39` (`name`),
  ADD UNIQUE KEY `name_40` (`name`),
  ADD UNIQUE KEY `name_41` (`name`),
  ADD UNIQUE KEY `name_42` (`name`),
  ADD UNIQUE KEY `name_43` (`name`),
  ADD UNIQUE KEY `name_44` (`name`),
  ADD UNIQUE KEY `name_45` (`name`),
  ADD UNIQUE KEY `name_46` (`name`),
  ADD UNIQUE KEY `name_47` (`name`),
  ADD UNIQUE KEY `name_48` (`name`),
  ADD UNIQUE KEY `name_49` (`name`),
  ADD UNIQUE KEY `name_50` (`name`),
  ADD UNIQUE KEY `name_51` (`name`),
  ADD UNIQUE KEY `name_52` (`name`),
  ADD UNIQUE KEY `name_53` (`name`),
  ADD UNIQUE KEY `name_54` (`name`),
  ADD UNIQUE KEY `name_55` (`name`),
  ADD UNIQUE KEY `name_56` (`name`),
  ADD UNIQUE KEY `name_57` (`name`),
  ADD UNIQUE KEY `name_58` (`name`),
  ADD UNIQUE KEY `name_59` (`name`),
  ADD KEY `permissions_module` (`module`),
  ADD KEY `permissions_action` (`action`);

--
-- Indexes for table `products_services`
--
ALTER TABLE `products_services`
  ADD PRIMARY KEY (`id`),
  ADD KEY `products_services_tenant_id` (`tenant_id`),
  ADD KEY `products_services_category` (`category`),
  ADD KEY `products_services_status` (`status`),
  ADD KEY `products_services_name` (`name`);

--
-- Indexes for table `product_categories`
--
ALTER TABLE `product_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_tenant_id_name` (`tenant_id`,`name`),
  ADD KEY `roles_tenant_id` (`tenant_id`),
  ADD KEY `roles_status` (`status`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_permission_id_role_id_unique` (`role_id`,`permission_id`),
  ADD UNIQUE KEY `role_permissions_role_id_permission_id` (`role_id`,`permission_id`),
  ADD KEY `role_permissions_role_id` (`role_id`),
  ADD KEY `role_permissions_permission_id` (`permission_id`);

--
-- Indexes for table `sequelizemeta`
--
ALTER TABLE `sequelizemeta`
  ADD PRIMARY KEY (`name`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `service_interests`
--
ALTER TABLE `service_interests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `service_types`
--
ALTER TABLE `service_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `statuses`
--
ALTER TABLE `statuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `supplier_code` (`supplier_code`),
  ADD UNIQUE KEY `suppliers_supplier_code` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_2` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_3` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_4` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_5` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_6` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_7` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_8` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_9` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_10` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_11` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_12` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_13` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_14` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_15` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_16` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_17` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_18` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_19` (`supplier_code`),
  ADD UNIQUE KEY `supplier_code_20` (`supplier_code`),
  ADD KEY `suppliers_tenant_id` (`tenant_id`),
  ADD KEY `suppliers_email` (`email`),
  ADD KEY `suppliers_status` (`status`),
  ADD KEY `primary_contact_id` (`primary_contact_id`);

--
-- Indexes for table `supplier_contacts`
--
ALTER TABLE `supplier_contacts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `supplier_contacts_supplier_id_contact_id_unique` (`supplier_id`,`contact_id`),
  ADD UNIQUE KEY `supplier_contacts_supplier_id_contact_id` (`supplier_id`,`contact_id`),
  ADD KEY `supplier_contacts_supplier_id` (`supplier_id`),
  ADD KEY `supplier_contacts_contact_id` (`contact_id`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `tenants_email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD UNIQUE KEY `email_15` (`email`),
  ADD UNIQUE KEY `email_16` (`email`),
  ADD UNIQUE KEY `email_17` (`email`),
  ADD UNIQUE KEY `email_18` (`email`),
  ADD UNIQUE KEY `email_19` (`email`),
  ADD UNIQUE KEY `email_20` (`email`),
  ADD UNIQUE KEY `email_21` (`email`),
  ADD UNIQUE KEY `email_22` (`email`),
  ADD UNIQUE KEY `email_23` (`email`),
  ADD UNIQUE KEY `email_24` (`email`),
  ADD UNIQUE KEY `email_25` (`email`),
  ADD UNIQUE KEY `email_26` (`email`),
  ADD UNIQUE KEY `email_27` (`email`),
  ADD UNIQUE KEY `email_28` (`email`),
  ADD UNIQUE KEY `email_29` (`email`),
  ADD UNIQUE KEY `email_30` (`email`),
  ADD UNIQUE KEY `email_31` (`email`),
  ADD UNIQUE KEY `email_32` (`email`),
  ADD UNIQUE KEY `email_33` (`email`),
  ADD UNIQUE KEY `email_34` (`email`),
  ADD UNIQUE KEY `email_35` (`email`),
  ADD UNIQUE KEY `email_36` (`email`),
  ADD UNIQUE KEY `email_37` (`email`),
  ADD UNIQUE KEY `email_38` (`email`),
  ADD UNIQUE KEY `email_39` (`email`),
  ADD UNIQUE KEY `email_40` (`email`),
  ADD UNIQUE KEY `email_41` (`email`),
  ADD UNIQUE KEY `email_42` (`email`),
  ADD UNIQUE KEY `email_43` (`email`),
  ADD UNIQUE KEY `email_44` (`email`),
  ADD UNIQUE KEY `email_45` (`email`),
  ADD UNIQUE KEY `email_46` (`email`),
  ADD UNIQUE KEY `email_47` (`email`),
  ADD UNIQUE KEY `email_48` (`email`),
  ADD UNIQUE KEY `email_49` (`email`),
  ADD UNIQUE KEY `email_50` (`email`),
  ADD UNIQUE KEY `email_51` (`email`),
  ADD UNIQUE KEY `email_52` (`email`),
  ADD UNIQUE KEY `email_53` (`email`),
  ADD UNIQUE KEY `email_54` (`email`),
  ADD UNIQUE KEY `email_55` (`email`),
  ADD UNIQUE KEY `email_56` (`email`),
  ADD UNIQUE KEY `email_57` (`email`),
  ADD UNIQUE KEY `email_58` (`email`),
  ADD UNIQUE KEY `email_59` (`email`),
  ADD UNIQUE KEY `email_60` (`email`),
  ADD KEY `tenants_status` (`status`),
  ADD KEY `tenants_subscription_end_date` (`subscription_end_date`);

--
-- Indexes for table `uae_cities`
--
ALTER TABLE `uae_cities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `units_of_measure`
--
ALTER TABLE `units_of_measure`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `value` (`value`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_tenant_id_email` (`tenant_id`,`email`),
  ADD UNIQUE KEY `users_tenant_id_username` (`tenant_id`,`username`),
  ADD KEY `users_tenant_id` (`tenant_id`),
  ADD KEY `users_role_id` (`role_id`),
  ADD KEY `users_status` (`status`),
  ADD KEY `users_employee_id` (`employee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `asset_custody`
--
ALTER TABLE `asset_custody`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `company_contacts`
--
ALTER TABLE `company_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `contact_roles`
--
ALTER TABLE `contact_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `deals`
--
ALTER TABLE `deals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deal_items`
--
ALTER TABLE `deal_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `deal_statuses`
--
ALTER TABLE `deal_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `deal_types`
--
ALTER TABLE `deal_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `designations`
--
ALTER TABLE `designations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `industry_types`
--
ALTER TABLE `industry_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `lead_sources`
--
ALTER TABLE `lead_sources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `migration_history`
--
ALTER TABLE `migration_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `payment_statuses`
--
ALTER TABLE `payment_statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=433;

--
-- AUTO_INCREMENT for table `products_services`
--
ALTER TABLE `products_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `product_categories`
--
ALTER TABLE `product_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=283;

--
-- AUTO_INCREMENT for table `service_interests`
--
ALTER TABLE `service_interests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `service_types`
--
ALTER TABLE `service_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `statuses`
--
ALTER TABLE `statuses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supplier_contacts`
--
ALTER TABLE `supplier_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tenants`
--
ALTER TABLE `tenants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `uae_cities`
--
ALTER TABLE `uae_cities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `units_of_measure`
--
ALTER TABLE `units_of_measure`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asset_custody`
--
ALTER TABLE `asset_custody`
  ADD CONSTRAINT `asset_custody_ibfk_101` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `asset_custody_ibfk_102` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_113` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_ibfk_114` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `companies`
--
ALTER TABLE `companies`
  ADD CONSTRAINT `companies_ibfk_37` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `companies_ibfk_38` FOREIGN KEY (`primary_contact_id`) REFERENCES `contacts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `company_contacts`
--
ALTER TABLE `company_contacts`
  ADD CONSTRAINT `company_contacts_ibfk_37` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `company_contacts_ibfk_38` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `contacts_ibfk_33` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `contacts_ibfk_34` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `deals`
--
ALTER TABLE `deals`
  ADD CONSTRAINT `deals_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `deals_ibfk_2` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `deals_ibfk_3` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `deals_ibfk_4` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `deals_ibfk_5` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `deals_ibfk_6` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `deal_items`
--
ALTER TABLE `deal_items`
  ADD CONSTRAINT `deal_items_ibfk_1` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `deal_items_ibfk_2` FOREIGN KEY (`product_service_id`) REFERENCES `products_services` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_151` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_ibfk_152` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_ibfk_153` FOREIGN KEY (`material_type_id`) REFERENCES `material_types` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_ibfk_176` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `leads_ibfk_178` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `leads_ibfk_179` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `leads_ibfk_180` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `leads_product_service_id_foreign_idx` FOREIGN KEY (`product_service_id`) REFERENCES `products_services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `products_services`
--
ALTER TABLE `products_services`
  ADD CONSTRAINT `products_services_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_113` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_ibfk_114` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD CONSTRAINT `suppliers_ibfk_37` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `suppliers_ibfk_38` FOREIGN KEY (`primary_contact_id`) REFERENCES `contacts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `supplier_contacts`
--
ALTER TABLE `supplier_contacts`
  ADD CONSTRAINT `supplier_contacts_ibfk_37` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `supplier_contacts_ibfk_38` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_175` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `users_ibfk_176` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `users_ibfk_177` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
