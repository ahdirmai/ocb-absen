-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: absen_management
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.11-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `absen_status`
--

DROP TABLE IF EXISTS `absen_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `absen_status` (
  `status_id` int(11) NOT NULL AUTO_INCREMENT,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY (`status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `absen_status`
--

LOCK TABLES `absen_status` WRITE;
/*!40000 ALTER TABLE `absen_status` DISABLE KEYS */;
INSERT INTO `absen_status` VALUES (1,'ontime'),(2,'late'),(3,'out of area');
/*!40000 ALTER TABLE `absen_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `absensi`
--

DROP TABLE IF EXISTS `absensi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `absensi` (
  `absensi_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `retail_id` int(11) NOT NULL,
  `absen_type_id` int(11) NOT NULL,
  `absen_time` datetime NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `status_absen` int(11) NOT NULL,
  `photo_url` varchar(255) NOT NULL,
  `potongan` int(11) DEFAULT 0,
  `reason` varchar(255) DEFAULT NULL,
  `is_approval` int(11) DEFAULT 0,
  `is_valid` int(11) DEFAULT 1,
  `approval_by` int(11) DEFAULT NULL,
  `status_approval` int(11) DEFAULT 0,
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`absensi_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `absensi`
--

LOCK TABLES `absensi` WRITE;
/*!40000 ALTER TABLE `absensi` DISABLE KEYS */;
INSERT INTO `absensi` VALUES (1,156,33,14,'2025-01-27 14:56:13',-6.25766,106.852,1,'/assets/1737964573667_JPEG_20250127_145559_3015387047347846452.jpg',0,'Absen diluar radius yang ditentukan',1,1,2,0,NULL),(2,157,33,17,'2025-01-27 21:45:24',-6.25762,106.852,2,'/assets/1737989123973_JPEG_20250127_214455_7526030616633191522.jpg',5000,'Absen diluar radius yang ditentukan',1,1,156,2,'2025-01-28 10:51:36'),(3,7,33,18,'2025-01-28 11:37:23',-3.43451,114.849,1,'/assets/1738039042165_JPEG_20250128_123713_2807281204294863000.jpg',0,'Absen diluar radius yang ditentukan',1,1,2,1,NULL),(4,7,33,18,'2025-01-28 11:53:48',-3.43425,114.849,1,'/assets/1738040027697_JPEG_20250128_125335_3798686666645651722.jpg',0,'Absen diluar radius yang ditentukan',1,1,2,1,NULL),(5,7,33,18,'2025-01-28 12:10:22',-3.43425,114.849,1,'/assets/1738041022422_JPEG_20250128_131013_6711665091656121871.jpg',0,'Absen diluar radius yang ditentukan',1,1,2,2,'2025-01-28 12:14:43'),(6,7,33,18,'2025-01-28 15:16:15',-3.43251,114.85,1,'/assets/1738052175654_JPEG_20250128_161602_3964336566681432713.jpg',0,'Absen diluar radius yang ditentukan',1,1,2,1,NULL),(7,22,49,24,'2025-01-28 15:55:24',-3.43449,114.849,1,'/assets/1738054524642_JPEG_20250128_165510_4566748186474292094.jpg',0,'Absen diluar radius yang ditentukan',1,1,7,1,NULL),(8,22,49,24,'2025-01-28 19:21:36',-3.43449,114.849,2,'/assets/1738066896687_JPEG_20250128_201809_87053971710838035.jpg',5000,'Absen diluar radius yang ditentukan',1,1,7,1,NULL),(9,22,49,24,'2025-01-29 08:34:26',-3.43012,114.816,1,'/assets/1738114465858_JPEG_20250129_093418_4117026768688503197.jpg',0,'Absen diluar radius yang ditentukan',1,1,7,1,NULL),(10,25,49,24,'2025-01-29 08:40:53',-3.30418,114.588,1,'/assets/1738114852628_JPEG_20250129_094035_2162518654085484856.jpg',0,'Absen diluar radius yang ditentukan',1,1,7,1,NULL),(11,21,49,24,'2025-01-29 10:47:43',0,0,1,'/assets/1738122462863_JPEG_20250129_114723_2630464625315093348.jpg',0,'null',0,1,7,0,NULL),(12,156,33,14,'2025-01-29 10:54:34',-6.25765,106.852,1,'/assets/1738122874364_JPEG_20250129_105418_2477670531109825901.jpg',0,'macet pak',1,1,2,1,NULL),(13,21,49,24,'2025-01-29 17:12:45',-3.29685,114.603,1,'/assets/1738145564881_JPEG_20250129_181233_1298862210103121763.jpg',0,'Absen diluar radius yang ditentukan',1,1,7,1,NULL),(14,22,49,24,'2025-01-29 18:11:03',-3.43469,114.819,2,'/assets/1738149062518_JPEG_20250129_191053_3046955380361072381.jpg',5000,'Absen diluar radius yang ditentukan',1,1,7,1,NULL);
/*!40000 ALTER TABLE `absensi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `access_tokens`
--

DROP TABLE IF EXISTS `access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` text NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `device_type` varchar(50) NOT NULL,
  `os_info` varchar(100) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_revoked` tinyint(4) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_tokens`
--

LOCK TABLES `access_tokens` WRITE;
/*!40000 ALTER TABLE `access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_version`
--

DROP TABLE IF EXISTS `app_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_version` (
  `id` int(4) NOT NULL AUTO_INCREMENT,
  `latest_version` varchar(45) NOT NULL,
  `force_update` tinyint(4) NOT NULL,
  `update_url` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_version`
--

LOCK TABLES `app_version` WRITE;
/*!40000 ALTER TABLE `app_version` DISABLE KEYS */;
INSERT INTO `app_version` VALUES (1,'1.2.0',1,'https://play.google.com/store/apps/details?id=com.example.app');
/*!40000 ALTER TABLE `app_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `approval_status`
--

DROP TABLE IF EXISTS `approval_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `description_status` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_status`
--

LOCK TABLES `approval_status` WRITE;
/*!40000 ALTER TABLE `approval_status` DISABLE KEYS */;
INSERT INTO `approval_status` VALUES (1,'waiting'),(2,'approved'),(3,'rejected');
/*!40000 ALTER TABLE `approval_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bonus`
--

DROP TABLE IF EXISTS `bonus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bonus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `bonus` float NOT NULL,
  `month` date NOT NULL,
  `type_pb` int(11) DEFAULT NULL,
  `reason` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bonus`
--

LOCK TABLES `bonus` WRITE;
/*!40000 ALTER TABLE `bonus` DISABLE KEYS */;
INSERT INTO `bonus` VALUES (1,155,10000,'2025-01-29',1,NULL,'2025-01-28 12:36:16',1,NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `bonus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bonus_employes`
--

DROP TABLE IF EXISTS `bonus_employes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bonus_employes` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) DEFAULT 0,
  `id_bonus` int(10) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bonus_employes`
--

LOCK TABLES `bonus_employes` WRITE;
/*!40000 ALTER TABLE `bonus_employes` DISABLE KEYS */;
INSERT INTO `bonus_employes` VALUES (1,155,1,NULL,NULL),(2,19,1,NULL,NULL),(5,157,2,'2025-01-30 02:09:49',1),(6,156,2,'2025-01-30 02:09:49',1),(7,1,2,'2025-01-30 02:09:49',1);
/*!40000 ALTER TABLE `bonus_employes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_absen`
--

DROP TABLE IF EXISTS `group_absen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_absen` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `absen_type_id` int(4) DEFAULT NULL,
  `id_category` int(4) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(10) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int(10) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_absen`
--

LOCK TABLES `group_absen` WRITE;
/*!40000 ALTER TABLE `group_absen` DISABLE KEYS */;
INSERT INTO `group_absen` VALUES (11,8,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(12,7,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(13,5,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(14,4,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(15,18,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(16,20,4,'2025-01-28 18:38:51',1,NULL,NULL,NULL,NULL),(28,10,17,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(32,25,4,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(33,25,17,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(34,25,18,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(37,12,3,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(38,12,12,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(39,19,7,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(40,19,12,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(44,21,0,'2025-01-29 17:04:05',1,NULL,NULL,NULL,NULL),(47,11,0,'2025-01-29 17:39:10',1,NULL,NULL,NULL,NULL),(49,9,0,'2025-01-29 17:41:08',1,NULL,NULL,NULL,NULL),(63,24,2,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(64,24,3,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(65,24,4,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(66,24,8,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(67,24,13,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(68,24,14,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(69,24,15,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(70,24,16,'2025-01-29 17:43:53',1,NULL,NULL,NULL,NULL),(73,14,0,'2025-01-29 17:44:57',1,NULL,NULL,NULL,NULL),(74,22,0,'2025-01-29 17:48:13',1,NULL,NULL,NULL,NULL),(75,23,0,'2025-01-29 17:48:13',1,NULL,NULL,NULL,NULL),(76,17,0,'2025-01-29 17:48:13',1,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `group_absen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `navigation_access`
--

DROP TABLE IF EXISTS `navigation_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `navigation_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(45) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(45) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `menu_id` (`menu_id`),
  CONSTRAINT `navigation_access_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `navigation_links` (`id`),
  CONSTRAINT `navigation_access_ibfk_3` FOREIGN KEY (`category_id`) REFERENCES `user_category` (`id_category`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `navigation_access`
--

LOCK TABLES `navigation_access` WRITE;
/*!40000 ALTER TABLE `navigation_access` DISABLE KEYS */;
INSERT INTO `navigation_access` VALUES (1,1,1,NULL,NULL,NULL,NULL,NULL,NULL,0),(2,1,2,NULL,NULL,NULL,NULL,NULL,NULL,0),(3,1,10,NULL,NULL,NULL,NULL,NULL,NULL,0),(4,2,1,NULL,NULL,NULL,NULL,NULL,NULL,0),(5,3,4,NULL,NULL,NULL,NULL,'2025-01-19 13:21:03','9',1),(6,6,6,NULL,NULL,'2025-01-19 13:12:31','9',NULL,NULL,0),(7,1,11,NULL,NULL,NULL,NULL,NULL,NULL,0),(8,1,3,NULL,NULL,NULL,NULL,NULL,NULL,0),(9,7,10,NULL,NULL,'2025-01-28 12:00:58','1',NULL,NULL,0),(10,1,5,NULL,NULL,NULL,NULL,NULL,NULL,0),(11,1,6,NULL,NULL,NULL,NULL,NULL,NULL,0),(12,1,7,NULL,NULL,NULL,NULL,NULL,NULL,0),(13,1,8,NULL,NULL,NULL,NULL,NULL,NULL,0),(14,1,9,NULL,NULL,NULL,NULL,NULL,NULL,0),(15,1,12,NULL,NULL,NULL,NULL,NULL,NULL,0),(16,1,13,NULL,NULL,NULL,NULL,NULL,NULL,0),(17,1,14,NULL,NULL,NULL,NULL,NULL,NULL,0),(18,6,4,'2025-01-19 12:38:49','9',NULL,NULL,NULL,NULL,0),(19,7,1,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(20,7,2,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(21,7,3,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(22,7,4,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(23,7,5,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(24,7,6,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(25,7,7,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(26,7,8,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(27,7,14,'2025-01-28 12:00:58','1','2025-01-28 12:00:58','1',NULL,NULL,0),(28,7,9,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(29,7,11,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(30,7,12,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(31,7,13,'2025-01-28 12:00:58','1',NULL,NULL,NULL,NULL,0),(32,7,4,'2025-01-28 12:36:16','1',NULL,NULL,'2025-01-28 12:36:16','7',1),(33,1,4,'2025-01-28 12:06:34','1',NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `navigation_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `navigation_links`
--

DROP TABLE IF EXISTS `navigation_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `navigation_links` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `path` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `submenu_id` varchar(255) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `navigation_links`
--

LOCK TABLES `navigation_links` WRITE;
/*!40000 ALTER TABLE `navigation_links` DISABLE KEYS */;
INSERT INTO `navigation_links` VALUES (1,'Dashboard','/','mdi-home',NULL,NULL,1),(2,'Data karyawan','/users','mdi-account-group',NULL,NULL,1),(3,'Absensi Histori','/absensi','mdi-calendar-clock',NULL,NULL,1),(4,'Kelola Cuti & Off','/offday','mdi-bed',NULL,NULL,1),(5,'Kelola Bonus/Punishment','/bonus','mdi-store-alert',NULL,NULL,1),(6,'Kelola Gaji Karyawan','/salary','mdi-wallet',NULL,NULL,1),(7,'Retail/Toko','/retails','mdi-store-outline',NULL,NULL,1),(8,'Shift','/shifting','mdi-briefcase-arrow-left-right',NULL,NULL,1),(9,'Kategori Absen','/typeabsen','mdi-palette-swatch-variant',NULL,NULL,1),(10,'Management User',NULL,'mdi-briefcase-account','manage-user',NULL,1),(11,'Role dan Kategori User','/management-user',NULL,NULL,10,1),(12,'Management Menu',NULL,'mdi-microsoft-xbox-controller-menu','manage-menu',NULL,1),(13,'Management Potongan','/potongan','mdi-cash-multiple',NULL,NULL,1),(14,'Config Menu User','/menu-category',NULL,NULL,12,1);
/*!40000 ALTER TABLE `navigation_links` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offday`
--

DROP TABLE IF EXISTS `offday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `tanggal` date NOT NULL,
  `type_off` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(11) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offday`
--

LOCK TABLES `offday` WRITE;
/*!40000 ALTER TABLE `offday` DISABLE KEYS */;
INSERT INTO `offday` VALUES (1,7,'2025-01-29',1,'TAHUN BARU IMLEK','2025-01-28 17:05:21',7,NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `offday` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offday_employes`
--

DROP TABLE IF EXISTS `offday_employes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offday_employes` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) NOT NULL DEFAULT 0,
  `id_offday` int(10) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offday_employes`
--

LOCK TABLES `offday_employes` WRITE;
/*!40000 ALTER TABLE `offday_employes` DISABLE KEYS */;
INSERT INTO `offday_employes` VALUES (2,0,2,NULL,NULL),(5,156,6,'2025-01-30 00:10:11',1),(9,155,1,'2025-01-30 00:18:13',1),(10,153,1,'2025-01-30 00:18:13',1),(11,19,1,'2025-01-30 00:18:13',1);
/*!40000 ALTER TABLE `offday_employes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `potongan`
--

DROP TABLE IF EXISTS `potongan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `potongan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(100) DEFAULT NULL,
  `value` float NOT NULL DEFAULT 0,
  `keterangan` varchar(255) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `potongan`
--

LOCK TABLES `potongan` WRITE;
/*!40000 ALTER TABLE `potongan` DISABLE KEYS */;
INSERT INTO `potongan` VALUES (1,'Late',5000,'Keterlambatan Absen','2025-01-28 12:36:16','1'),(2,'Tidak Hadir',100000,'Ketidak hadiran tanpa Kabar dan Izin ',NULL,NULL);
/*!40000 ALTER TABLE `potongan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `retail`
--

DROP TABLE IF EXISTS `retail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `retail` (
  `retail_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `radius` float DEFAULT NULL,
  `is_active` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`retail_id`)
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retail`
--

LOCK TABLES `retail` WRITE;
/*!40000 ALTER TABLE `retail` DISABLE KEYS */;
INSERT INTO `retail` VALUES (1,'khunStore123',-6.46123,106.812,10,0,'2024-11-27 11:30:45','1','2024-12-28 20:57:30','11',1,'2025-01-22 10:19:29','undefined'),(2,'OC 12',-3.42368,114.836,50,1,'2024-11-27 12:06:45','1','2025-01-22 10:19:29','undefined',1,'2025-01-22 10:19:29','undefined'),(4,'OC 10',-3.32971,114.595,50,1,'2024-12-13 01:06:20','9','2025-01-22 10:19:29','undefined',0,NULL,''),(5,'OC 9',-3.29641,114.604,50,1,'2024-12-13 01:07:15','9','2025-01-22 10:19:29','undefined',0,NULL,NULL),(6,'OC 8',-3.80369,114.763,50,1,'2024-12-13 01:16:34','9','2025-01-22 10:19:29','undefined',0,NULL,NULL),(7,'Retail_003',-6.98126,108.126,10,0,'2024-12-13 01:25:53','9',NULL,NULL,1,'2024-12-14 12:58:03','9'),(10,'OC 7',-3.30132,114.604,50,1,'2024-12-13 02:06:16','9','2025-01-22 10:19:29','undefined',0,NULL,NULL),(11,'OC 6',-3.32013,114.584,50,1,'2024-12-13 02:06:16','9','2025-01-22 10:19:29','undefined',0,NULL,NULL),(12,'OC 5',-3.31348,114.618,50,1,'2024-12-13 02:10:34','9','2025-01-22 10:19:29','undefined',0,NULL,NULL),(13,'OC 4',-3.34575,114.57,50,1,'2024-12-13 02:10:34','9','2025-01-22 10:19:29','undefined',0,NULL,NULL),(14,'Retail_006',-6.12312,109.123,10,0,'2024-12-13 02:10:34','9',NULL,NULL,1,'2024-12-15 01:10:03','9'),(15,'OC 3',-3.79417,114.774,50,1,'2024-12-15 01:10:03','9','2025-01-22 10:19:29','undefined',0,NULL,NULL),(16,'OC 2',-3.32231,114.575,50,1,'2024-12-28 07:05:55','11','2025-01-22 10:19:29','undefined',0,NULL,NULL),(17,'OC 1',-3.33001,114.569,50,1,'2024-12-28 20:42:44','11','2025-01-22 10:19:29','undefined',0,NULL,NULL),(18,'OC 11',-3.34749,114.567,50,1,'2025-01-22 10:19:29',NULL,NULL,NULL,0,NULL,NULL),(19,'OC 12',-3.42368,114.836,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(20,'OC 13',-3.42129,114.855,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(21,'OC 14',-3.43537,114.846,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(22,'OC 15',-3.3322,114.571,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(23,'OC 16',-3.43464,114.819,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(24,'OC 17',-3.43037,114.816,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(25,'ADMIN & GUDANG BJB',-3.43037,114.816,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(26,'OC 18',-3.43928,114.841,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(27,'OC 19',-3.29648,114.608,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(28,'OC 20',-3.4422,114.807,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(29,'OC 21',-3.42363,114.851,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(30,'OC 22',-3.42835,114.858,50,1,'2025-01-22 12:57:53',NULL,NULL,NULL,0,NULL,NULL),(31,'OC 23',-3.43509,114.823,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(32,'OC 24',-3.31641,114.6,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(33,'HEAD OFFICE',-3.31641,114.6,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(34,'GUDANG BJMS',-3.31641,114.6,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(35,'OC 25',-3.15926,115.088,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(36,'OC 26',-3.35134,114.942,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(37,'OC 27',-3.25863,114.612,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(38,'OC 28',-3.15796,115.091,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(39,'OC 29',-3.43375,114.856,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(40,'OC 30',-3.80981,114.756,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(41,'OC 31 ',-3.42467,114.816,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(42,'OC 32',-3.42819,114.853,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(43,'OC 33',-3.42412,114.752,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(44,'OC 34',-3.41171,114.851,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(45,'OC 35',-3.86509,115.207,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(46,'OC 36',-3.80842,114.759,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(47,'OC 37',-3.79477,114.783,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(48,'OC 38',-3.71156,115.604,50,1,'2025-01-22 13:28:26',NULL,NULL,NULL,0,NULL,NULL),(49,'SPV AREA',-3.02429,112.948,50,1,'2025-01-28 12:36:16',NULL,NULL,NULL,0,NULL,NULL),(50,'COO',-3.02429,112.948,50,1,'2025-01-28 12:36:16',NULL,NULL,NULL,0,NULL,NULL),(51,'DIRECT SALES',-3.02429,112.948,50,1,'2025-01-28 12:36:16',NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `retail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_employes`
--

DROP TABLE IF EXISTS `shift_employes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_employes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shifting_id` int(11) NOT NULL DEFAULT 0,
  `user_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_employes`
--

LOCK TABLES `shift_employes` WRITE;
/*!40000 ALTER TABLE `shift_employes` DISABLE KEYS */;
INSERT INTO `shift_employes` VALUES (1,23,156,NULL,NULL),(2,23,157,NULL,NULL),(3,24,14,'2025-01-29 08:04:39',1),(4,24,19,'2025-01-29 08:04:39',1),(5,24,16,'2025-01-29 08:04:39',1),(6,32,19,'2025-01-29 13:59:14',1),(7,32,7,'2025-01-29 13:59:14',1),(8,33,19,'2025-01-29 14:07:50',1),(9,33,7,'2025-01-29 14:07:50',1),(10,25,0,'2025-01-29 17:20:43',1),(11,26,0,'2025-01-29 17:22:31',1),(12,27,0,'2025-01-29 17:25:47',1),(13,28,0,'2025-01-29 17:30:02',1),(14,29,0,'2025-01-29 17:30:26',1),(15,30,0,'2025-01-29 17:33:29',1),(16,31,0,'2025-01-29 17:33:38',1),(17,22,0,'2025-01-29 17:38:15',1),(18,20,0,'2025-01-29 17:38:15',1),(19,21,0,'2025-01-29 17:54:04',1),(20,2,0,'2025-01-29 18:08:34',1),(21,3,0,'2025-01-29 18:11:55',1);
/*!40000 ALTER TABLE `shift_employes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifting`
--

DROP TABLE IF EXISTS `shifting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifting` (
  `shifting_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `retail_id` varchar(255) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`shifting_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifting`
--

LOCK TABLES `shifting` WRITE;
/*!40000 ALTER TABLE `shifting` DISABLE KEYS */;
INSERT INTO `shifting` VALUES (1,2,'2','2024-11-29','2024-11-29','2024-11-29 08:00:00','1','2024-11-29 01:00:00','2',1,'2024-11-29 01:00:00','2'),(2,9,'2','2024-12-20','2024-12-30','2024-11-29 01:00:00','1','2025-01-01 18:49:20','undefined',0,NULL,NULL),(3,2,'4','2024-12-05','2024-11-29','2024-12-15 00:26:18','9','2025-01-01 19:58:20','undefined',0,NULL,NULL),(4,10,'14','2024-12-15','2024-12-20','2024-12-15 00:26:47','9',NULL,NULL,0,NULL,NULL),(5,32,'2','2024-12-13','2024-12-18','2024-12-15 00:30:49','9','2025-01-01 18:49:47','undefined',0,NULL,NULL),(6,12,'4','2024-12-15','2024-12-20','2024-12-15 00:35:09','9',NULL,NULL,0,NULL,NULL),(7,13,'2','2024-12-14','2024-12-19','2024-12-15 00:35:09','9','2025-01-01 20:28:27','undefined',0,NULL,NULL),(8,10,'13','2024-12-22','2024-12-27','2024-12-15 00:41:35','9',NULL,NULL,0,NULL,NULL),(9,2,'5','2024-12-21','2024-12-27','2024-12-15 00:44:03','9',NULL,NULL,0,NULL,NULL),(10,2,'2','2025-01-04','2025-01-09','2024-12-15 00:51:57','9','2025-01-01 18:49:20','undefined',0,NULL,NULL),(11,2,'2','2025-01-12','2024-12-20','2024-12-15 00:56:41','9',NULL,NULL,0,NULL,NULL),(12,11,'13,4,2','2024-12-21','2024-12-30','2024-12-15 00:58:48','9','2024-12-15 01:49:56','9',0,NULL,NULL),(13,10,'4','2024-12-29','2025-01-03','2024-12-15 00:58:48','9',NULL,NULL,1,'2024-12-15 01:28:33','9'),(14,2,'2','2024-11-29','2024-11-29','2024-11-29 01:00:00','1',NULL,NULL,0,NULL,NULL),(15,13,'15','2024-12-15','2024-12-20','2024-12-15 02:21:50','9',NULL,NULL,0,NULL,NULL),(16,2,'2','2024-12-15','2024-12-20','2024-12-15 02:24:06','9',NULL,NULL,0,NULL,NULL),(17,11,'2','2024-12-28','2024-12-29','2024-12-29 01:00:00','1',NULL,NULL,0,NULL,NULL),(18,12,'4','2025-01-01','2025-01-30','2025-01-02 08:14:59',NULL,'2025-01-03 22:21:41','undefined',0,NULL,NULL),(19,36,'16','2025-01-01','2025-01-30','2025-01-03 23:00:55','52','2025-01-03 23:02:13','52',0,NULL,NULL),(20,54,'1','2025-01-01','2025-01-31','2025-01-19 14:33:09','39',NULL,NULL,0,NULL,NULL),(21,53,'1','2025-01-01','2025-01-31','2025-01-19 14:33:09','39',NULL,NULL,0,NULL,NULL),(22,157,'33','2025-01-01','2025-01-31','2025-01-27 14:16:39','1',NULL,NULL,0,NULL,NULL),(23,156,'33','2025-01-01','2025-01-31','2025-01-27 14:16:39','1',NULL,NULL,0,NULL,NULL),(24,7,'33','2025-01-01','2025-01-31','2025-01-28 12:00:58','7',NULL,NULL,0,NULL,NULL),(25,2,'50','2025-01-01','2025-01-31','2025-01-28 12:36:16','7',NULL,NULL,0,NULL,NULL),(26,22,'49','2025-01-01','2025-01-31','2025-01-28 12:36:16','7',NULL,NULL,0,NULL,NULL),(27,20,'49','2025-01-01','2025-01-31','2025-01-28 12:36:16','7',NULL,NULL,0,NULL,NULL),(28,25,'49','2025-01-01','2025-01-31','2025-01-28 12:36:16','7',NULL,NULL,0,NULL,NULL),(29,21,'49','2025-01-01','2025-01-31','2025-01-28 12:36:16','7',NULL,NULL,0,NULL,NULL),(30,17,'49','2025-01-01','2025-01-31','2025-01-28 12:36:16','7',NULL,NULL,0,NULL,NULL),(31,23,'49','2025-01-01','2025-01-31','2025-01-28 12:36:16','7',NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `shifting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipe_absen`
--

DROP TABLE IF EXISTS `tipe_absen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipe_absen` (
  `absen_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `description` text NOT NULL,
  `fee` float NOT NULL DEFAULT 0,
  `group_absen` int(11) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `retail_id` int(11) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`absen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipe_absen`
--

LOCK TABLES `tipe_absen` WRITE;
/*!40000 ALTER TABLE `tipe_absen` DISABLE KEYS */;
INSERT INTO `tipe_absen` VALUES (1,'AS001','Absen Masuk Bersih2',50000,3,'07:00:00','17:00:00',4,1,'2024-11-27 11:30:45','1','2024-12-29 16:50:00','11','2025-01-22 13:28:26','39'),(2,'AS002','Absen Pulang Dong',45000,3,'07:00:00','17:00:00',4,1,'2024-11-27 17:00:45','1','2024-12-17 02:42:09','9','2025-01-01 13:40:35','9'),(3,'AS003','Absen Masuk untuk pengurusan Barang',80000,3,'07:00:00','17:00:00',1,1,'2024-11-28 17:00:45','1','2024-12-17 02:42:09','9',NULL,NULL),(4,'S2-MALAM 9 JAM','Shift Malam 9 Jam',40000,3,'16:00:00','01:00:00',48,0,'2024-12-17 02:17:53','9','2025-01-22 13:28:26','39',NULL,NULL),(5,'AS005','Absen Susun Barang di Gudang',50000,3,'07:00:00','17:00:00',2,0,'2024-12-17 02:20:40','9','2024-12-29 03:18:59','11',NULL,NULL),(6,'AS006','Kunjungan Toko A',60000,4,'07:00:00','17:00:00',4,1,NULL,NULL,'2024-12-29 16:50:00','11','2025-01-02 09:02:24','undefined'),(7,'AS007','Absen Susun Barang Gudang',80000,3,'08:30:00','18:30:00',4,0,'2024-12-29 01:08:25','11','2024-12-29 06:15:19','11',NULL,NULL),(8,'AS008','Kunjungan Toko B ',50000,3,'07:30:00','17:30:00',1,0,'2024-12-29 01:28:45','11','2025-01-18 16:37:25','9',NULL,NULL),(9,'AS009','Kunjungan Toko C',50000,4,'07:00:00','17:30:00',2,0,'2024-12-29 01:48:24','11','2024-12-29 06:14:44','11',NULL,NULL),(10,'AS0010','Kunjungan Toko C',80000,2,'07:30:00','17:11:00',4,0,'2024-12-29 04:54:47','11','2025-01-18 16:37:45','9',NULL,NULL),(11,'AS0011','Checj Stock Gudang A',60000,3,'07:30:00','18:00:00',2,0,'2024-12-29 04:58:02','11',NULL,NULL,NULL,NULL),(12,'AS0012','Check Stock Gudang B',60000,3,'07:00:00','18:30:00',2,0,'2024-12-29 04:59:59','11',NULL,NULL,NULL,NULL),(13,'AS0013','Kunjungan Masuk Misla Store',80000,4,'06:30:00','08:01:00',4,1,'2025-01-02 08:14:59',NULL,'2025-01-02 08:50:06','undefined','2025-01-22 13:28:26','39'),(14,'AS0001','Absen Masuk',80000,12,'07:00:00','16:00:00',33,0,'2025-01-19 14:33:09','39','2025-01-27 14:16:39','1',NULL,NULL),(15,'Absen Bersih Toko','Absen Bersih Toko',25000,3,'09:00:00','17:00:00',1,1,'2025-01-19 14:33:09','39',NULL,NULL,'2025-01-22 13:28:26','39'),(16,'Absen Masuk','Absen Masuk',100000,5,'07:00:00','09:00:00',1,1,'2025-01-19 14:33:09','39',NULL,NULL,'2025-01-22 13:28:26','39'),(17,'S1-PAGI 9 JAM','Shift Pagi 9 Jam ',40000,18,'07:00:00','16:00:00',33,0,'2025-01-22 13:28:26','39','2025-01-27 14:16:39','1',NULL,NULL),(18,'HRD','Head Office',5921000,7,'09:00:00','17:00:00',33,0,'2025-01-28 12:34:07','7','2025-01-28 12:36:16','1',NULL,NULL),(19,'COO','Operasional',6280000,2,'09:00:00','17:00:00',50,0,'2025-01-28 12:36:16','7','2025-01-28 12:36:16','1',NULL,NULL),(20,'CS & SERVER - S1','CS & SERVER',1,14,'10:00:00','22:00:00',33,0,'2025-01-28 12:36:16','7',NULL,NULL,NULL,NULL),(21,'CS & SERVER - S1','SHIFT 1',70000,14,'10:00:00','22:00:00',33,0,'2025-01-28 12:36:16','7',NULL,NULL,NULL,NULL),(22,'CS & SERVER - S2','SHIFT 2',70000,14,'14:00:00','02:00:00',33,0,'2025-01-28 12:36:16','7',NULL,NULL,NULL,NULL),(23,'CS & SERVER - S3','SHIFT 3',70000,14,'22:00:00','10:00:00',33,0,'2025-01-28 12:36:16','7',NULL,NULL,NULL,NULL),(24,'SPV AREA','SPV',92600,12,'08:00:00','18:00:00',49,0,'2025-01-28 12:36:16','7',NULL,NULL,NULL,NULL),(25,'ADMINISTRATOR','ADMIN',1500000,6,'09:00:00','17:00:00',25,0,'2025-01-28 12:36:16','1',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `tipe_absen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_off`
--

DROP TABLE IF EXISTS `type_off`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_off` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_off` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_off`
--

LOCK TABLES `type_off` WRITE;
/*!40000 ALTER TABLE `type_off` DISABLE KEYS */;
INSERT INTO `type_off` VALUES (1,'Cuti'),(2,'Off Weekend'),(3,'Izin'),(4,'Sakit'),(5,'Mangkir');
/*!40000 ALTER TABLE `type_off` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `type_punishment`
--

DROP TABLE IF EXISTS `type_punishment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `type_punishment` (
  `id` int(11) NOT NULL,
  `type_pb` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type_punishment`
--

LOCK TABLES `type_punishment` WRITE;
/*!40000 ALTER TABLE `type_punishment` DISABLE KEYS */;
INSERT INTO `type_punishment` VALUES (1,'Bonus'),(2,'Punishment');
/*!40000 ALTER TABLE `type_punishment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(225) DEFAULT NULL,
  `role` int(11) DEFAULT NULL,
  `category_user` int(11) NOT NULL,
  `imei` varchar(225) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `upline` int(11) DEFAULT 0,
  `enabled` int(11) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=160 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'OSCAR ADITYA IBRAHIM','diroscar','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,1,NULL,NULL,0,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(2,'GUNTUR SARJITO','gunturops','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,2,'c5f4c60c67c28dd0',NULL,1,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(3,'WINDA ARDILLA','windafinance','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,3,NULL,NULL,2,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(4,'WAHYU DITA ZULKAFIFAH','ditaspvcs','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,4,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(5,'DIAN ARIESTYA SANTI','tyafinance','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,5,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(6,'HENY KUSTIANI','henyadmin01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,6,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(7,'AHMAD MUJAHID','ahmadhrd1','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,7,'e22955b388a9f0b5','/assets/profile/1738038650608_DSC05645.JPG',2,1,0,'2025-01-25 00:57:26','1','2025-01-28 12:36:16','7',NULL,NULL),(8,'FUJA MEILTA SUCI','fujaadmin02','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,6,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(9,'MAULANA ILYAS','ilyasgudang01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,8,NULL,NULL,2,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(10,'ANISA RAY SITA AGUSTINA, S. M','rayadmin05','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,6,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(11,'ERLYN SHAFIRA','erlynadmin03','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,6,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(12,'MARFUAH','fuahadmin04','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,6,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(13,'RENALDI','renaldigudangvc02','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,9,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(14,'AHMAD RIFKI MAULANA','rifkigudangacc03','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,10,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(15,'MUHAMMAD WAHYU NIZAR','nizaradminvcr01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,11,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(16,'MUHAMMAD SAIFFUDIN','saifgudangacc04','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,9,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(17,'MUHAMMAD HILMAN','hilmanspvbjb02','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(18,'MUHAMMAD NOOR','noorgudangvcr05','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,9,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(19,'SYAHRIL','arilgudangacc06','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,10,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(20,'ZAINUDIN','zainspvbjb03','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,'3a7c6299458bfa65',NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(21,'SYAFWAN WAHYUDI','uwanspvbjms01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,'1e2d9d518a245409',NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(22,'MUHAMMAD FIQIH MAULANA','fiqihspvbjb01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,'c04ec0c974ae3d85',NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(23,'MELI FATIMAH','melispvtlb01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(24,'ALPIANOR','alpiankurirbjb01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,13,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(25,'SINARI ','sinarspvbjms02','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,'a173edf9f7de9f8c',NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(26,'GAZALI AKBAR','gazalikurirbjms01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,13,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(27,'AHMAD DUTA ANSHARY','dutacs01bjms','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,14,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(28,'MUHAMMAD ALIF AZHARI','alifdesignbjms','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,15,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(29,'MUH. ANSAR NUR FATRIZAH','ansarcs02bjms','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,14,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(30,'SITI SUPIYAH MEILANA','sasaogbjms01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,16,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(31,'MUH. ADI SAPUTRA','adics03bjms','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,14,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(32,'MUH. RIFQI','rifqispvunit4-01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,NULL,NULL,7,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(33,'EKO MULIADI','ekodse001','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,17,NULL,NULL,2,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(34,'AHMAD ZAKI','k.tokoocb-7010','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(35,'RIO SAPUTRA','k.tokoocb-7011','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(36,'MISNAWATI','k.tokoocb-7012','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(37,'NADIYA FEBRIANA','k.tokoocb-7013','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(38,'M YANDI YUDHA PRATAMA ','k.tokoocb-7014','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(39,'ANJELLA','k.tokoocb-7015','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(40,'IHDA KHOIRUNNISA','k.tokoocb-7016','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(41,'MAYSARAH','k.tokoocb-7017','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(42,'DWI SITI SAIDAH','k.tokoocb-7018','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(43,'ALDA LINDARI','k.tokoocb-7019','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(44,'MUH. BAYU ARDHI NUGROHO','k.tokoocb-7020','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(45,'NENENG ASIVA YOLANDA','k.tokoocb-7021','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(46,'AISYAH','k.tokoocb-7022','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(47,'PUTRI NOFFA AHZATUL ARBIANTI','k.tokoocb-7023','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(48,'FERRY WAHYUDI','k.tokoocb-7024','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(49,'SYARIFAH AL ZAHRA','k.tokoocb-7025','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(50,'NIDA LUTFINA','k.tokoocb-7026','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(51,'MUHAMMAD LUTHPI AULIA','k.tokoocb-7027','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(52,'ROBIYATUL AWALLIYA','k.tokoocb-7028','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(53,'RADITYA SAKTY HERLANGGA','k.tokoocb-7029','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,23,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(54,'SUMIYATI','k.tokoocb-7030','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(55,'MUHAMMAD MAHADI AQSHA','k.tokoocb-7031','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(56,'MUH. RIZKY PEDRI SAPUTRA','k.tokoocb-7032','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(57,'M.HAIRULLAH','k.tokoocb-7033','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(58,'M. FIKRI HAIKAL','k.tokoocb-7034','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(59,'MUHAMMAD ILHAM','k.tokoocb-7035','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(60,'AHMAD SAFWANI','k.tokoocb-7036','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(61,'NUR HIDAYAH','k.tokoocb-7037','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(62,'ADE SAPUTRA','k.tokoocb-7038','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(63,'RAHMAD HARDONI','k.tokoocb-7039','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(64,'MUHAMMAD GILANG RAMADHAN','k.tokoocb-7040','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(65,'MUHAMMAD AMBERI','k.tokoocb-7041','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(66,'MUHAMMAD IRSADI','k.tokoocb-7042','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(67,'HATIMAH SARI','k.tokoocb-7043','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(68,'ROBBY HERSIAN GULTOM','k.tokoocb-7044','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(69,'H. IBRAHIM','k.tokoocb-7045','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(70,'MIKO PRATAMA','k.tokoocb-7046','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(71,'MUHAMMAD ZAINI','k.tokoocb-7047','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(72,'JIHAN HULWATUN','k.tokoocb-7048','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(73,'WAFIK NUR HAMIDAH','k.tokoocb-7049','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(74,'ALYA','k.tokoocb-7050','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(75,'CHRISTINE INTEN PERMATASARI ABU','k.tokoocb-7051','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(76,'NADIAH','k.tokoocb-7052','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(77,'MITTAHOL ANSYARI','k.tokoocb-7053','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(78,'SHOFIATUL AZKIA','k.tokoocb-7054','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(79,'MUH. FADILLAH RAHMAN','k.tokoocb-7055','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(80,'INTAN NUR SHOLIHAH (T)','k.tokoocb-7056','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(81,'MUH. RIKI SYAHPUTRA','k.tokoocb-7057','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,20,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(82,'HERO AMRULLAH','k.tokoocb-7058','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(83,'MUH. RIFKY ANANDA','k.tokoocb-7059','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(84,'HAYATI','k.tokoocb-7060','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(85,'MUHAMMAD ARISANDI','k.tokoocb-7061','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(86,'RASYIDIQ LUTFI','k.tokoocb-7062','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(87,'ILHAM MAULANA','k.tokoocb-7063','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,20,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(88,'LINGZHI ZILFA NAFISA','k.tokoocb-7064','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(89,'AHMAD RAMADHINNOR','k.tokoocb-7065','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(90,'ABDUL GAPUR','k.tokoocb-7066','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(91,'MUHAMMAD RIF AN','k.tokoocb-7067','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(92,'MUHAMMAD SAFARUDIN','k.tokoocb-7068','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,20,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(93,'MUHAMMAD FARIZ','k.tokoocb-7069','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(94,'SUHAIBATUL ASLAMIYAH','k.tokoocb-7070','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(95,'SAPTA CHAIRUL MASHUD','k.tokoocb-7071','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(96,'WARDANIAH','k.tokoocb-7072','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(97,'RYANDA INDRAWAN','k.tokoocb-7073','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(98,'MUH. FIKRI','k.tokoocb-7074','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(99,'MUH. RIZKY FATHUL ARIFIN','k.tokoocb-7075','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(100,'FADILLAH KHAIRANNI','k.tokoocb-7076','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(101,'ALYA SYIFA','k.tokoocb-7077','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(102,'SOFI KEMALA DEWI','k.tokoocb-7078','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(103,'ARIA MUHAMMAD ISRA PUTRA PERDANA MARPAUNG','k.tokoocb-7079','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,17,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(104,'AHMAD DANI','k.tokoocb-7080','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,22,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(105,'RIZKIAH','k.tokoocb-7081','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(106,'FUJI RAMADANI','k.tokoocb-7082','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(107,'SAHRI','k.tokoocb-7083','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(108,'SALWA NUR AMELIA','k.tokoocb-7084','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(109,'ANTONIUS OTU','k.tokoocb-7085','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(110,'MUH. RIFAI','k.tokoocb-7086','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(111,'RABIATUL ADAWIYAH','k.tokoocb-7087','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(112,'NOOR LAILA','k.tokoocb-7088','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(113,'ABDURRAHIM','k.tokoocb-7089','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(114,'ADELLA SAFIRA','k.tokoocb-7090','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(115,'HENDRA','k.tokoocb-7091','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(116,'DESSY AMELIA','k.tokoocb-7092','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(117,'MUH. IQBAL','k.tokoocb-7093','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(118,'FADILA AHMADINA','k.tokoocb-7094','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(119,'ASMI NOVITA','k.tokoocb-7095','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(120,'MUH. ILHAM AKBAR','k.tokoocb-7096','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(121,'M. NOR PRAJA','k.tokoocb-7097','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(122,'MUH. ZIDAN','k.tokoocb-7098','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(123,'NOVITASARI','k.tokoocb-7099','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(124,'GAJALI RAHMAN','k.tokoocb-7100','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(125,'AZRINA NUR FADILLA','k.tokoocb-7101','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(126,'CLEO MAHERWARA SHARQ','k.tokoocb-7102','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(127,'PUSPITA RIZKY','k.tokoocb-7103','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(128,'MUHAMMAD NOOR','k.tokoocb-7104','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(129,'RAHMAD FAHREJA','k.tokoocb-7105','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(130,'A. RIZKIE ','k.tokoocb-7106','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(131,'AHMAD FADHILAH','k.tokoocb-7107','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(132,'AHMADI','k.tokoocb-7108','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(133,'SINTANIA','k.tokoocb-7109','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(134,'MUH. ZAINI','k.tokoocb-7110','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(135,'MUH. YASIN','k.tokoocb-7111','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(136,'MAULIDA SAFITRI','k.tokoocb-7112','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(137,'NUR DINA AULIA','k.tokoocb-8152','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(138,'RIZKI FADILAH','k.tokoocb-8153','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(139,'NURJANNAH SAFITRI','k.tokoocb-8154','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(140,'M.HAFIZ','k.tokoocb-8155','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(141,'M. RIZKO FEBRIANSYAH','k.tokoocb-8156','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(142,'REZA FARLIPI','k.tokoocb-8157','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(143,'MUHAMMAD ADHA MUBARAK','k.tokoocb-8158','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(144,'VINA NORCAHYA','k.tokoocb-8159','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(145,'DHANY BAGUS ABDULLAH','k.tokoocb-8160','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(146,'PUTRI RAHMAH','k.tokoocb-8161','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(147,'INDRI PEBRITASARI','k.tokoocb-8162','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(148,'DESY FITRIA WAHYUNI','k.tokoocb-8163','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(149,'ARIFFIYANA GAYU','k.tokoocb-8164','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(150,'RIDAN RIZKIANI','k.tokoocb-8165','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(151,'NAZWAR FADHILA','k.tokoocb-8166','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(152,'AHMAD RIFA I','k.tokoocb-8167','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(153,'MUH. YUNIZAR AZRA','k.tokoocb-8168','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(154,'M. FAQIH MUNIR','k.tokoocb-8169','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(155,'FAHRUL RAZIE','k.tokoocb-8170','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,25,1,0,'2025-01-25 00:57:26','1',NULL,NULL,NULL,NULL),(156,'SPV Tester 01','testerspv01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,12,'571bd9ab1f6b9966',NULL,2,1,0,'2025-01-27 14:01:02','1',NULL,NULL,NULL,NULL),(157,'Staff Tester 01','testerstaff01','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,'8a56d35589841f51',NULL,156,1,0,'2025-01-27 14:05:44','1',NULL,NULL,NULL,NULL),(158,'tester','spv02','$2b$10$qRfMXFTzsWkb4FADpimVdOr77E12LtYe.cM0f2r7iOStifP.aMkPG',NULL,4,NULL,'/assets/profile/1737962304242_boxCar.png',1,1,1,'2025-01-27 12:49:01','1',NULL,NULL,'2025-01-27 14:59:56','undefined'),(159,'Staff Tester 02','testerstaff02','$2b$10$mKdGLhehowBdFUpyyQi8ceLR2zjkNSR0I/c4LB3D5kfKzEZY7ZuOm',NULL,18,NULL,NULL,156,1,1,'2025-01-27 14:22:44','1',NULL,NULL,'2025-01-27 14:16:39','undefined');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_category`
--

DROP TABLE IF EXISTS `user_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_category` (
  `id_category` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `category_user` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`id_category`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_category`
--

LOCK TABLES `user_category` WRITE;
/*!40000 ALTER TABLE `user_category` DISABLE KEYS */;
INSERT INTO `user_category` VALUES (1,1,'Owner','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(2,3,'COO','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(3,3,'Finance','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(4,3,'SPV CS & Server','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(5,3,'CFO','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(6,2,'Administrator','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(7,4,'Admin HRD','2025-01-25 00:27:48','1','2025-01-28 12:00:58','1',NULL,NULL),(8,3,'Kepala Gudang','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(9,3,'Gudang Voucher','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(10,3,'Gudang Acc','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(11,2,'Admin Voucher','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(12,3,'SPV Area','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(13,3,'Kurir','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(14,3,'CS & Server','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(15,3,'Designer','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(16,3,'OG & Cook','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(17,3,'Sales Lapangan','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL),(18,3,'Sales Toko','2025-01-25 00:27:48','1',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `user_category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_role`
--

DROP TABLE IF EXISTS `user_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_role` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `name_role` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(11) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role`
--

LOCK TABLES `user_role` WRITE;
/*!40000 ALTER TABLE `user_role` DISABLE KEYS */;
INSERT INTO `user_role` VALUES (1,'Super Admin',NULL,NULL,'2025-01-22 13:28:26','39',NULL,NULL),(2,'Administrator',NULL,NULL,'2025-01-28 11:30:05','1',NULL,NULL),(3,'Karyawan',NULL,NULL,'2025-01-22 17:45:09','39',NULL,NULL),(4,'HRD','2025-01-28 11:30:05','1','2025-01-28 11:58:30','1',NULL,NULL);
/*!40000 ALTER TABLE `user_role` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-30  7:52:27
