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

/** "2026-12-10 09:00:00" -> "2026-12-10" (the calendar date used for the same-date rule) */
export const dayOf = (value) => value.slice(0, 10);

/** An event is "filling fast" when 20% or fewer (and at most 10) seats remain. */
export const isFillingFast = (e) =>
  e.registration_open && e.available_slots <= Math.max(2, Math.min(10, Math.ceil(e.max_attendees * 0.2)));

/** Whether new registrations are accepted (not full, not past, deadline not reached). */
export const canRegister = (e) => Boolean(e.registration_open) && !e.is_past;

/** "in 3 days", "in 5 hours", "in 20 minutes" (for deadlines) */
export function timeUntil(value) {
  const ms = toDate(value) - Date.now();
  if (ms <= 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} minute${mins === 1 ? '' : 's'}`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  return `in ${Math.round(hours / 24)} days`;
}
