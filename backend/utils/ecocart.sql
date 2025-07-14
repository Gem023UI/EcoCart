-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 14, 2025 at 02:39 AM
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
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `CartID` int(11) NOT NULL,
  `UserID` int(11) DEFAULT NULL,
  `ProductID` int(11) DEFAULT NULL,
  `Quantity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 1, 'Toothpaste', 'Eco-friendly toothpaste.', 2.50, 100),
(2, 1, 'Soap Bar', 'Organic soap bar.', 1.75, 200),
(3, 1, 'Reusable Bag', 'Durable shopping bag.', 3.00, 150),
(4, 2, 'Organic T-Shirt', 'T-shirt made from organic cotton.', 15.00, 50),
(5, 2, 'Recycled Jeans', 'Jeans made from recycled materials.', 40.00, 40),
(6, 2, 'Eco Socks', 'Socks made from bamboo fiber.', 5.00, 100),
(7, 3, 'Bamboo Fork', 'Reusable bamboo fork.', 1.50, 300),
(8, 3, 'Steel Straw', 'Reusable steel straw.', 2.00, 250),
(9, 3, 'Reusable Chopsticks', 'Reusable chopsticks set.', 2.50, 200);

-- --------------------------------------------------------

--
-- Table structure for table `productimage`
--

CREATE TABLE `productimage` (
  `ProductImageID` int(11) NOT NULL,
  `ProductID` int(11) DEFAULT NULL,
  `Image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `Email` varchar(150),
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `StatusID` int(11) DEFAULT NULL,
  `DeleteDate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `RoleID`, `FirstName`, `LastName`, `Address`, `Email`, `PhoneNumber`, `Password`, `StatusID`, `DeleteDate`) VALUES
(27, 1, 'Jemuel', 'Malaga', NULL, 'malagajemuel@gmail.com', NULL, '$2b$10$4pGfVRUlh6EGWP70y2Mwp.Z4XnEgp.HGrpS5Sf9/a5/3ZoZpArVgu', 1, NULL),
(28, 2, 'Venus', 'Page', NULL, 'mayarialunsina@gmail.com', NULL, '$2b$10$Q1Sh3n/HEk5BsrXnW6d.N.kbL852I/m1XPTcftQy9XLIrSiAXD752', 1, NULL),
(29, 2, 'Mary', 'Malaga', NULL, 'mavilovesmary@gmail.com', NULL, '$2b$10$xXiJJESK2hBqUrWyP32yUeYrvRwVx703OYqZtUTPd4wg6b2a1D7hG', 1, NULL),
(30, 2, 'Josefina', 'Alfaro', NULL, 'josefina@gmail.com', NULL, '$2b$10$dj3AcdDlSfsN8qi1ZHt.zegRK./8eLRSxo6U6ndyeoAhdZuIBO5OO', 1, NULL),
(31, 2, 'Ernesto', 'Malaga', NULL, 'ernesto@gmail.com', NULL, '$2b$10$CibF3jN/EKj9VMF0B6qpNOP6IzhNfAUE5zumuI9w1CduSBZK/HnTW', 1, NULL),
(32, 2, 'Test', 'User', NULL, 'testuser@example.com', NULL, '$2b$10$oiaseUJoS0mS/becfhA82.Hd10C5aGcBYzX.LoQiuNTgsevJ6nrX2', 1, NULL),
(33, 2, 'Alvin', 'Yago', NULL, 'alvinsymo@gmail.com', NULL, '$2b$10$1lqG9Kp0DB46y91asAgErOq2uOFW3CN65XbLi5hk3cR3q5epz5eyK', 1, NULL),
(34, 2, 'ewan', 'ewan', NULL, 'ewan@gmail.com', NULL, '$2b$10$P.LDw5WXePCmRouIWEWR9.L6gtlPQe3pe32AFwbQSm2cWwG.KsvVe', 1, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`CartID`),
  ADD KEY `UserID` (`UserID`),
  ADD KEY `ProductID` (`ProductID`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`ProdCategoryID`);

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
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `CartID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `ProdCategoryID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `product`
--
ALTER TABLE `product`
  MODIFY `ProductID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `productimage`
--
ALTER TABLE `productimage`
  MODIFY `ProductImageID` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`UserID`),
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`);

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
