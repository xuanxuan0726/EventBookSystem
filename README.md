# EventBook – Mini Event Booking System

Users can browse events and register for them, with one rule: **a user cannot register for more than one event on the same date.**

| Layer    | Tech |
|----------|------|
| Frontend | React 18 (functional components + hooks), Vite |
| Backend  | Native PHP 8.1+ (no framework), PDO, REST/JSON |
| Database | MySQL |

---

## 1. Setup

### Requirements
- PHP **8.1+** with `pdo_mysql` (XAMPP 8.2 works)
- MySQL 5.7+ / MariaDB 10.4+
- Node.js 18+

### Database
Start MySQL (e.g. from the XAMPP Control Panel), then import the schema:

```bash
C:\xampp\mysql\bin\mysql.exe -u root < backend\database\schema.sql
```

Or use phpMyAdmin: **Import**, choose `backend/database/schema.sql`, then click **Go**.
This creates the `event_booking` database with sample events and a default admin.
Re-importing resets all data.

DB credentials default to `root` with no password. You can change them in `backend/config/config.php` or with
the `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` and `DB_PASS` environment variables.

### Run (one command)
```bash
cd frontend
npm install
npm run dev
```
`npm run dev` starts **both** the PHP API (`http://localhost:8000`) and the React app
(`http://localhost:5173`). Vite proxies `/api/*` and `/uploads/*` (uploaded cover images) to the PHP server,
so there are no CORS issues in development.

### Run the backend separately (optional)
```bash
cd backend
php -S localhost:8000 -t public public/index.php
cd ../frontend && npm run dev:web
```
**Apache:** point a virtual host's document root at `backend/public`. The included `.htaccess` routes
every request to `index.php` and forwards the `Authorization` header. `backend/public/uploads/` must be
writable by the web server (uploaded cover images are stored there).

### Demo accounts and data
- Admin login: **admin / admin123**
- *Tech Conference 2026* and *Startup Networking Night* are on the **same date**. Use them to test the same-date rule.
- *React Workshop* is **full** (3/3), so its Register button is disabled.
- *Stand-up Comedy Night* has only **2 seats left**, so it shows the "Only 2 left" status.
- *Personal Finance Seminar* is upcoming but its **registration deadline has passed** ("Registration closed").
- *Autumn Coding Bootcamp* has already happened.
- **My Bookings → alice@example.com** shows every booking status: Confirmed, Completed and Cancelled.
- Sample cover photos are loaded from Unsplash, so they need an internet connection. Without one, the themed fallback covers appear.

### API testing
Import `backend/postman_collection.json` into Postman. Run **Admin login** first: it saves the token
for the admin requests automatically.

---

## 2. Project structure

```
backend/
├── public/
│   ├── index.php            # Front controller: autoload, CORS, error handler, route table
│   ├── .htaccess            # Apache rewrite to index.php
│   └── uploads/             # Uploaded cover images (scripts blocked by its own .htaccess)
├── config/config.php        # DB credentials, token TTL, CORS origins, timezone
├── src/
│   ├── Database.php         # Shared PDO connection
│   ├── Router.php           # Tiny regex router: "METHOD /path/{id}"
│   ├── Request.php          # JSON body, query params, Bearer token
│   ├── Response.php         # Uniform { success, message, data } JSON output
│   ├── Validator.php        # Field validation that collects per-field errors
│   ├── Auth.php             # Token issue / verify / revoke
│   └── Controllers/
│       ├── EventController.php         # list / filter / show / create / delete
│       ├── RegistrationController.php  # register / my bookings / cancel (soft)
│       ├── UploadController.php        # admin cover image upload
│       └── AuthController.php          # admin login / me / logout
├── database/schema.sql      # Schema + seed data
└── postman_collection.json

frontend/
├── dev.js                   # Starts the PHP API and Vite together
├── vite.config.js           # Dev proxy /api and /uploads -> :8000
└── src/
    ├── api/client.js        # fetch wrapper (JSON + file upload), ApiError, endpoint functions
    ├── context/AuthContext.jsx  # Admin session (token in localStorage, verified on load)
    ├── hooks/
    │   ├── useEvents.js     # Fetch events with filters, debounce, abort, loading/error state
    │   └── useHashRoute.js  # Tiny hash router: #/events, #/events/:id, #/bookings, #/admin
    ├── components/          # EventCard, EventCover, EventStatus, FilterBar, BookingCard,
    │                        # InputField, RegistrationForm, RegistrationTable, EventForm,
    │                        # Modal, Alert, Loader, Header, icons
    ├── pages/               # EventsPage, EventDetailsPage, MyBookingsPage, AdminPage
    └── utils/               # format, validation, bookings, storage, categories
```

---

## 3. Database structure

```
admins        (id, username UNIQUE, password_hash, created_at)
api_tokens    (id, admin_id → admins, token_hash UNIQUE, expires_at, created_at)
events        (id, title, category, description, location, image_url,
               event_date DATETIME, registration_deadline DATETIME NULL, max_attendees, created_at)
registrations (id, event_id → events ON DELETE CASCADE, name, email, event_day DATE,
               status ENUM('confirmed','cancelled'), cancelled_at, created_at,
               active_day DATE  -- generated: event_day if confirmed, else NULL
              ) UNIQUE (email, active_day)
```

Design decisions:

- **One row per attendee.** A registration is one person for one event, so the capacity check is just
  `COUNT(confirmed) < max_attendees`.
- **Cancelling is a soft delete.** The row is kept with `status = 'cancelled'` so users have a
  **registration history**. Every seat count and rule only looks at **confirmed** rows.
- **Available slots are computed, not stored.** `available_slots = max_attendees - COUNT(confirmed registrations)`.
  There is no counter column that could drift out of sync, so a cancelled booking's seat is **released automatically**.
- **The same-date rule is enforced by the database.** `registrations.event_day` is a copy of `DATE(events.event_date)`.
  `active_day` is a *generated column* that equals `event_day` for confirmed bookings and `NULL` for cancelled ones.
  The key **`UNIQUE (email, active_day)`** therefore allows only one *confirmed* booking per email per date.
  Unique keys ignore `NULL`, so a cancelled booking stays in the history without blocking a new booking on that date.
  Application code alone can't make that guarantee under concurrency. The same key also stops someone booking the same event twice.
- **`registration_deadline`** is optional. When it's empty, registration closes when the event starts.
- **Emails are stored lower-cased**, so `Zoe@Test.com` and `zoe@test.com` count as the same user.
- **Deleting an event** cascades to its registrations.
- **`category`** comes from a fixed list (validated in PHP). **`image_url`** is either an http(s) link or a path
  returned by the upload endpoint (`/uploads/<32 hex chars>.<ext>`). If it's empty or fails to load, a gradient
  cover themed by category is shown. Deleting an event also deletes its uploaded image file.
- Admin passwords use `password_hash()` (bcrypt). Tokens are stored as **SHA-256 hashes**, so a leaked
  database contains no usable tokens.

---

## 4. Validation logic

Validation runs on **both sides**. The frontend gives instant feedback, and the backend is the source of truth.

| Rule | Frontend | Backend |
|------|----------|---------|
| Name and email required, email format, max lengths | `validateRegistration()` shows inline field errors | `Validator`, returns 422 with an `errors` object per field |
| One event per user per date | Before submitting, fetches the user's registrations and blocks a date clash with a clear message | Checked inside the transaction **and** enforced by `UNIQUE(email, event_day)` → 409 |
| Event full | Button disabled ("Fully booked") | Capacity check (confirmed bookings) under a row lock → 409 |
| Event already happened | Button disabled ("Event ended") | Rejected → 422 |
| Registration deadline passed | Button disabled ("Registration closed") | Rejected → 422 |
| Cancel only confirmed, upcoming bookings | Cancel button hidden otherwise | Rejected → 409 / 422 |
| Admin event fields (title, location, future date, deadline ≤ event date, max_attendees ≥ 1, category, image) | `validateEvent()` | `Validator` → 422 |
| Cover upload: JPG/PNG/WEBP/GIF, ≤ 5 MB | Type and size checked before upload | Real type detected from file **content** (`finfo` + `getimagesize`), random file name, admin only |

Every response uses the same JSON shape:

```json
{ "success": true,  "message": "Registered successfully.", "data": { ... } }
{ "success": false, "message": "You already registered for an event on this date." }
{ "success": false, "message": "Name is required.", "errors": { "name": "Name is required." } }
```

HTTP status codes: `200/201` OK, `401` not logged in, `404` not found, `409` conflict (full, or same date),
`422` validation error, `500` server error (generic message; details go only to the server log).

---

## 5. Concurrent registrations (race conditions)

Picture two users grabbing the last slot at the same moment, or one user submitting two different
events on the same date from two tabs. A naive "check, then insert" lets both requests through.
The registration endpoint (`RegistrationController::store`) prevents this with two layers:

1. **Pessimistic row lock for capacity.** It opens a transaction and runs
   `SELECT … FROM events WHERE id = ? FOR UPDATE`. Every other registration for the *same event* now
   waits until this transaction commits or rolls back. The `COUNT(*)` it reads is therefore
   accurate, and two requests can never both take the last slot.
2. **Unique constraint for the same-date rule.** Two requests from one user for *different* events on the same
   date lock different event rows, so the lock doesn't stop them. Here `UNIQUE(email, active_day)` is the final guard:
   MySQL rejects the second insert with error 1062, and the API turns that into the normal
   *"You already registered for an event on this date."* response.

The application-level checks inside the transaction exist to give friendly messages. The lock and the
unique key are what guarantee correctness.

Cancelling runs `UPDATE … SET status = 'cancelled' WHERE id = ? AND status = 'confirmed'`, so two cancel
requests for the same booking can't both apply.

---

## 6. API reference

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/events?search=&date=YYYY-MM-DD&category=&location=&sort=upcoming\|latest\|popular` | – | List events with `registered_count`, `available_slots`, `is_full`, `is_past`, `registration_deadline`, `registration_closed`, `registration_open` |
| GET    | `/events/{id}` | – | One event (same fields) |
| POST   | `/events/{id}/register` | – | Body `{ name, email }` |
| GET    | `/registrations?email=` | – | A user's bookings **including cancelled ones** (`status`, `cancelled_at`, `is_past`) |
| DELETE | `/registrations/{id}` | – | Body `{ email }`. Marks the booking cancelled and releases the slot |
| POST   | `/admin/login` | – | Body `{ username, password }` → `{ token, expires_at }` |
| GET    | `/admin/me` | Bearer | Checks the token |
| POST   | `/admin/logout` | Bearer | Revokes the token |
| POST   | `/admin/uploads` | Bearer | `multipart/form-data` with field `image` → `{ url: "/uploads/….jpg" }` |
| POST   | `/events` | Bearer | Create event `{ title, category?, description?, location, image_url?, event_date, registration_deadline?, max_attendees }` |
| DELETE | `/events/{id}` | Bearer | Delete event (its registrations and uploaded image too) |
| GET    | `/admin/registrations` | Bearer | All registrations (all statuses) |
| DELETE | `/admin/registrations/{id}` | Bearer | Cancel any confirmed, upcoming registration |

### API authentication
`POST /admin/login` returns a random 256-bit token, valid for 8 hours. Admin requests send
`Authorization: Bearer <token>`. The server compares SHA-256 hashes against `api_tokens` and checks expiry.
Logging out deletes the token. The frontend keeps the token in `localStorage`, re-checks it with `/admin/me` on page load,
and returns to the login form on any `401`. Wrong username and wrong password produce the same message, so
the API doesn't reveal which usernames exist.

---

## 7. Assumptions (the brief was intentionally ambiguous)

- **"User"** means an **email address** (case-insensitive). There are no user accounts. The brief only asks for name and email.
- **"Same date"** means the same **calendar date** of the event start time, in the configured timezone (`Asia/Kuala_Lumpur`).
- One registration is **one seat**. There's no multi-ticket booking.
- Past events are still listed (at the end, with the default "upcoming" sort) but can't be registered for.
- **Booking status** shown to users: *Confirmed* (upcoming), *Completed* (event has happened), *Cancelled*.
  Past bookings can't be cancelled.
- Search, filters and sorting run on the server for the event list, and in the browser for My Bookings and
  the admin registrations table (those lists are already fully loaded).
- An uploaded image that is never attached to an event (the admin uploads, then abandons the form) stays on
  disk. A scheduled cleanup job would remove these in production.
- **Cancellation** requires the registration id **and** the email it was made with. In production I'd email
  each attendee a signed cancellation link instead, because anyone who knows an email can look up its registrations.
- Out of scope for this test, but I'd add these next: login rate limiting, editing events (which would need to update
  `event_day` on existing registrations), pagination, email confirmations, and automated tests (PHPUnit / Vitest).
