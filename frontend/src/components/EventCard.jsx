import { formatDateTime } from '../utils/format.js';

export default function EventCard({ event, onRegister }) {
  const { title, description, location, event_date, max_attendees, registered_count, available_slots, is_full, is_past } =
    event;
  const pct = Math.min(100, (registered_count / max_attendees) * 100);
  const disabled = is_full || is_past;

  let badge = null;
  if (is_past) badge = <span className="badge muted-badge">Ended</span>;
  else if (is_full) badge = <span className="badge sold">Full</span>;
  else if (available_slots <= 5) badge = <span className="badge low">Only {available_slots} left</span>;

  return (
    <article className={`card event-card ${disabled ? 'is-disabled' : ''}`}>
      <div className="card-top">
        <span className="date-chip">{formatDateTime(event_date)}</span>
        {badge}
      </div>
      <h3>{title}</h3>
      <p className="muted small">📍 {location}</p>
      {description && <p className="desc">{description}</p>}

      <div className="slots">
        <div className="progress" aria-hidden="true">
          <div className="bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="small">
          <b>{available_slots}</b> of {max_attendees} slots available
        </p>
      </div>

      <button className="btn primary" disabled={disabled} onClick={() => onRegister(event)}>
        {is_past ? 'Event ended' : is_full ? 'Fully booked' : 'Register'}
      </button>
    </article>
  );
}
