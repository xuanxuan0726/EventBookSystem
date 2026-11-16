import { toDate } from './format.js';

/**
 * Booking status shown to users:
 *   cancelled              -> "Cancelled"
 *   event already happened -> "Completed"
 *   otherwise              -> "Confirmed"
 */
export function bookingStatus(r) {
  if (r.status === 'cancelled') return { key: 'cancelled', label: 'Cancelled' };
  if (r.is_past) return { key: 'completed', label: 'Completed' };
  return { key: 'confirmed', label: 'Confirmed' };
}

/** Only confirmed, upcoming bookings can be cancelled (the backend enforces the same rule). */
export const isCancellable = (r) => r.status === 'confirmed' && !r.is_past;

/** Options for a status filter; values match bookingStatus().key */
export const BOOKING_STATUSES = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/**
 * Client-side search / filter / sort for booking lists (My Bookings, admin registrations).
 * Uses the same filter options as the event list, so all three tabs behave alike.
 * `searchIn(r)` returns the text the search box matches against.
 */
export function filterBookings(list, { search = '', date = '', category = '', status = '', sort = 'upcoming' }, searchIn) {
  const q = search.trim().toLowerCase();
  const now = Date.now();

  const filtered = list.filter(
    (r) =>
      (!q || searchIn(r).toLowerCase().includes(q)) &&
      (!date || r.event_date.startsWith(date)) &&
      (!category || r.category === category) &&
      (!status || bookingStatus(r).key === status)
  );

  const time = (r) => toDate(r.event_date).getTime();
  const sorters = {
    // upcoming events first (soonest at the top), then past events
    upcoming: (a, b) => (time(a) < now) - (time(b) < now) || time(a) - time(b),
    latest: (a, b) => time(b) - time(a),
    booked: (a, b) => toDate(b.created_at) - toDate(a.created_at) || b.id - a.id,
  };
  return [...filtered].sort(sorters[sort] || sorters.upcoming);
}
