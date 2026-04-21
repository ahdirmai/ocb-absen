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
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_absen`
--

LOCK TABLES `group_absen` WRITE;
/*!40000 ALTER TABLE `group_absen` DISABLE KEYS */;
INSERT INTO `group_absen` VALUES (10,9,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(11,8,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(12,7,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(13,5,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(14,4,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(15,18,0,'2025-01-28 18:37:45',1,NULL,NULL,NULL,NULL),(16,20,4,'2025-01-28 18:38:51',1,NULL,NULL,NULL,NULL),(17,24,2,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(18,24,3,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(19,24,4,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(20,24,14,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(21,24,13,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(22,24,15,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(23,24,16,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(24,24,8,'2025-01-28 18:52:46',1,NULL,NULL,NULL,NULL),(28,10,17,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(29,11,18,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(31,14,4,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(32,25,4,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(33,25,17,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(34,25,18,'2025-01-28 20:08:52',1,NULL,NULL,NULL,NULL),(37,12,3,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(38,12,12,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(39,19,7,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(40,19,12,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(41,17,7,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(42,17,13,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL),(43,17,12,'2025-01-28 21:27:26',1,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `group_absen` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_employes`
--

LOCK TABLES `shift_employes` WRITE;
/*!40000 ALTER TABLE `shift_employes` DISABLE KEYS */;
INSERT INTO `shift_employes` VALUES (1,23,156,NULL,NULL),(2,23,157,NULL,NULL),(3,24,14,'2025-01-29 08:04:39',1),(4,24,19,'2025-01-29 08:04:39',1),(5,24,16,'2025-01-29 08:04:39',1);
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-29 12:44:30
