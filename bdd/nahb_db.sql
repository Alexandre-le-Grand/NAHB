-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Hôte : db
-- Généré le : lun. 24 nov. 2025 à 13:34
-- Version du serveur : 10.11.15-MariaDB-ubu2204
-- Version de PHP : 8.3.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `nahb_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `Choice`
--

CREATE TABLE `Choice` (
  `id` int(11) NOT NULL,
  `text` varchar(255) NOT NULL,
  `next_PageId` int(11) DEFAULT NULL,
  `source_PageId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `Game`
--

CREATE TABLE `Game` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `storyId` int(11) NOT NULL,
  `endingPageId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `Page`
--

CREATE TABLE `Page` (
  `id` int(11) NOT NULL,
  `content` text NOT NULL,
  `isEnding` tinyint(1) NOT NULL DEFAULT 0,
  `storyId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `Story`
--

CREATE TABLE `Story` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `AuthorId` int(11) NOT NULL,
  `startPageId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `User`
--

CREATE TABLE `User` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `Choice`
--
ALTER TABLE `Choice`
  ADD PRIMARY KEY (`id`),
  ADD KEY `next_PageId` (`next_PageId`),
  ADD KEY `source_PageId` (`source_PageId`);

--
-- Index pour la table `Game`
--
ALTER TABLE `Game`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `storyId` (`storyId`),
  ADD KEY `endingPageId` (`endingPageId`);

--
-- Index pour la table `Page`
--
ALTER TABLE `Page`
  ADD PRIMARY KEY (`id`),
  ADD KEY `storyId` (`storyId`);

--
-- Index pour la table `Story`
--
ALTER TABLE `Story`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AuthorId` (`AuthorId`),
  ADD KEY `startPageId` (`startPageId`);

--
-- Index pour la table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `Choice`
--
ALTER TABLE `Choice`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Game`
--
ALTER TABLE `Game`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Page`
--
ALTER TABLE `Page`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `Story`
--
ALTER TABLE `Story`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `Choice`
--
ALTER TABLE `Choice`
  ADD CONSTRAINT `Choice_ibfk_1` FOREIGN KEY (`next_PageId`) REFERENCES `Page` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `Choice_ibfk_2` FOREIGN KEY (`source_PageId`) REFERENCES `Page` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `Game`
--
ALTER TABLE `Game`
  ADD CONSTRAINT `Game_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Game_ibfk_2` FOREIGN KEY (`storyId`) REFERENCES `Story` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Game_ibfk_3` FOREIGN KEY (`endingPageId`) REFERENCES `Page` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `Page`
--
ALTER TABLE `Page`
  ADD CONSTRAINT `Page_ibfk_1` FOREIGN KEY (`storyId`) REFERENCES `Story` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `Story`
--
ALTER TABLE `Story`
  ADD CONSTRAINT `Story_ibfk_1` FOREIGN KEY (`AuthorId`) REFERENCES `User` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `Story_ibfk_2` FOREIGN KEY (`startPageId`) REFERENCES `Page` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
