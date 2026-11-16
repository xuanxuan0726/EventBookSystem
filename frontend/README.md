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
├── api/client.js            fetch wrapper; throws ApiError(message, status, errors)
├── context/AuthContext.jsx  admin session (token in localStorage, verified via /admin/me)
├── hooks/useEvents.js       events + filters with debounce, abort, loading & error state
├── components/
│   ├── EventCard.jsx        title, date, available slots, register button (disabled when full/past)
│   ├── EventCover.jsx       event photo with a category-themed fallback
│   ├── EventStatus.jsx      Sold / Only N left / N Seats available / Ended
│   ├── EventDetails.jsx     "More details" view
│   ├── EventFilters.jsx     search + date filter
│   ├── RegistrationForm.jsx name/email form, client validation, same-date pre-check
│   ├── InputField.jsx       labelled input with inline error
│   ├── EventForm.jsx        admin create-event form
│   ├── RegistrationTable.jsx
│   ├── Modal.jsx, Alert.jsx, Loader.jsx, Header.jsx
├── pages/                   EventsPage, MyRegistrationsPage, AdminPage
└── utils/                   format.js, validation.js, storage.js
```

See the root `README.md` for the full documentation.
