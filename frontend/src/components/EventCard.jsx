import { canRegister, formatDay, formatTime } from '../utils/format.js';
import { eventPath } from '../hooks/useHashRoute.js';
import { CalendarClockIcon, ChevronRight, PinIcon } from './icons.jsx';
import EventCover from './EventCover.jsx';
import EventStatus, { registerLabel } from './EventStatus.jsx';

/** Compact summary card. The full information lives on the event details page. */
export default function EventCard({ event, onRegister }) {
  const { id, title, description, location, event_date, registered_count } = event;
  const open = canRegister(event);

  return (
    <article className={`event-card ${open ? '' : 'is-disabled'}`}>
      <div className="ec-top">
        <a className="ec-thumb-btn" href={eventPath(id)} aria-label={`View details for ${title}`}>
          <EventCover event={event} className="ec-thumb" width={112} />
        </a>
        <a className="more-link" href={eventPath(id)}>
          View details <ChevronRight size={14} />
        </a>
      </div>

      <h3 className="ec-title" title={title}>
        {title}
      </h3>
      {description && (
        <p className="ec-desc" title={description}>
          {description}
        </p>
      )}

      <div className="ec-meta">
        <span>
          <PinIcon />
          {location}
        </span>
        <span>
          <CalendarClockIcon />
          {formatDay(event_date)} | {formatTime(event_date)}
        </span>
      </div>

      <div className="ec-foot">
        <span>Attendees: {registered_count.toLocaleString()}</span>
        <EventStatus event={event} />
      </div>

      <button className="btn primary ec-register" disabled={!open} onClick={() => onRegister(event)}>
        {registerLabel(event)}
      </button>
    </article>
  );
}
