-- =============================================================
-- Mini Event Booking System - MySQL schema + seed data
-- Import:  mysql -u root < backend/database/schema.sql
-- (Re-importing resets ALL data.)
-- =============================================================
CREATE DATABASE IF NOT EXISTS event_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_booking;

DROP TABLE IF EXISTS api_tokens;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS bookings;   -- legacy table from the prototype
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS admins;

-- Admin users (for creating / deleting events)
CREATE TABLE admins (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Bearer tokens issued on admin login. Only a SHA-256 hash of the token is stored.
CREATE TABLE api_tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    admin_id   INT       NOT NULL,
    token_hash CHAR(64)  NOT NULL UNIQUE,
    expires_at DATETIME  NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE events (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    title         VARCHAR(150) NOT NULL,
    description   TEXT         NULL,
    category      VARCHAR(30)  NOT NULL DEFAULT 'Other',
    location      VARCHAR(150) NOT NULL,
    image_url     VARCHAR(500) NULL,       -- cover photo; frontend shows a themed cover if empty
    event_date    DATETIME     NOT NULL,
    max_attendees INT UNSIGNED NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date),
    INDEX idx_category (category),
    CONSTRAINT chk_max_attendees CHECK (max_attendees > 0)
) ENGINE=InnoDB;

-- One row = one person registered for one event.
-- event_day is a copy of DATE(events.event_date). It exists so the database itself
-- can enforce "one event per user per date" with a UNIQUE key (see README).
CREATE TABLE registrations (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    event_id   INT          NOT NULL,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,   -- stored lower-cased
    event_day  DATE         NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY uq_email_per_day (email, event_day),
    INDEX idx_event (event_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------
-- Default admin  ->  username: admin   password: admin123
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2y$10$Bx3.gB6zSX3QBk4gMDMt7OKNtQ3YWiP2fbotHEYH01C6bw4UV6pAu');

SET @img = 'https://images.unsplash.com/photo-%s?w=600&q=75&auto=format&fit=crop';

INSERT INTO events (id, title, category, description, location, image_url, event_date, max_attendees) VALUES
(1,  'Tech Conference 2026',      'Conference', 'A full day of talks on web development, AI and cloud from industry leaders.', 'KL Convention Centre',   REPLACE(@img, '%s', '1540575467063-178a50c2df87'), '2026-12-10 09:00:00', 200),
(2,  'Startup Networking Night',  'Networking', 'Meet founders and investors over drinks. Same day as the Tech Conference.',  'Bukit Bintang, KL',      REPLACE(@img, '%s', '1528605248644-14dd04022da1'), '2026-12-10 19:00:00', 50),
(3,  'Jazz Night',                'Music',      'Live jazz under the stars with the best local saxophonists and trumpeters.',   'Penang Art Hall',        REPLACE(@img, '%s', '1415201364774-f6f0bb35f28f'), '2026-12-18 20:00:00', 80),
(4,  'React Workshop',            'Workshop',   'Small hands-on workshop: build and deploy your first React app.',             'Online (Zoom)',          REPLACE(@img, '%s', '1498050108023-c5249f4df085'), '2027-01-05 14:00:00', 3),
(5,  'Charity Fun Run',           'Sports',     '5km fun run through the park to raise funds for local animal shelters.',      'Taman Tasik Titiwangsa', REPLACE(@img, '%s', '1452626038306-9aae5e071dd3'), '2027-01-20 07:00:00', 500),
(6,  'Neon Nights Music Festival','Music',      'Two stages, twelve DJs and a sky full of lasers. The party of the year.',       'Sepang Circuit',         REPLACE(@img, '%s', '1514525253161-7a46d19cd819'), '2026-11-28 18:00:00', 1500),
(7,  'Stand-up Comedy Night',     'Comedy',     'An intimate open-mic night with Malaysia''s funniest rising comedians.',      'TTDI, KL',               REPLACE(@img, '%s', '1475721027785-f74eccf877e2'), '2026-12-05 21:00:00', 10),
(8,  'Watercolour for Beginners', 'Arts',       'Relaxing guided painting session. All materials provided, just bring yourself.', 'Georgetown, Penang',  REPLACE(@img, '%s', '1513364776144-60967b0f800f'), '2026-12-12 10:00:00', 20),
(9,  'Product Design Summit',     'Conference', 'Case studies and live critiques from top product designers in the region.',   'Cyberjaya',              REPLACE(@img, '%s', '1505373877841-8d25f7d46678'), '2027-01-15 09:30:00', 300),
(10, 'New Year Countdown Party',  'Music',      'Ring in 2027 with live bands, confetti cannons and a midnight fireworks view.', 'Merdeka 118, KL',       REPLACE(@img, '%s', '1492684223066-81342ee5ff30'), '2026-12-31 20:00:00', 800);

INSERT INTO registrations (event_id, name, email, event_day) VALUES
(1, 'Alice Tan',   'alice@example.com', '2026-12-10'),
(3, 'Bob Lee',     'bob@example.com',   '2026-12-18'),
(4, 'Chris Ng',    'chris@example.com', '2027-01-05'),
(4, 'Dana Lim',    'dana@example.com',  '2027-01-05'),
(4, 'Evan Goh',    'evan@example.com',  '2027-01-05'),   -- React Workshop is FULL (3/3)
(6, 'Alice Tan',   'alice@example.com', '2026-11-28'),
(6, 'Farah Aziz',  'farah@example.com', '2026-11-28'),
(7, 'Gina Wong',   'gina@example.com',  '2026-12-05'),
(7, 'Hafiz Omar',  'hafiz@example.com', '2026-12-05'),
(7, 'Ivy Chen',    'ivy@example.com',   '2026-12-05'),
(7, 'Jason Lau',   'jason@example.com', '2026-12-05'),
(7, 'Kumar Raj',   'kumar@example.com', '2026-12-05'),
(7, 'Lina Ho',     'lina@example.com',  '2026-12-05'),
(7, 'Mei Ling',    'mei@example.com',   '2026-12-05'),
(7, 'Nadia Ismail','nadia@example.com', '2026-12-05'),   -- Comedy Night: 2 seats left ("filling fast")
(10,'Bob Lee',     'bob@example.com',   '2026-12-31'),
(10,'Farah Aziz',  'farah@example.com', '2026-12-31');
