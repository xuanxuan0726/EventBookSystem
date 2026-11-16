import { isFillingFast } from '../utils/format.js';

/** Seat status: Ended / Sold / Only N left / N Seats available */
export default function EventStatus({ event }) {
  if (event.is_past) return <span className="status ended">Ended</span>;
  if (event.is_full) return <span className="status sold">Sold</span>;
  if (isFillingFast(event)) return <span className="status hot">Only {event.available_slots} left</span>;
  return <span className="status open">{event.available_slots.toLocaleString()} Seats available</span>;
}
