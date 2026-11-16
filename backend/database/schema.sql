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
    location      VARCHAR(150) NOT NULL,
    event_date    DATETIME     NOT NULL,
    max_attendees INT UNSIGNED NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_date (event_date),
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

INSERT INTO events (id, title, description, location, event_date, max_attendees) VALUES
(1, 'Tech Conference 2026',   'A full day of talks on web development, AI and cloud.',      'KL Convention Centre',   '2026-12-10 09:00:00', 200),
(2, 'Startup Networking Night','Meet founders and investors over drinks. Same day as the Tech Conference.', 'Bukit Bintang, KL', '2026-12-10 19:00:00', 50),
(3, 'Jazz Night',              'Live jazz performance with local artists.',                  'Penang Art Hall',        '2026-12-18 20:00:00', 80),
(4, 'React Workshop',          'Small hands-on workshop: build your first React app.',       'Online (Zoom)',          '2027-01-05 14:00:00', 3),
(5, 'Charity Fun Run',         '5km fun run to raise funds for local shelters.',             'Taman Tasik Titiwangsa', '2027-01-20 07:00:00', 500);

INSERT INTO registrations (event_id, name, email, event_day) VALUES
(1, 'Alice Tan', 'alice@example.com', '2026-12-10'),
(3, 'Bob Lee',   'bob@example.com',   '2026-12-18'),
(4, 'Chris Ng',  'chris@example.com', '2027-01-05'),
(4, 'Dana Lim',  'dana@example.com',  '2027-01-05'),
(4, 'Evan Goh',  'evan@example.com',  '2027-01-05');   -- React Workshop is now FULL (3/3)
