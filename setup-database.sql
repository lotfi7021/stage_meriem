-- Créer la base de données
CREATE DATABASE IF NOT EXISTS steg_insight CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur et lui donner les privilèges
CREATE USER IF NOT EXISTS 'steg'@'localhost' IDENTIFIED BY 'steg';
GRANT ALL PRIVILEGES ON steg_insight.* TO 'steg'@'localhost';
FLUSH PRIVILEGES;

-- Sélectionner la base de données
USE steg_insight;
