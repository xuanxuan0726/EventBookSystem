// Backend dates are "YYYY-MM-DD HH:MM:SS" in the event's local time.
const toDate = (value) => new Date(value.replace(' ', 'T'));

export const formatDateTime = (value) =>
  toDate(value).toLocaleString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatDay = (value) =>
  toDate(value).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });

/** "2026-12-10 09:00:00" -> "2026-12-10" (the calendar date used for the same-date rule) */
export const dayOf = (value) => value.slice(0, 10);
