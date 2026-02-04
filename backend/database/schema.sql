-- ===================================================================
-- UCA BOOKING - Schéma de base de données MySQL
-- ===================================================================

-- Suppression des tables existantes (dans l'ordre inverse des dépendances)
DROP TABLE IF EXISTS `blackout_dates`;
DROP TABLE IF EXISTS `logs`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `locaux`;
DROP TABLE IF EXISTS `sites`;
DROP TABLE IF EXISTS `users`;

-- ===================================================================
-- TABLE: users
-- ===================================================================
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `google_id` VARCHAR(255) UNIQUE NOT NULL COMMENT 'ID Google OAuth',
  `email` VARCHAR(255) UNIQUE NOT NULL COMMENT 'Email académique UCA',
  `name` VARCHAR(255) NOT NULL COMMENT 'Nom complet',
  `picture` TEXT COMMENT 'URL de la photo de profil Google',
  `fonction` ENUM('Professeur', 'Personnel administratif', 'Chef de service', 'Chef de division', 'Directeur de pôle', 'Autre') DEFAULT 'Autre',
  `role` ENUM('user', 'admin') DEFAULT 'user' COMMENT 'Rôle de l\'utilisateur',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Compte actif ou non',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL COMMENT 'Dernière connexion',
  INDEX `idx_email` (`email`),
  INDEX `idx_google_id` (`google_id`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLE: sites
-- ===================================================================
CREATE TABLE `sites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `site_id` VARCHAR(50) UNIQUE NOT NULL COMMENT 'Identifiant unique du site',
  `nom` VARCHAR(255) NOT NULL COMMENT 'Nom du site',
  `adresse` TEXT COMMENT 'Adresse du site',
  `description` TEXT COMMENT 'Description du site',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Site actif ou non',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_site_id` (`site_id`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLE: locaux
-- ===================================================================
CREATE TABLE `locaux` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `site_id` INT NOT NULL COMMENT 'Référence au site',
  `nom` VARCHAR(255) NOT NULL COMMENT 'Nom du local',
  `capacite` INT NOT NULL COMMENT 'Capacité d\'accueil',
  `equipements` JSON COMMENT 'Liste des équipements disponibles',
  `statut` ENUM('disponible', 'occupé', 'maintenance') DEFAULT 'disponible',
  `contraintes` TEXT COMMENT 'Contraintes spécifiques d\'utilisation',
  `description` TEXT COMMENT 'Description du local',
  `image_url` TEXT COMMENT 'URL de l\'image du local',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Local actif ou non',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON DELETE CASCADE,
  INDEX `idx_site_id` (`site_id`),
  INDEX `idx_statut` (`statut`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLE: reservations
-- ===================================================================
CREATE TABLE `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'Utilisateur ayant créé la réservation',
  `local_id` INT NOT NULL COMMENT 'Local réservé',
  `date_debut` DATE NOT NULL COMMENT 'Date de début',
  `date_fin` DATE NOT NULL COMMENT 'Date de fin',
  `creneau` ENUM('matin', 'apres-midi', 'journee-complete') NOT NULL COMMENT 'Créneau horaire',
  `nature_evenement` ENUM('reunion', 'audience', 'convention', 'conference', 'congres') NOT NULL COMMENT 'Type d\'événement',
  `participants_estimes` INT NOT NULL COMMENT 'Nombre de participants estimés',
  `motif` TEXT NOT NULL COMMENT 'Motif de la réservation',
  `statut` ENUM('en_attente', 'confirmee', 'annulee_utilisateur', 'annulee_admin', 'refusee') DEFAULT 'en_attente',
  `priorite` ENUM('normale', 'urgente', 'presidence') DEFAULT 'normale' COMMENT 'Niveau de priorité',
  `commentaire_admin` TEXT COMMENT 'Commentaire de l\'administrateur',
  `validated_by` INT NULL COMMENT 'Admin ayant validé la réservation',
  `validated_at` TIMESTAMP NULL COMMENT 'Date de validation',
  `cancelled_by` INT NULL COMMENT 'Utilisateur ayant annulé',
  `cancelled_at` TIMESTAMP NULL COMMENT 'Date d\'annulation',
  `cancellation_reason` TEXT COMMENT 'Raison de l\'annulation',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`local_id`) REFERENCES `locaux`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`validated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_local_id` (`local_id`),
  INDEX `idx_date_debut` (`date_debut`),
  INDEX `idx_date_fin` (`date_fin`),
  INDEX `idx_statut` (`statut`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLE: logs
-- ===================================================================
CREATE TABLE `logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NULL COMMENT 'Utilisateur concerné',
  `action` VARCHAR(100) NOT NULL COMMENT 'Type d\'action',
  `entity_type` VARCHAR(50) COMMENT 'Type d\'entité (reservation, local, user...)',
  `entity_id` INT COMMENT 'ID de l\'entité concernée',
  `details` JSON COMMENT 'Détails de l\'action',
  `ip_address` VARCHAR(45) COMMENT 'Adresse IP',
  `user_agent` TEXT COMMENT 'User agent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_entity` (`entity_type`, `entity_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- TABLE: blackout_dates (Jours non réservables)
-- ===================================================================
CREATE TABLE `blackout_dates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL UNIQUE,
  `raison` VARCHAR(255) NOT NULL COMMENT 'Raison (férié, maintenance...)',
  `created_by` INT NULL COMMENT 'Admin ayant créé',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================
-- VUE: Statistiques des réservations par local
-- ===================================================================
CREATE OR REPLACE VIEW `v_stats_locaux` AS
SELECT 
  l.id,
  l.nom,
  s.nom as site_nom,
  COUNT(r.id) as total_reservations,
  SUM(CASE WHEN r.statut = 'confirmee' THEN 1 ELSE 0 END) as reservations_confirmees,
  SUM(CASE WHEN r.statut = 'en_attente' THEN 1 ELSE 0 END) as reservations_en_attente,
  SUM(CASE WHEN r.statut IN ('annulee_utilisateur', 'annulee_admin') THEN 1 ELSE 0 END) as reservations_annulees,
  ROUND(AVG(r.participants_estimes), 0) as participants_moyens,
  ROUND((SUM(CASE WHEN r.statut = 'confirmee' THEN 1 ELSE 0 END) / NULLIF(COUNT(r.id), 0)) * 100, 2) as taux_confirmation
FROM locaux l
LEFT JOIN sites s ON l.site_id = s.id
LEFT JOIN reservations r ON l.id = r.local_id
WHERE l.is_active = TRUE
GROUP BY l.id, l.nom, s.nom;

-- ===================================================================
-- VUE: Historique utilisateur
-- ===================================================================
CREATE OR REPLACE VIEW `v_user_history` AS
SELECT 
  u.id as user_id,
  u.name,
  u.email,
  COUNT(r.id) as total_reservations,
  SUM(CASE WHEN r.statut = 'confirmee' THEN 1 ELSE 0 END) as confirmees,
  SUM(CASE WHEN r.statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
  SUM(CASE WHEN r.statut IN ('annulee_utilisateur', 'annulee_admin') THEN 1 ELSE 0 END) as annulees,
  MAX(r.created_at) as derniere_reservation
FROM users u
LEFT JOIN reservations r ON u.id = r.user_id
GROUP BY u.id, u.name, u.email;

-- ===================================================================
-- PROCÉDURE: Vérifier les conflits de réservation
-- ===================================================================
DELIMITER //

CREATE PROCEDURE `check_reservation_conflict`(
  IN p_local_id INT,
  IN p_date_debut DATE,
  IN p_date_fin DATE,
  IN p_creneau VARCHAR(50),
  IN p_reservation_id INT
)
BEGIN
  SELECT COUNT(*) as conflict_count
  FROM reservations
  WHERE local_id = p_local_id
    AND statut IN ('confirmee', 'en_attente')
    AND (id != p_reservation_id OR p_reservation_id IS NULL)
    AND (
      (date_debut <= p_date_fin AND date_fin >= p_date_debut)
      AND (creneau = p_creneau OR creneau = 'journee-complete' OR p_creneau = 'journee-complete')
    );
END //

DELIMITER ;

-- ===================================================================
-- TRIGGER: Mettre à jour le statut du local après réservation
-- ===================================================================
DELIMITER //

CREATE TRIGGER `update_local_statut_after_reservation`
AFTER INSERT ON `reservations`
FOR EACH ROW
BEGIN
  IF NEW.statut = 'confirmee' AND NEW.date_debut = CURDATE() THEN
    UPDATE locaux 
    SET statut = 'occupé' 
    WHERE id = NEW.local_id;
  END IF;
END //

DELIMITER ;

-- ===================================================================
-- TRIGGER: Logger les modifications de réservations
-- ===================================================================
DELIMITER //

CREATE TRIGGER `log_reservation_changes`
AFTER UPDATE ON `reservations`
FOR EACH ROW
BEGIN
  INSERT INTO logs (user_id, action, entity_type, entity_id, details)
  VALUES (
    NEW.user_id,
    CASE 
      WHEN NEW.statut != OLD.statut THEN CONCAT('reservation_status_changed_', NEW.statut)
      ELSE 'reservation_updated'
    END,
    'reservation',
    NEW.id,
    JSON_OBJECT(
      'old_status', OLD.statut,
      'new_status', NEW.statut,
      'local_id', NEW.local_id,
      'date_debut', NEW.date_debut,
      'date_fin', NEW.date_fin
    )
  );
END //

DELIMITER ;

-- ===================================================================
-- FIN DU SCHÉMA
-- ===================================================================