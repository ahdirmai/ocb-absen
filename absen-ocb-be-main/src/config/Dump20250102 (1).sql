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
  `status_id` int(4) NOT NULL AUTO_INCREMENT,
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
  `absen_type_id` int(4) NOT NULL,
  `absen_time` datetime NOT NULL,
  `latitude` float NOT NULL,
  `longitude` float NOT NULL,
  `status_absen` int(4) NOT NULL,
  `photo_url` varchar(255) NOT NULL,
  `potongan` int(11) DEFAULT 0,
  `reason` varchar(255) DEFAULT NULL,
  `is_approval` int(11) DEFAULT 0,
  `is_valid` int(2) DEFAULT 1,
  `approval_by` int(11) DEFAULT NULL,
  `status_approval` int(4) DEFAULT 0,
  `approved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`absensi_id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `absensi`
--

LOCK TABLES `absensi` WRITE;
/*!40000 ALTER TABLE `absensi` DISABLE KEYS */;
INSERT INTO `absensi` VALUES (1,2,2,1,'2025-01-02 08:30:45',0,12,2,'image/test',0,NULL,1,1,17,2,'2024-11-29 01:00:00'),(12,11,2,4,'2025-01-02 07:30:00',6.46123,104.123,1,'public/images/1734978844668_Screenshot_1.png',0,'test',1,1,17,2,'2024-12-29 05:12:13'),(13,11,2,4,'2025-01-01 08:30:45',6.46123,104.123,2,'public/images/1735040485902_Screenshot_1.png',0,'test',1,1,18,1,NULL),(14,11,4,4,'2025-01-02 19:15:15',6.46123,104.123,2,'public/images/1735042515363_Screenshot_1.png',0,'test',1,1,18,2,'2024-12-29 05:12:47'),(15,11,2,4,'2025-01-01 19:20:31',6.46123,104.123,2,'public/images/1735042831229_Screenshot_1.png',0,'test',1,1,18,1,NULL),(16,11,2,4,'2025-01-02 19:22:32',6.46123,104.123,2,'public/images/1735042952859_Screenshot_1.png',0,'test',1,1,18,1,NULL),(17,11,2,4,'2025-01-01 19:23:43',6.46123,104.123,2,'public/images/1735043023975_Screenshot_1.png',0,'test',1,1,18,1,NULL),(18,11,1,4,'2025-01-02 19:24:06',6.46123,104.123,2,'public/images/1735043046123_Screenshot_1.png',0,'test',1,1,18,1,NULL),(19,11,1,4,'2025-01-02 19:24:43',6.46123,104.123,2,'public/images/1735043083235_Screenshot_1.png',0,'test',1,1,18,1,NULL),(20,11,1,4,'2025-01-02 19:26:24',6.46123,104.123,2,'public/images/1735043184910_Screenshot_1.png',0,'test',1,1,18,1,NULL),(21,11,1,4,'2025-01-01 18:47:13',6.46123,104.123,2,'public/images/1735300033499_Screenshot_1.png',0,'test',1,1,18,1,NULL),(22,12,2,4,'2025-01-02 23:27:25',6.46123,104.123,2,'/assets/1735489645670_Screenshot_1.png',0,'test',1,1,17,1,NULL),(23,12,2,4,'2025-01-01 00:34:34',6.46123,104.123,2,'/assets/1735493674476_Screenshot_1.png',0,'test',1,1,17,1,NULL),(24,12,4,13,'2025-01-02 08:56:37',6.46123,104.123,1,'/assets/1735782997960_loker_sigma.jpg',0,'Kesiangan',0,1,17,0,NULL),(25,12,4,13,'2025-01-02 08:57:48',6.46123,104.123,2,'/assets/1735783068885_loker_sigma.jpg',5000,'Kesiangan',0,1,17,0,NULL),(26,12,4,13,'2025-01-02 11:05:17',6.46123,104.123,2,'/assets/1735790717665_loker_sigma.jpg',5000,'Kesiangan',0,1,17,0,NULL);
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
-- Table structure for table `approval_status`
--

DROP TABLE IF EXISTS `approval_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_status` (
  `id` int(4) NOT NULL AUTO_INCREMENT,
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
  `user_id` int(10) NOT NULL,
  `bonus` float NOT NULL,
  `month` date NOT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(10) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int(10) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(10) DEFAULT NULL,
  `is_deleted` int(2) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bonus`
--

LOCK TABLES `bonus` WRITE;
/*!40000 ALTER TABLE `bonus` DISABLE KEYS */;
INSERT INTO `bonus` VALUES (1,9,60000,'2025-01-24','2025-01-01 13:55:20',9,'2025-01-01 18:45:59',9,NULL,NULL,0),(2,2,50000,'2025-01-15','2025-01-01 14:04:51',9,'2025-01-01 18:45:59',9,NULL,NULL,0),(3,10,20000,'2025-01-08','2025-01-01 18:45:34',9,NULL,NULL,'2025-01-01 18:45:59',9,1),(4,38,70000,'2025-01-08','2025-01-02 12:32:59',9,NULL,NULL,NULL,NULL,0),(5,12,50000,'2025-01-08','2025-01-02 12:55:22',9,NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `bonus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offday`
--

DROP TABLE IF EXISTS `offday`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offday` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) NOT NULL,
  `tanggal` date NOT NULL,
  `type_off` int(4) NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `created_by` int(10) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` int(10) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` int(10) DEFAULT NULL,
  `is_deleted` int(2) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offday`
--

LOCK TABLES `offday` WRITE;
/*!40000 ALTER TABLE `offday` DISABLE KEYS */;
INSERT INTO `offday` VALUES (1,11,'2025-01-01',2,'Tahun Baru','2025-01-01 09:00:00',2,'2025-01-01 18:32:24',9,NULL,NULL,0),(2,26,'2025-01-01',2,'Tahun Baru','2025-01-01 10:59:23',NULL,'2025-01-01 18:32:24',9,'2025-01-01 13:44:11',9,0),(3,23,'2025-01-02',1,'Cuti Tahunan','2025-01-01 11:16:57',9,'2025-01-01 12:51:08',9,NULL,NULL,0),(4,2,'2025-01-05',2,'weekend','2025-01-01 11:48:16',9,NULL,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `offday` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retail`
--

LOCK TABLES `retail` WRITE;
/*!40000 ALTER TABLE `retail` DISABLE KEYS */;
INSERT INTO `retail` VALUES (1,'khunStore123',-6.46123,106.812,10,1,'2024-11-27 11:30:45','1','2024-12-28 20:57:30','11',0,NULL,NULL),(2,'AdithCollection',-6.46123,107.114,10,1,'2024-11-27 12:06:45','1','2024-12-28 21:06:03','11',0,NULL,NULL),(4,'MisLa Store',-6.87123,108.812,10,1,'2024-12-13 01:06:20','9',NULL,NULL,0,NULL,''),(5,'tesstAdd retail',6.46123,106.812,10,1,'2024-12-13 01:07:15','9','2024-12-28 20:57:59','11',0,NULL,NULL),(6,'retail002',-6.76125,107.871,11,1,'2024-12-13 01:16:34','9','2024-12-28 20:58:59','11',0,NULL,NULL),(7,'Retail_003',-6.98126,108.126,10,0,'2024-12-13 01:25:53','9',NULL,NULL,1,'2024-12-14 12:58:03','9'),(10,'Retail_004',-6.12837,109.816,10,1,'2024-12-13 02:06:16','9','2024-12-28 20:57:59','11',0,NULL,NULL),(11,'retail_005',-6.12637,109.813,10,1,'2024-12-13 02:06:16','9',NULL,NULL,0,NULL,NULL),(12,'Retail_006',-6.12321,108.123,10,1,'2024-12-13 02:10:34','9',NULL,NULL,0,NULL,NULL),(13,'retail_007',-6.12313,109.123,10,1,'2024-12-13 02:10:34','9',NULL,NULL,0,NULL,NULL),(14,'Retail_006',-6.12312,109.123,10,0,'2024-12-13 02:10:34','9',NULL,NULL,1,'2024-12-15 01:10:03','9'),(15,'RetailXyz',-6.12312,109.123,10,1,'2024-12-15 01:10:03','9',NULL,NULL,0,NULL,NULL),(16,'store08',-6.56756,104.568,20,1,'2024-12-28 07:05:55','11',NULL,NULL,0,NULL,NULL),(17,'Store 9',-9.23763,107.121,20,1,'2024-12-28 20:42:44','11',NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `retail` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifting`
--

LOCK TABLES `shifting` WRITE;
/*!40000 ALTER TABLE `shifting` DISABLE KEYS */;
INSERT INTO `shifting` VALUES (1,2,'2','2024-11-29','2024-11-29','2024-11-29 08:00:00','1','2024-11-29 01:00:00','2',1,'2024-11-29 01:00:00','2'),(2,9,'2','2024-12-20','2024-12-30','2024-11-29 01:00:00','1','2025-01-01 18:49:20','undefined',0,NULL,NULL),(3,2,'4','2024-12-05','2024-11-29','2024-12-15 00:26:18','9','2025-01-01 19:58:20','undefined',0,NULL,NULL),(4,10,'14','2024-12-15','2024-12-20','2024-12-15 00:26:47','9',NULL,NULL,0,NULL,NULL),(5,32,'2','2024-12-13','2024-12-18','2024-12-15 00:30:49','9','2025-01-01 18:49:47','undefined',0,NULL,NULL),(6,12,'4','2024-12-15','2024-12-20','2024-12-15 00:35:09','9',NULL,NULL,0,NULL,NULL),(7,13,'2','2024-12-14','2024-12-19','2024-12-15 00:35:09','9','2025-01-01 20:28:27','undefined',0,NULL,NULL),(8,10,'13','2024-12-22','2024-12-27','2024-12-15 00:41:35','9',NULL,NULL,0,NULL,NULL),(9,2,'5','2024-12-21','2024-12-27','2024-12-15 00:44:03','9',NULL,NULL,0,NULL,NULL),(10,2,'2','2025-01-04','2025-01-09','2024-12-15 00:51:57','9','2025-01-01 18:49:20','undefined',0,NULL,NULL),(11,2,'2','2025-01-12','2024-12-20','2024-12-15 00:56:41','9',NULL,NULL,0,NULL,NULL),(12,11,'13,4,2','2024-12-21','2024-12-30','2024-12-15 00:58:48','9','2024-12-15 01:49:56','9',0,NULL,NULL),(13,10,'4','2024-12-29','2025-01-03','2024-12-15 00:58:48','9',NULL,NULL,1,'2024-12-15 01:28:33','9'),(14,2,'2','2024-11-29','2024-11-29','2024-11-29 01:00:00','1',NULL,NULL,0,NULL,NULL),(15,13,'15','2024-12-15','2024-12-20','2024-12-15 02:21:50','9',NULL,NULL,0,NULL,NULL),(16,2,'2','2024-12-15','2024-12-20','2024-12-15 02:24:06','9',NULL,NULL,0,NULL,NULL),(17,11,'2','2024-12-28','2024-12-29','2024-12-29 01:00:00','1',NULL,NULL,0,NULL,NULL),(18,12,'4','2025-01-02','2025-01-31','2025-01-02 08:14:59',NULL,NULL,NULL,0,NULL,NULL);
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
  `group_absen` int(4) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `retail_id` int(4) DEFAULT NULL,
  `is_deleted` int(11) DEFAULT 0,
  `created_at` datetime DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `updated_by` varchar(100) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `deleted_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`absen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipe_absen`
--

LOCK TABLES `tipe_absen` WRITE;
/*!40000 ALTER TABLE `tipe_absen` DISABLE KEYS */;
INSERT INTO `tipe_absen` VALUES (1,'AS001','Absen Masuk Bersih2',50000,3,'07:00:00','17:00:00',4,0,'2024-11-27 11:30:45','1','2024-12-29 16:50:00','11',NULL,NULL),(2,'AS002','Absen Pulang Dong',45000,3,'07:00:00','17:00:00',4,1,'2024-11-27 17:00:45','1','2024-12-17 02:42:09','9','2025-01-01 13:40:35','9'),(3,'AS003','Absen Masuk untuk pengurusan Barang',80000,3,'07:00:00','17:00:00',1,1,'2024-11-28 17:00:45','1','2024-12-17 02:42:09','9',NULL,NULL),(4,'AS004','Absen Jaga Toko',80000,3,'07:00:00','17:00:00',2,0,'2024-12-17 02:17:53','9','2024-12-29 03:18:51','11',NULL,NULL),(5,'AS005','Absen Susun Barang di Gudang',50000,3,'07:00:00','17:00:00',2,0,'2024-12-17 02:20:40','9','2024-12-29 03:18:59','11',NULL,NULL),(6,'AS006','Kunjungan Toko A',60000,4,'07:00:00','17:00:00',4,1,NULL,NULL,'2024-12-29 16:50:00','11','2025-01-02 09:02:24','undefined'),(7,'AS007','Absen Susun Barang Gudang',80000,3,'08:30:00','18:30:00',4,0,'2024-12-29 01:08:25','11','2024-12-29 06:15:19','11',NULL,NULL),(8,'AS008','Kunjungan Toko B ',50000,4,'07:30:00','17:30:00',1,0,'2024-12-29 01:28:45','11',NULL,NULL,NULL,NULL),(9,'AS009','Kunjungan Toko C',50000,4,'07:00:00','17:30:00',2,0,'2024-12-29 01:48:24','11','2024-12-29 06:14:44','11',NULL,NULL),(10,'AS0010','Kunjungan Toko C',80000,4,'07:30:00','17:11:00',4,0,'2024-12-29 04:54:47','11',NULL,NULL,NULL,NULL),(11,'AS0011','Checj Stock Gudang A',60000,3,'07:30:00','18:00:00',2,0,'2024-12-29 04:58:02','11',NULL,NULL,NULL,NULL),(12,'AS0012','Check Stock Gudang B',60000,3,'07:00:00','18:30:00',2,0,'2024-12-29 04:59:59','11',NULL,NULL,NULL,NULL),(13,'AS0013','Kunjungan Masuk Misla Store',80000,4,'06:30:00','08:01:00',4,0,'2025-01-02 08:14:59',NULL,'2025-01-02 08:50:06','undefined',NULL,NULL);
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
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(225) NOT NULL,
  `role` int(4) NOT NULL,
  `category_user` int(4) NOT NULL,
  `imei` varchar(225) DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `upline` int(11) DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'Ardho','ardhohidayat123','undefined',1,1,'undefined',NULL,17,1,1,NULL,NULL,'2024-12-19 01:20:33','9','2024-12-28 07:33:55','11'),(2,'Asyraf Akmal','swither','undefined',3,3,'undefined',NULL,17,1,0,'2024-11-24 10:30:45','1','2025-01-01 20:51:57','undefined',NULL,NULL),(8,'Ardho Hidayat123','ardho66','undefined',3,3,'undefined',NULL,17,1,0,'2024-11-24 11:30:45','1','2024-12-28 13:24:04','11','2024-12-19 01:26:56','9'),(9,'Ardho Hidayat','ardho6694','$2b$10$zoY4e5JZPpAoRJ9Dy9jPnufM3LgaES1IS56rdV2AvdObWNXoqrwiC',3,3,'undefined','/assets/1735300033499_Screenshot_1.png',17,1,0,'2024-11-24 11:30:45','1','2025-01-01 21:21:43','undefined',NULL,NULL),(10,'Purwanto','Pur5647','undefined',3,3,'undefined',NULL,17,1,0,'2024-11-25 11:30:45','1','2025-01-01 21:30:17','undefined',NULL,NULL),(11,'Pur','wantoPur66','undefined',3,4,'undefined',NULL,17,1,0,'2024-11-25 11:30:45','1','2025-01-01 21:37:09','undefined',NULL,NULL),(12,'Alfarizqia Misha','mishahidayat','$2b$10$HMCvy3ec4e4TarTPwNYks.S..6WXggmuc35lahq7w.dJWz8p0WipW',3,4,'123asd1231123123',NULL,17,1,0,'2024-12-14 19:30:45','9',NULL,NULL,'2024-12-19 01:26:56','9'),(13,'Alfmahyra Labiqa','labiqahidayat','undefined',3,3,'undefined',NULL,17,1,0,'2024-12-14 19:30:45','9','2025-01-01 21:20:25','undefined',NULL,NULL),(14,'Karyawan01','karyawan1','$2b$10$bZUmWOCDZFmLQ0EWX9IDMeMx4opSilikVpeaO8r9rndjJSkZIuqb.',3,3,'undefined',NULL,17,1,0,'2024-12-15 21:30:45','9','2025-01-01 21:28:15','undefined',NULL,NULL),(15,'M. Ardho Hidayat','hidayatAR','undefined',3,3,'undefined',NULL,17,1,0,'2024-12-19 01:26:56','9','2025-01-01 21:30:17','undefined',NULL,NULL),(16,'Karyawan3','karyawan3','$2b$10$zoY4e5JZPpAoRJ9Dy9jPnufM3LgaES1IS56rdV2AvdObWNXoqrwiC',3,3,NULL,NULL,17,1,0,'2024-12-21 20:30:45','9',NULL,NULL,NULL,NULL),(17,'Spv001','spv001','$2b$10$Gu9K8P/5Z4HrFfD7z/Op/uuCFbNvnTNKkrR0vhWwAnQ6U/dhrdN3C',3,5,NULL,NULL,17,1,0,'2024-12-21 20:30:45','9',NULL,NULL,NULL,NULL),(18,'Spv002','spv002','$2b$10$mKPZFuzOHaoAL2rSpLRKa.KhHqjtW4LTyd8YkAQmXk2tyNOGePeLK',3,5,NULL,NULL,18,1,0,'2024-12-21 20:30:45','9',NULL,NULL,NULL,NULL),(19,'karyawan06','karyawan06','$2b$10$bZUmWOCDZFmLQ0EWX9IDMeMx4opSilikVpeaO8r9rndjJSkZIuqb.',3,5,NULL,NULL,17,1,0,'2024-12-21 09:30:45','9',NULL,NULL,NULL,NULL),(20,'karyawan07','karyawan07','$2b$10$EC7IJwob1kDM3b/P3.YOle7VjCTnkSWAWQw.9SYt/T/48NUwzHGvC',3,3,NULL,NULL,17,1,0,'2024-12-28 06:23:58','11',NULL,NULL,NULL,NULL),(21,'karyawan08','karyawan08','$2b$10$Qf6QCXKHgjSJsawc3mU7sewABhNezsOquVuStS1xw9OHFp7uk/poC',3,4,NULL,NULL,17,1,0,'2024-12-28 06:29:01','11',NULL,NULL,NULL,NULL),(22,'karyawan09','karyawan09','$2b$10$1CNqTT4X.vSL1CcSZ3fhBehwFjLxVbmzSKjyespX42aSlOg63B4Um',3,4,NULL,NULL,17,1,0,'2024-12-28 07:20:57','11',NULL,NULL,NULL,NULL),(23,'karyawan10','karyawan10','$2b$10$QhUd8HwfDUzNW6L4Mkl..eFCColrnpdrc2Q6qDJgVG21vzSu2U4zG',3,3,NULL,NULL,17,1,0,'2024-12-28 13:01:34','11',NULL,NULL,NULL,NULL),(24,'karyawan11','karyawan11','undefined',3,3,'undefined',NULL,0,1,0,'2024-12-28 13:02:45','11','2025-01-01 20:51:57','undefined',NULL,NULL),(25,'karyawan001','karyawan002','$2b$10$/dWWLYYnHQMKTmqMl1h/UOQ6D5Vd.Xjb.uuLEpq88673BBmpasFuy',3,4,NULL,NULL,NULL,1,0,'2024-12-28 13:06:46','11',NULL,NULL,NULL,NULL),(26,'test001','test001','undefined',3,3,'undefined',NULL,0,1,0,'2024-12-28 13:23:45','11','2025-01-01 20:51:57','undefined',NULL,NULL),(27,'testuser01','testuser01','$2b$10$PINOBuk4nGJ7..LJnPBkIOdq6u/2BHzPwLlgCGFjq5OVvmBJ9zc6a',3,3,NULL,NULL,0,1,0,'2024-12-28 13:39:34','11',NULL,NULL,NULL,NULL),(28,'testuser002','testuser002','$2b$10$fMFZIGBrXDMZQNIPrfNs/e6EjhOJ3wRzPyTIzxSJwETZH81u96drG',3,4,NULL,NULL,17,1,0,'2024-12-28 13:54:10','11',NULL,NULL,NULL,NULL),(29,'test003','tst003','$2b$10$jacRm7/lEW7/BLr0RtzKoud2hynTVVnpOTIFJ/Du0qKSBm.Vb6Z9e',3,4,NULL,NULL,26,1,0,'2024-12-28 15:16:40','11',NULL,NULL,NULL,NULL),(30,'test004','test004','$2b$10$Pjfe4WqR1aepgvqLm7FJ6.jAITr82sxzUNliAIq9saxRvVBE3i9h6',3,4,NULL,NULL,17,1,0,'2024-12-28 15:22:24','11',NULL,NULL,NULL,NULL),(31,'testuser005','testuser005','$2b$10$AFmkX1qChP1h.1u1VrWvk.VPYB78V6NjhxOvVvkYFESGwSweZANMG',3,4,NULL,NULL,17,1,0,'2024-12-28 15:27:09','11',NULL,NULL,NULL,NULL),(32,'test user 005','testuser007','undefined',3,3,'undefined',NULL,0,1,0,'2024-12-28 15:33:25','11','2025-01-01 21:31:03','undefined',NULL,NULL),(33,'test user 010','usertest10','$2b$10$ejEHOhHyRAn9.MHU//XVAOczlPI1L5a6dgovdm5wmqUd9Mw9o1a/y',3,4,NULL,NULL,17,1,0,'2024-12-28 15:39:30','11',NULL,NULL,NULL,NULL),(35,'usertest221','usertest221','$2b$10$rHs4zCM6Y26AIoAQmqtSRuvRNpmbsZJa/hunj2UqikVzQkyxVJ95W',3,5,NULL,NULL,18,1,0,'2024-12-29 23:39:57','11',NULL,NULL,NULL,NULL),(36,'test agi','testlagi','$2b$10$a8CQWCxLY/uYqX1RGO8M/.jS18lIwYkrHT3X.HJYD3QX1ApTRYWG2',3,4,NULL,NULL,18,1,0,'2024-12-29 23:40:39','11',NULL,NULL,NULL,NULL),(37,'karyawan06','karyawan0606','$2b$10$Eyn88/04bO3hN/TlcC4S4e8DWVIiHEK6MzLAwiewNKWD8HZ8Xarv2',3,5,NULL,NULL,17,1,0,'2024-12-21 09:30:45','9',NULL,NULL,NULL,NULL),(38,'Muhammad Ilham','ardhoxc','$2b$10$/OCfABgQjPCLgI4ECg0L../Ha5NVniYi2qEqwQmPHFTooENMr0Qiu',3,3,'9124669481253122001',NULL,18,1,0,'2025-01-02 08:49:02',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_category`
--

DROP TABLE IF EXISTS `user_category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_category` (
  `id_category` int(4) NOT NULL AUTO_INCREMENT,
  `role_id` int(4) NOT NULL,
  `category_user` varchar(255) NOT NULL,
  PRIMARY KEY (`id_category`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_category`
--

LOCK TABLES `user_category` WRITE;
/*!40000 ALTER TABLE `user_category` DISABLE KEYS */;
INSERT INTO `user_category` VALUES (1,1,'Owner'),(2,2,'Admin'),(3,3,'Staff Toko'),(4,3,'Staff Sales'),(5,3,'Supervisor');
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
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_role`
--

LOCK TABLES `user_role` WRITE;
/*!40000 ALTER TABLE `user_role` DISABLE KEYS */;
INSERT INTO `user_role` VALUES (1,'SuperAdmin'),(2,'Admin'),(3,'Karyawan');
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

-- Dump completed on 2025-01-02 18:09:51
