import { formatDateTime } from '../utils/format.js';
import { themeFor } from '../utils/categories.js';
import { CalendarClockIcon, PinIcon, UsersIcon } from './icons.jsx';
import EventCover from './EventCover.jsx';
import EventStatus from './EventStatus.jsx';

/** Full event info shown from "More details". */
export default function EventDetails({ event, onRegister }) {
  const { title, category, description, location, event_date, max_attendees, registered_count, is_full, is_past } = event;
  const pct = Math.min(100, (registered_count / max_attendees) * 100);

  return (
    <div className="details">
      <EventCover event={event} className="details-cover" />
      <span className="details-cat">
        {themeFor(category).emoji} {category}
      </span>
      <h3>{title}</h3>

      <ul className="details-meta">
        <li>
          <CalendarClockIcon size={18} /> {formatDateTime(event_date)}
        </li>
        <li>
          <PinIcon size={18} /> {location}
        </li>
        <li>
          <UsersIcon size={18} /> {registered_count} of {max_attendees.toLocaleString()} attending
        </li>
      </ul>

      <div className="progress" aria-hidden="true">
        <div className="bar" style={{ width: `${pct}%` }} />
      </div>
      <EventStatus event={event} />

      {description && <p className="details-desc">{description}</p>}

      <button className="btn primary" disabled={is_full || is_past} onClick={() => onRegister(event)}>
        {is_past ? 'Event ended' : is_full ? 'Fully booked' : 'Register for this event'}
      </button>
    </div>
  );
}
