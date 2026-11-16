import { isFillingFast } from '../utils/format.js';

/** Seat status: Ended / Sold / Registration closed / Only N left / N Seats available */
export default function EventStatus({ event }) {
  if (event.is_past) return <span className="status ended">Ended</span>;
  if (event.is_full) return <span className="status sold">Sold</span>;
  if (event.registration_closed) return <span className="status ended">Registration closed</span>;
  if (isFillingFast(event)) return <span className="status hot">Only {event.available_slots} left</span>;
  return <span className="status open">{event.available_slots.toLocaleString()} Seats available</span>;
}

/** Label for a register button in each state. */
export function registerLabel(event, openLabel = 'Register') {
  if (event.is_past) return 'Event ended';
  if (event.is_full) return 'Fully booked';
  if (event.registration_closed) return 'Registration closed';
  return openLabel;
}
