-- =============================================================
-- Mini Event Booking System - MySQL / MariaDB schema + seed data
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
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    title                 VARCHAR(150) NOT NULL,
    description           TEXT         NULL,
    category              VARCHAR(30)  NOT NULL DEFAULT 'Other',
    location              VARCHAR(150) NOT NULL,
    image_url             VARCHAR(500) NULL,   -- http(s) link or /uploads/<file>; frontend shows a themed cover if empty
    event_date            DATETIME     NOT NULL,
    registration_deadline DATETIME     NULL,   -- NULL = registration stays open until the event starts
    max_attendees         INT UNSIGNED NOT NULL,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date),
    INDEX idx_category (category),
    CONSTRAINT chk_max_attendees CHECK (max_attendees > 0)
) ENGINE=InnoDB;

-- One row = one person's booking for one event. Cancelled bookings are kept (status = 'cancelled')
-- so users can see their registration history.
--
-- event_day  is a copy of DATE(events.event_date).
-- active_day is a generated column: event_day for CONFIRMED bookings, NULL for cancelled ones.
-- UNIQUE(email, active_day) therefore enforces "one confirmed event per user per date" inside the
-- database itself. UNIQUE ignores NULLs, so a cancelled booking never blocks re-booking that date.
CREATE TABLE registrations (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    event_id     INT          NOT NULL,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL,   -- stored lower-cased
    event_day    DATE         NOT NULL,
    status       ENUM('confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
    cancelled_at DATETIME     NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_day   DATE AS (IF(status = 'confirmed', event_day, NULL)) STORED,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE KEY uq_email_active_day (email, active_day),
    INDEX idx_event_status (event_id, status),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------
-- Default admin  ->  username: admin   password: admin123
INSERT INTO admins (username, password_hash) VALUES
('admin', '$2y$10$Bx3.gB6zSX3QBk4gMDMt7OKNtQ3YWiP2fbotHEYH01C6bw4UV6pAu');

INSERT INTO events (id, title, category, description, location, image_url, event_date, registration_deadline, max_attendees) VALUES
(1,  'Tech Conference 2026',       'Conference', 'A full day of talks on web development, AI and cloud from industry leaders. Includes lunch, a networking break and a closing panel on the future of software teams.', 'KL Convention Centre',
     'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=75&auto=format&fit=crop', '2026-12-10 09:00:00', '2026-12-08 23:59:00', 200),
(2,  'Startup Networking Night',   'Networking', 'Meet founders and investors over drinks. Same day as the Tech Conference.', 'Bukit Bintang, KL',
     'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&q=75&auto=format&fit=crop', '2026-12-10 19:00:00', NULL, 50),
(3,  'Jazz Night',                 'Music',      'Live jazz under the stars with the best local saxophonists and trumpeters.', 'Penang Art Hall',
     'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&q=75&auto=format&fit=crop', '2026-12-18 20:00:00', '2026-12-17 18:00:00', 80),
(4,  'React Workshop',             'Workshop',   'Small hands-on workshop: build and deploy your first React app.', 'Online (Zoom)',
     'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=75&auto=format&fit=crop', '2027-01-05 14:00:00', '2027-01-03 23:59:00', 3),
(5,  'Charity Fun Run',            'Sports',     '5km fun run through the park to raise funds for local animal shelters.', 'Taman Tasik Titiwangsa',
     'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200&q=75&auto=format&fit=crop', '2027-01-20 07:00:00', '2027-01-15 23:59:00', 500),
(6,  'Neon Nights Music Festival', 'Music',      'Two stages, twelve DJs and a sky full of lasers. The party of the year.', 'Sepang Circuit',
     'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=75&auto=format&fit=crop', '2026-11-28 18:00:00', '2026-11-27 23:59:00', 1500),
(7,  'Stand-up Comedy Night',      'Comedy',     'An intimate open-mic night with Malaysia''s funniest rising comedians.', 'TTDI, KL',
     'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&q=75&auto=format&fit=crop', '2026-12-05 21:00:00', NULL, 10),
(8,  'Watercolour for Beginners',  'Arts',       'Relaxing guided painting session. All materials provided, just bring yourself.', 'Georgetown, Penang',
     'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200&q=75&auto=format&fit=crop', '2026-12-12 10:00:00', '2026-12-10 23:59:00', 20),
(9,  'Product Design Seminar',     'Seminar',    'Case studies and live critiques from top product designers in the region.', 'Cyberjaya',
     'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&q=75&auto=format&fit=crop', '2027-01-15 09:30:00', '2027-01-10 23:59:00', 300),
(10, 'New Year Countdown Party',   'Music',      'Ring in 2027 with live bands, confetti cannons and a midnight fireworks view.', 'Merdeka 118, KL',
     'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=75&auto=format&fit=crop', '2026-12-31 20:00:00', '2026-12-30 23:59:00', 800),
-- Already happened: shows up as "Completed" in booking history
(11, 'Autumn Coding Bootcamp',     'Workshop',   'Weekend bootcamp covering JavaScript fundamentals.', 'Online (Zoom)',
     NULL, '2026-10-10 09:00:00', NULL, 40),
-- Registration deadline has passed but the event is still upcoming: shows "Registration closed"
(12, 'Personal Finance Seminar',   'Seminar',    'Budgeting, investing and retirement planning made simple.', 'Mid Valley, KL',
     NULL, '2026-11-20 14:00:00', '2026-11-15 23:59:00', 120);

INSERT INTO registrations (event_id, name, email, event_day, status, cancelled_at) VALUES
(1,  'Alice Tan',    'alice@example.com', '2026-12-10', 'confirmed', NULL),
(3,  'Bob Lee',      'bob@example.com',   '2026-12-18', 'confirmed', NULL),
(4,  'Chris Ng',     'chris@example.com', '2027-01-05', 'confirmed', NULL),
(4,  'Dana Lim',     'dana@example.com',  '2027-01-05', 'confirmed', NULL),
(4,  'Evan Goh',     'evan@example.com',  '2027-01-05', 'confirmed', NULL),   -- React Workshop is FULL (3/3)
(6,  'Alice Tan',    'alice@example.com', '2026-11-28', 'confirmed', NULL),
(6,  'Farah Aziz',   'farah@example.com', '2026-11-28', 'confirmed', NULL),
(7,  'Gina Wong',    'gina@example.com',  '2026-12-05', 'confirmed', NULL),
(7,  'Hafiz Omar',   'hafiz@example.com', '2026-12-05', 'confirmed', NULL),
(7,  'Ivy Chen',     'ivy@example.com',   '2026-12-05', 'confirmed', NULL),
(7,  'Jason Lau',    'jason@example.com', '2026-12-05', 'confirmed', NULL),
(7,  'Kumar Raj',    'kumar@example.com', '2026-12-05', 'confirmed', NULL),
(7,  'Lina Ho',      'lina@example.com',  '2026-12-05', 'confirmed', NULL),
(7,  'Mei Ling',     'mei@example.com',   '2026-12-05', 'confirmed', NULL),
(7,  'Nadia Ismail', 'nadia@example.com', '2026-12-05', 'confirmed', NULL),   -- Comedy Night: 2 seats left
(10, 'Bob Lee',      'bob@example.com',   '2026-12-31', 'confirmed', NULL),
(10, 'Farah Aziz',   'farah@example.com', '2026-12-31', 'confirmed', NULL);

-- Alice's history: a completed past event and a cancelled booking (cancelled seats don't count)
INSERT INTO registrations (event_id, name, email, event_day, status, cancelled_at, created_at) VALUES
(11, 'Alice Tan',    'alice@example.com', '2026-10-10', 'confirmed', NULL,                  '2026-09-20 10:15:00'),
(8,  'Alice Tan',    'alice@example.com', '2026-12-12', 'cancelled', '2026-11-10 12:00:00', '2026-11-02 09:30:00');
