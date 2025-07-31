-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 31, 2025 at 04:55 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ecocart`
--

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `ProdCategoryID` int(11) NOT NULL,
  `Category` enum('Essentials','Clothing','Cuttlery') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`ProdCategoryID`, `Category`) VALUES
(1, 'Essentials'),
(2, 'Clothing'),
(3, 'Cuttlery');

-- --------------------------------------------------------

--
-- Table structure for table `orderhistory`
--

CREATE TABLE `orderhistory` (
  `OrderHistoryID` int(11) NOT NULL,
  `OrderLineID` int(11) DEFAULT NULL,
  `UserID` int(11) DEFAULT NULL,
  `status` enum('pending','ship','shipped','delivered') NOT NULL DEFAULT 'pending',
  `Date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderhistory`
--

INSERT INTO `orderhistory` (`OrderHistoryID`, `OrderLineID`, `UserID`, `status`, `Date`) VALUES
(1, 6, 31, 'pending', NULL),
(2, 7, 31, 'pending', NULL),
(3, 8, 31, 'pending', NULL),
(4, 9, 27, 'pending', NULL),
(5, 10, 27, 'pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `orderitem`
--

CREATE TABLE `orderitem` (
  `OrderItemID` int(11) NOT NULL,
  `OrderLineID` int(11) DEFAULT NULL,
  `ProductID` int(11) DEFAULT NULL,
  `Quantity` int(11) DEFAULT NULL,
  `SubTotal` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderitem`
--

INSERT INTO `orderitem` (`OrderItemID`, `OrderLineID`, `ProductID`, `Quantity`, `SubTotal`) VALUES
(1, 6, 2, 1, 1.75),
(2, 6, 1, 1, 2.50),
(3, 7, 3, 1, 4.00),
(4, 7, 2, 1, 1.75),
(5, 7, 1, 1, 2.50),
(6, 8, 2, 1, 1.75),
(7, 8, 1, 1, 2.50),
(8, 9, 1, 3, 7.50),
(9, 9, 2, 2, 3.50),
(10, 9, 3, 1, 4.00),
(11, 10, 1, 3, 7.50),
(12, 10, 2, 6, 10.50);

-- --------------------------------------------------------

--
-- Table structure for table `orderline`
--

CREATE TABLE `orderline` (
  `OrderLineID` int(11) NOT NULL,
  `Name` char(100) NOT NULL,
  `PhoneNumber` bigint(20) DEFAULT NULL,
  `ZipCode` int(11) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orderline`
--

INSERT INTO `orderline` (`OrderLineID`, `Name`, `PhoneNumber`, `ZipCode`, `Address`) VALUES
(6, 'SupremeEgg12', 9152647531, 2006, 'bakery ni winter sa kanto'),
(7, 'andrea yago', 48764623, 2001, 'bentahan ng gulay ni yago'),
(8, 'Kaliver', 911111111, 2050, 'sa bahay ni presto'),
(9, 'Venus Page', 1234567890, 1900, 'aloha cafe'),
(10, 'tryorder1', 1234567890, 1900, 'tryorder1');

-- --------------------------------------------------------

--
-- Table structure for table `product`
--

CREATE TABLE `product` (
  `ProductID` int(11) NOT NULL,
  `ProdCategoryID` int(11) DEFAULT NULL,
  `Name` varchar(255) DEFAULT NULL,
  `Description` text DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `Stocks` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product`
--

INSERT INTO `product` (`ProductID`, `ProdCategoryID`, `Name`, `Description`, `Price`, `Stocks`) VALUES
(1, 1, 'Toothpaste', 'Eco-friendly toothpaste.', 2.50, 91),
(2, 1, 'Soap Bar', 'Organic soap bar.', 1.75, 189),
(3, 1, 'Reusable Eco Bag', 'Durable and sustainable shopping bag.', 4.00, 153),
(4, 2, 'Organic T-Shirt', 'T-shirt made from organic cotton.', 15.00, 50),
(5, 2, 'Recycled Jean', 'Jeans made from recycled material.', 40.00, 40),
(6, 2, 'Eco Socks', 'Socks made from bamboo fiber.', 5.00, 100),
(7, 3, 'Bamboo Fork', 'Reusable bamboo fork.', 1.50, 300),
(8, 3, 'Steel Straw', 'Reusable steel straw.', 2.00, 250),
(15, 1, 'try1', 'try1', 123.00, 123),
(18, 1, 'try4', 'try4', 122.00, 123),
(19, 2, 'try5', 'try5', 123.00, 123),
(20, 3, 'try6', 'try6', 123.00, 123);

-- --------------------------------------------------------

--
-- Table structure for table `productimage`
--

CREATE TABLE `productimage` (
  `ProductImageID` int(11) NOT NULL,
  `ProductID` int(11) DEFAULT NULL,
  `Image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `productimage`
--

INSERT INTO `productimage` (`ProductImageID`, `ProductID`, `Image`) VALUES
(1, 1, 'assets/products/toothpaste1.png'),
(2, 1, 'assets/products/toothpaste2.png'),
(3, 2, 'assets/products/soap1.png'),
(4, 2, 'assets/products/soap2.png'),
(24, 3, 'assets/products/ecobag1.png'),
(25, 3, 'assets/products/ecobag2.png'),
(28, 8, 'assets/products/straw1.png'),
(29, 8, 'assets/products/straw2.png'),
(42, 15, 'assets/products/chopsticks1.png'),
(43, 15, 'assets/products/chopsticks2.png'),
(48, 18, 'assets/products/chopsticks1.png'),
(49, 18, 'assets/products/chopsticks2.png'),
(50, 4, 'assets/products/logo2-removebg-preview.png'),
(51, 4, 'assets/products/logo-removebg-preview.png'),
(52, 19, 'assets/products/logo2-removebg-preview.png'),
(53, 19, 'assets/products/logo-removebg-preview.png'),
(56, 5, 'assets/products/logo2-removebg-preview.png'),
(57, 5, 'assets/products/logo-removebg-preview.png'),
(58, 20, 'assets/products/Poppins.png'),
(59, 20, 'assets/products/Poppins-removebg-preview.png'),
(60, 6, 'assets/products/features3.png'),
(61, 6, 'assets/products/features4.png');

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `RoleID` int(11) NOT NULL,
  `Category` enum('Admin','Customer') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role`
--

INSERT INTO `role` (`RoleID`, `Category`) VALUES
(1, 'Admin'),
(2, 'Customer');

-- --------------------------------------------------------

--
-- Table structure for table `status`
--

CREATE TABLE `status` (
  `StatusID` int(11) NOT NULL,
  `Category` enum('Active','Deactivated') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `status`
--

INSERT INTO `status` (`StatusID`, `Category`) VALUES
(1, 'Active'),
(2, 'Deactivated');

-- --------------------------------------------------------

--
-- Table structure for table `userimage`
--

CREATE TABLE `userimage` (
  `UserImageID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `Image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `RoleID` int(11) DEFAULT NULL,
  `FirstName` varchar(100) DEFAULT NULL,
  `LastName` varchar(100) DEFAULT NULL,
  `Address` varchar(255) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `StatusID` int(11) DEFAULT NULL,
  `DeleteDate` datetime DEFAULT NULL,
  `sessionToken` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `RoleID`, `FirstName`, `LastName`, `Address`, `Email`, `PhoneNumber`, `Password`, `StatusID`, `DeleteDate`, `sessionToken`) VALUES
(27, 1, 'Jemuel', 'Malaga', 'Western Bicutan', 'malagajemuel@gmail.com', '09999999999', '$2b$10$4pGfVRUlh6EGWP70y2Mwp.Z4XnEgp.HGrpS5Sf9/a5/3ZoZpArVgu', 1, NULL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI3LCJlbWFpbCI6Im1hbGFnYWplbXVlbEBnbWFpbC5jb20iLCJ'),
(28, 1, 'Venus', 'Page', 'Hagonoy', 'mayarialunsina@gmail.com', '09611511215', '$2b$10$Q1Sh3n/HEk5BsrXnW6d.N.kbL852I/m1XPTcftQy9XLIrSiAXD752', 1, NULL, NULL),
(29, 1, 'Mary', 'Malaga', 'Pinagsama', 'mavilovesmary@gmail.com', '2131452352341', '$2b$10$xXiJJESK2hBqUrWyP32yUeYrvRwVx703OYqZtUTPd4wg6b2a1D7hG', 1, NULL, NULL),
(30, 2, 'Josefina', 'Alfaro', NULL, 'josefina@gmail.com', NULL, '$2b$10$dj3AcdDlSfsN8qi1ZHt.zegRK./8eLRSxo6U6ndyeoAhdZuIBO5OO', 1, '2025-07-15 13:25:04', NULL),
(31, 2, 'Ernesto', 'Malaga', 'Pinagsama', 'ernesto@gmail.com', '12345678', '$2b$10$CibF3jN/EKj9VMF0B6qpNOP6IzhNfAUE5zumuI9w1CduSBZK/HnTW', 1, NULL, NULL),
(32, 2, 'Test', 'User', NULL, 'testuser@example.com', NULL, '$2b$10$oiaseUJoS0mS/becfhA82.Hd10C5aGcBYzX.LoQiuNTgsevJ6nrX2', 1, '2025-07-15 10:45:49', NULL),
(33, 1, 'Alvin', 'Yago', 'North Signal Village', 'alvinsymo@gmail.com', '143314141', '$2b$10$1lqG9Kp0DB46y91asAgErOq2uOFW3CN65XbLi5hk3cR3q5epz5eyK', 1, NULL, NULL),
(34, 2, 'ewan', 'ewan', NULL, 'ewan@gmail.com', NULL, '$2b$10$P.LDw5WXePCmRouIWEWR9.L6gtlPQe3pe32AFwbQSm2cWwG.KsvVe', 1, '2025-07-14 09:54:25', NULL),
(35, 2, 'try1', 'register', NULL, 'tryregister1@gmail.com', NULL, '$2b$10$/jTjFYb6VY6JH73wMvtjr.Wp7lK2Bhc0hf9OO.vKAbcHgBEDKs6DC', 1, '2025-07-23 20:16:39', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`ProdCategoryID`);

--
-- Indexes for table `orderhistory`
--
ALTER TABLE `orderhistory`
  ADD PRIMARY KEY (`OrderHistoryID`),
  ADD KEY `OrderLineID` (`OrderLineID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD PRIMARY KEY (`OrderItemID`),
  ADD KEY `OrderLineID` (`OrderLineID`),
  ADD KEY `ProductID` (`ProductID`);

--
-- Indexes for table `orderline`
--
ALTER TABLE `orderline`
  ADD PRIMARY KEY (`OrderLineID`);

--
-- Indexes for table `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`ProductID`),
  ADD KEY `ProdCategoryID` (`ProdCategoryID`);

--
-- Indexes for table `productimage`
--
ALTER TABLE `productimage`
  ADD PRIMARY KEY (`ProductImageID`),
  ADD KEY `ProductID` (`ProductID`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`RoleID`);

--
-- Indexes for table `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`StatusID`);

--
-- Indexes for table `userimage`
--
ALTER TABLE `userimage`
  ADD PRIMARY KEY (`UserImageID`),
  ADD KEY `UserID` (`UserID`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`),
  ADD UNIQUE KEY `Email` (`Email`),
  ADD KEY `RoleID` (`RoleID`),
  ADD KEY `StatusID` (`StatusID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `ProdCategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orderhistory`
--
ALTER TABLE `orderhistory`
  MODIFY `OrderHistoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `orderitem`
--
ALTER TABLE `orderitem`
  MODIFY `OrderItemID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `orderline`
--
ALTER TABLE `orderline`
  MODIFY `OrderLineID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `ProductID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `productimage`
--
ALTER TABLE `productimage`
  MODIFY `ProductImageID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `RoleID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `status`
--
ALTER TABLE `status`
  MODIFY `StatusID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `userimage`
--
ALTER TABLE `userimage`
  MODIFY `UserImageID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orderhistory`
--
ALTER TABLE `orderhistory`
  ADD CONSTRAINT `orderhistory_ibfk_1` FOREIGN KEY (`OrderLineID`) REFERENCES `orderline` (`OrderLineID`) ON DELETE CASCADE,
  ADD CONSTRAINT `orderhistory_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `orderitem`
--
ALTER TABLE `orderitem`
  ADD CONSTRAINT `orderitem_ibfk_1` FOREIGN KEY (`OrderLineID`) REFERENCES `orderline` (`OrderLineID`) ON DELETE CASCADE,
  ADD CONSTRAINT `orderitem_ibfk_2` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`);

--
-- Constraints for table `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `product_ibfk_1` FOREIGN KEY (`ProdCategoryID`) REFERENCES `category` (`ProdCategoryID`);

--
-- Constraints for table `productimage`
--
ALTER TABLE `productimage`
  ADD CONSTRAINT `productimage_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`);

--
-- Constraints for table `userimage`
--
ALTER TABLE `userimage`
  ADD CONSTRAINT `userimage_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`RoleID`) REFERENCES `role` (`RoleID`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`StatusID`) REFERENCES `status` (`StatusID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
