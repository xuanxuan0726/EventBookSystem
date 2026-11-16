# EventBook – Frontend (React + Vite)

```bash
npm install
npm run dev       # starts the PHP API (port 8000) and Vite (port 5173) together
npm run dev:web   # Vite only (if you run the PHP API yourself)
npm run build     # production build to dist/
```

`/api/*` is proxied to `http://localhost:8000` in development. For a production build served
from a different origin, set `VITE_API_URL` (e.g. `VITE_API_URL=https://api.example.com/api`).

## Structure
```
src/
├── api/client.js            fetch wrapper (JSON + file upload); throws ApiError(message, status, errors)
├── context/AuthContext.jsx  admin session (token in localStorage, verified via /admin/me)
├── hooks/
│   ├── useEvents.js         events + filters with debounce, abort, loading & error state
│   └── useHashRoute.js      #/events, #/events/:id, #/bookings, #/admin (Back button works)
├── components/
│   ├── EventCard.jsx        compact card: cover, title, date, slots status, register button
│   ├── EventCover.jsx       event photo (resized for its slot) with a category-themed fallback
│   ├── EventStatus.jsx      Sold / Registration closed / Only N left / N Seats available / Ended
│   ├── FilterBar.jsx        search + date + category + sort (Events, My Bookings, admin)
│   ├── BookingCard.jsx      one booking with status pill, history dates, cancel
│   ├── RegistrationForm.jsx name/email form, client validation, same-date pre-check
│   ├── InputField.jsx       labelled input with inline error
│   ├── EventForm.jsx        admin create-event form (cover upload, registration deadline)
│   ├── RegistrationTable.jsx admin registrations table with status
│   ├── Modal.jsx, Alert.jsx, Loader.jsx, Header.jsx, icons.jsx
├── pages/                   EventsPage, EventDetailsPage, MyBookingsPage, AdminPage
└── utils/                   format, validation, bookings, storage, categories
```

See the root `README.md` for the full documentation.
