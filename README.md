# EventBook – Mini Event Booking System

Users can browse events and register for them, with one rule: **a user cannot register for more than one event on the same date.**

| Layer    | Tech |
|----------|------|
| Frontend | React 18 (functional components + hooks), Vite |
| Backend  | Native PHP 8.1+ (no framework), PDO, REST/JSON |
| Database | MySQL / MariaDB (InnoDB) |

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
(`http://localhost:5173`). Vite proxies `/api/*` to the PHP API, so there are no CORS issues in development.

### Run the backend separately (optional)
```bash
cd backend
php -S localhost:8000 -t public public/index.php
cd ../frontend && npm run dev:web
```
**Apache:** point a virtual host's document root at `backend/public`. The included `.htaccess` routes
every request to `index.php` and forwards the `Authorization` header.

### Demo accounts and data
- Admin login: **admin / admin123**
- *Tech Conference 2026* and *Startup Networking Night* are on the **same date**. Use them to test the same-date rule.
- *React Workshop* is **full** (3/3), so its Register button is disabled.
- *Stand-up Comedy Night* has only **2 seats left**, so it shows the "Only 2 left" status.
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
│   └── .htaccess            # Apache rewrite to index.php
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
│       ├── RegistrationController.php  # register / my registrations / cancel
│       └── AuthController.php          # admin login / me / logout
├── database/schema.sql      # Schema + seed data
└── postman_collection.json

frontend/
├── dev.js                   # Starts the PHP API and Vite together
├── vite.config.js           # Dev proxy /api -> :8000
└── src/
    ├── api/client.js        # fetch wrapper, ApiError, endpoint functions
    ├── context/AuthContext.jsx  # Admin session (token in localStorage, verified on load)
    ├── hooks/useEvents.js   # Fetch events with filters, debounce, abort, loading/error state
    ├── components/          # EventCard, EventCover, EventStatus, EventDetails, EventFilters,
    │                        # InputField, RegistrationForm, RegistrationTable, EventForm,
    │                        # Modal, Alert, Loader, Header, icons
    ├── pages/               # EventsPage, MyRegistrationsPage, AdminPage
    └── utils/               # format.js, validation.js, storage.js, categories.js
```

---

## 3. Database structure

```
admins        (id, username UNIQUE, password_hash, created_at)
api_tokens    (id, admin_id → admins, token_hash UNIQUE, expires_at, created_at)
events        (id, title, category, description, location, image_url, event_date DATETIME, max_attendees, created_at)
registrations (id, event_id → events ON DELETE CASCADE, name, email, event_day DATE, created_at)
              UNIQUE (email, event_day)
```

Design decisions:

- **One row per attendee.** A registration is one person for one event, so the capacity check is just
  `COUNT(*) < max_attendees`.
- **Available slots are computed, not stored.** `available_slots = max_attendees - COUNT(registrations)`.
  There is no counter column that could drift out of sync. Cancelling a registration deletes its row,
  so the slot is **released automatically**.
- **`registrations.event_day`** is a copy of `DATE(events.event_date)`, taken at registration time. Copying the date
  into this table lets MySQL enforce the same-date rule with the **`UNIQUE (email, event_day)`** key.
  A trigger or application code alone can't make that guarantee under concurrency.
  The same key also stops someone registering twice for the same event.
- **Emails are stored lower-cased**, so `Zoe@Test.com` and `zoe@test.com` count as the same user.
- **Deleting an event** cascades to its registrations.
- **`category`** comes from a fixed list (validated in PHP). **`image_url`** is an optional http(s) cover photo. If it's
  empty or fails to load, the card shows a gradient cover themed by category instead.
- Admin passwords use `password_hash()` (bcrypt). Tokens are stored as **SHA-256 hashes**, so a leaked
  database contains no usable tokens.

---

## 4. Validation logic

Validation runs on **both sides**. The frontend gives instant feedback, and the backend is the source of truth.

| Rule | Frontend | Backend |
|------|----------|---------|
| Name and email required, email format, max lengths | `validateRegistration()` shows inline field errors | `Validator`, returns 422 with an `errors` object per field |
| One event per user per date | Before submitting, fetches the user's registrations and blocks a date clash with a clear message | Checked inside the transaction **and** enforced by `UNIQUE(email, event_day)` → 409 |
| Event full | Button disabled ("Fully booked") | Capacity check under a row lock → 409 |
| Event already happened | Button disabled ("Event ended") | Rejected → 422 |
| Admin event fields (title, location, future date, max_attendees ≥ 1) | `validateEvent()` | `Validator` → 422 |

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
   date lock different event rows, so the lock doesn't stop them. Here `UNIQUE(email, event_day)` is the final guard:
   MySQL rejects the second insert with error 1062, and the API turns that into the normal
   *"You already registered for an event on this date."* response.

The application-level checks inside the transaction exist to give friendly messages. The lock and the
unique key are what guarantee correctness.

---

## 6. API reference

Base URL: `http://localhost:8000/api`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | `/events?date=YYYY-MM-DD&search=text&category=&location=&sort=date\|popular\|seats` | – | List events with `registered_count`, `available_slots`, `is_full`, `is_past` |
| GET    | `/events/{id}` | – | One event |
| POST   | `/events/{id}/register` | – | Body `{ name, email }` |
| GET    | `/registrations?email=` | – | A user's registrations |
| DELETE | `/registrations/{id}` | – | Body `{ email }`. Cancels a registration and releases the slot |
| POST   | `/admin/login` | – | Body `{ username, password }` → `{ token, expires_at }` |
| GET    | `/admin/me` | Bearer | Checks the token |
| POST   | `/admin/logout` | Bearer | Revokes the token |
| POST   | `/events` | Bearer | Create event `{ title, category?, description?, location, image_url?, event_date, max_attendees }` |
| DELETE | `/events/{id}` | Bearer | Delete event (and its registrations) |
| GET    | `/admin/registrations` | Bearer | All registrations |
| DELETE | `/admin/registrations/{id}` | Bearer | Cancel any registration |

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
- Past events are still listed but can't be registered for.
- **Cancellation** requires the registration id **and** the email it was made with. In production I'd email
  each attendee a signed cancellation link instead, because anyone who knows an email can look up its registrations.
- Out of scope for this test, but I'd add these next: login rate limiting, editing events (which would need to update
  `event_day` on existing registrations), pagination, email confirmations, and automated tests (PHPUnit / Vitest).
