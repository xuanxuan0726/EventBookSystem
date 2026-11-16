import { compactNumber, formatDay, formatTime } from '../utils/format.js';
import { CalendarClockIcon, ChevronRight, PinIcon, UsersIcon } from './icons.jsx';
import EventCover from './EventCover.jsx';
import EventStatus from './EventStatus.jsx';

export default function EventCard({ event, onDetails, onRegister }) {
  const { title, description, location, event_date, registered_count, is_full, is_past } = event;
  const disabled = is_full || is_past;

  return (
    <article className={`event-card ${disabled ? 'is-disabled' : ''}`}>
      <div className="ec-top">
        <button className="ec-thumb-btn" onClick={() => onDetails(event)} aria-label={`View details for ${title}`}>
          <EventCover event={event} className="ec-thumb" />
        </button>
        <button className="more-link" onClick={() => onDetails(event)}>
          More details <ChevronRight size={14} />
        </button>
      </div>

      <div className="ec-title-row">
        <h3 title={title}>{title}</h3>
        <span className="pop-badge" title={`${registered_count} registered`}>
          {compactNumber(registered_count)}
          <UsersIcon size={11} />
        </span>
      </div>
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

      <button className="btn primary ec-register" disabled={disabled} onClick={() => onRegister(event)}>
        {is_past ? 'Event ended' : is_full ? 'Fully booked' : 'Register'}
      </button>
    </article>
  );
}
