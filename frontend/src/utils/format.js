// Backend dates are "YYYY-MM-DD HH:MM:SS" in the event's local time.
export const toDate = (value) => new Date(value.replace(' ', 'T'));

export const formatDateTime = (value) =>
  toDate(value).toLocaleString('en-MY', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });

/** "Dec 10, 2026" */
export const formatDay = (value) =>
  toDate(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

/** "9:00am" */
export const formatTime = (value) =>
  toDate(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();

/** 1500 -> "1.5k" */
export const compactNumber = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0)}k` : String(n);

/** "2026-12-10 09:00:00" -> "2026-12-10" (the calendar date used for the same-date rule) */
export const dayOf = (value) => value.slice(0, 10);

/** An event is "filling fast" when 20% or fewer (and at most 10) seats remain. */
export const isFillingFast = (e) =>
  !e.is_full && !e.is_past && e.available_slots <= Math.max(2, Math.min(10, Math.ceil(e.max_attendees * 0.2)));
