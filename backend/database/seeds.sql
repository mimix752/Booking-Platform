-- ===================================================================
-- UCA BOOKING - Données initiales (Seeds)
-- ===================================================================

-- ===================================================================
-- INSERTION DES SITES
-- ===================================================================
INSERT INTO `sites` (`site_id`, `nom`, `adresse`, `description`, `is_active`) VALUES
('bibliotheque', 'Bibliothèque', 'Campus UCA, Marrakech', 'Bibliothèque universitaire centrale avec espaces de travail et salles de conférence', TRUE),
('cite-innovation', 'Cité d\'Innovation', 'Quartier Industriel, Marrakech', 'Centre d\'innovation et d\'entrepreneuriat de l\'UCA', TRUE),
('centre-conferences', 'Centre de Conférences', 'Présidence UCA, Marrakech', 'Centre de conférences moderne avec équipements audiovisuels de pointe', TRUE),
('presidence', 'Présidence', 'Avenue Abdelkrim Khattabi, Marrakech', 'Bâtiment de la Présidence de l\'Université Cadi Ayyad', TRUE);

-- ===================================================================
-- INSERTION DES LOCAUX - BIBLIOTHÈQUE
-- ===================================================================
INSERT INTO `locaux` (`site_id`, `nom`, `capacite`, `equipements`, `statut`, `description`, `is_active`) VALUES
(1, 'Salle de Lecture A', 50, '["Tables de travail", "Wifi", "Prises électriques", "Climatisation"]', 'disponible', 'Grande salle de lecture silencieuse', TRUE),
(1, 'Salle de Lecture B', 40, '["Tables de travail", "Wifi", "Prises électriques", "Climatisation"]', 'disponible', 'Salle de lecture avec vue sur le jardin', TRUE),
(1, 'Salle de Conférence Bibliothèque', 100, '["Vidéoprojecteur", "Écran géant", "Sonorisation", "Wifi", "Climatisation", "Tableau blanc"]', 'disponible', 'Salle de conférence moderne', TRUE),
(1, 'Salle de Réunion Doc', 20, '["Vidéoprojecteur", "Écran", "Wifi", "Tableau blanc", "Climatisation"]', 'disponible', 'Salle de réunion pour les documentalistes', TRUE),
(1, 'Espace Multimédia', 30, '["Ordinateurs", "Wifi", "Imprimante", "Scanner", "Climatisation"]', 'disponible', 'Espace équipé de matériel informatique', TRUE),
(1, 'Salle de Formation', 25, '["Vidéoprojecteur", "Ordinateurs portables", "Wifi", "Tableau blanc", "Climatisation"]', 'disponible', 'Salle dédiée aux formations', TRUE);

-- ===================================================================
-- INSERTION DES LOCAUX - CITÉ D'INNOVATION
-- ===================================================================
INSERT INTO `locaux` (`site_id`, `nom`, `capacite`, `equipements`, `statut`, `description`, `is_active`) VALUES
(2, 'Salle de Brainstorming', 15, '["Tableaux blancs", "Post-it", "Marqueurs", "Wifi", "Écran interactif"]', 'disponible', 'Espace créatif pour séances de brainstorming', TRUE),
(2, 'Lab Innovation 1', 30, '["Imprimante 3D", "Ordinateurs", "Wifi", "Outils de prototypage"]', 'disponible', 'Laboratoire d\'innovation et prototypage', TRUE),
(2, 'Lab Innovation 2', 30, '["Imprimante 3D", "Ordinateurs", "Wifi", "Outils de prototypage"]', 'disponible', 'Second laboratoire d\'innovation', TRUE),
(2, 'Salle de Pitch', 60, '["Vidéoprojecteur", "Sonorisation", "Écran géant", "Wifi", "Scène"]', 'disponible', 'Salle pour présentations et pitch', TRUE),
(2, 'Espace Coworking A', 40, '["Wifi", "Prises électriques", "Climatisation", "Café"]', 'disponible', 'Espace de travail collaboratif', TRUE),
(2, 'Espace Coworking B', 40, '["Wifi", "Prises électriques", "Climatisation", "Café"]', 'disponible', 'Second espace de coworking', TRUE),
(2, 'Salle de Réunion Innovation', 12, '["Écran TV", "Wifi", "Tableau blanc", "Visioconférence"]', 'disponible', 'Petite salle de réunion moderne', TRUE);

-- ===================================================================
-- INSERTION DES LOCAUX - CENTRE DE CONFÉRENCES
-- ===================================================================
INSERT INTO `locaux` (`site_id`, `nom`, `capacite`, `equipements`, `statut`, `description`, `is_active`) VALUES
(3, 'Amphithéâtre Principal', 300, '["Vidéoprojecteur", "Écran géant", "Sonorisation professionnelle", "Wifi", "Éclairage scénique", "Cabine de traduction"]', 'disponible', 'Grand amphithéâtre pour événements majeurs', TRUE),
(3, 'Amphithéâtre B', 150, '["Vidéoprojecteur", "Écran géant", "Sonorisation", "Wifi", "Climatisation"]', 'disponible', 'Amphithéâtre de taille moyenne', TRUE),
(3, 'Salle de Conférence 1', 80, '["Vidéoprojecteur", "Écran", "Sonorisation", "Wifi", "Tableau blanc", "Visioconférence"]', 'disponible', 'Salle de conférence équipée', TRUE),
(3, 'Salle de Conférence 2', 80, '["Vidéoprojecteur", "Écran", "Sonorisation", "Wifi", "Tableau blanc", "Visioconférence"]', 'disponible', 'Salle de conférence équipée', TRUE),
(3, 'Salle VIP', 30, '["Mobilier premium", "Écran TV", "Wifi", "Service traiteur", "Climatisation"]', 'disponible', 'Salle pour réceptions officielles', TRUE),
(3, 'Foyer Principal', 200, '["Tables cocktail", "Wifi", "Sonorisation", "Éclairage d\'ambiance"]', 'disponible', 'Grand foyer pour pauses café et networking', TRUE);

-- ===================================================================
-- INSERTION DES LOCAUX - PRÉSIDENCE
-- ===================================================================
INSERT INTO `locaux` (`site_id`, `nom`, `capacite`, `equipements`, `statut`, `description`, `is_active`) VALUES
(4, 'Salle du Conseil', 50, '["Table de conférence", "Vidéoprojecteur", "Sonorisation", "Wifi", "Climatisation", "Visioconférence"]', 'disponible', 'Salle du conseil d\'université', TRUE),
(4, 'Salle de Réunion Présidence', 25, '["Table de réunion", "Écran TV", "Wifi", "Tableau blanc", "Climatisation"]', 'disponible', 'Salle de réunion principale', TRUE),
(4, 'Salon d\'Honneur', 40, '["Mobilier luxe", "Écran TV", "Wifi", "Climatisation", "Service traiteur"]', 'disponible', 'Salon pour réceptions officielles', TRUE),
(4, 'Bureau du Président', 10, '["Bureau", "Écran TV", "Wifi", "Climatisation"]', 'disponible', 'Bureau présidentiel pour audiences', TRUE),
(4, 'Salle des Signatures', 20, '["Table de signature", "Écran TV", "Wifi", "Climatisation"]', 'disponible', 'Salle dédiée aux signatures de conventions', TRUE);

-- ===================================================================
-- INSERTION UTILISATEUR ADMIN PAR DÉFAUT
-- ===================================================================
INSERT INTO `users` (`google_id`, `email`, `name`, `fonction`, `role`, `is_active`) VALUES
('admin_default_id', 'admin@uca.ma', 'Administrateur UCA', 'Autre', 'admin', TRUE);

-- ===================================================================
-- INSERTION DE QUELQUES BLACKOUT DATES (JOURS FÉRIÉS 2026)
-- ===================================================================
INSERT INTO `blackout_dates` (`date`, `raison`, `created_by`) VALUES
('2026-01-01', 'Jour de l\'An', 1),
('2026-01-11', 'Manifeste de l\'Indépendance', 1),
('2026-05-01', 'Fête du Travail', 1),
('2026-07-30', 'Fête du Trône', 1),
('2026-08-14', 'Journée Oued Ed-Dahab', 1),
('2026-08-20', 'Révolution du Roi et du Peuple', 1),
('2026-08-21', 'Fête de la Jeunesse', 1),
('2026-11-06', 'Marche Verte', 1),
('2026-11-18', 'Fête de l\'Indépendance', 1);

-- ===================================================================
-- FIN DES SEEDS
-- ===================================================================