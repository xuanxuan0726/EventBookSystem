import { useCallback, useEffect, useState } from 'react';
import { eventsApi } from '../api/client.js';
import { canRegister, formatDateTime, formatTime, isFillingFast, timeUntil, toDate } from '../utils/format.js';
import { themeFor } from '../utils/categories.js';
import { CalendarClockIcon, PinIcon } from '../components/icons.jsx';
import EventCover from '../components/EventCover.jsx';
import EventStatus, { registerLabel } from '../components/EventStatus.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

export default function EventDetailsPage({ id }) {
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Also called after a successful registration to refresh the seat count (no loader flash)
  const load = useCallback(
    (signal) =>
      eventsApi
        .get(id, signal)
        .then((res) => {
          setEvent(res.data);
          setError('');
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          if (err.status === 404) setNotFound(true);
          else setError(err.message);
        }),
    [id]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  if (notFound) {
    return (
      <section className="empty">
        <h2>Event not found</h2>
        <p>It may have been removed by the organizer.</p>
        <a className="btn primary" href="#/events">
          Browse events
        </a>
      </section>
    );
  }
  if (error) return <Alert>{error}</Alert>;
  if (!event) return <Loader text="Loading event…" />;

  const theme = themeFor(event.category);
  const pct = Math.min(100, (event.registered_count / event.max_attendees) * 100);
  const open = canRegister(event);
  const deadlineIn = timeUntil(event.registration_deadline);
  const sameDayDeadline = event.registration_deadline === event.event_date;

  return (
    <article className="event-page">
      <a className="back-link" href="#/events">
        ← Back to events
      </a>

      <header className="event-banner">
        <EventCover event={event} className="event-banner-img" width={1100} />
        <div className="event-banner-overlay">
          <span className="details-cat">
            {theme.emoji} {event.category}
          </span>
          <h2>{event.title}</h2>
          <p>
            <CalendarClockIcon size={18} /> {formatDateTime(event.event_date)}
            <span className="dot">•</span>
            <PinIcon size={18} /> {event.location}
          </p>
        </div>
      </header>

      <div className="event-layout">
        <div className="event-main">
          <section className="panel">
            <h3>About this event</h3>
            <p className="event-desc">{event.description || 'No description provided.'}</p>
          </section>

          <section className="panel">
            <h3>Event information</h3>
            <dl className="info-list">
              <div>
                <dt>Date</dt>
                <dd>{toDate(event.event_date).toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>{formatTime(event.event_date)}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>{event.location}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{event.category}</dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="panel booking-panel">
          <div className="slots-big">
            <b>{event.available_slots.toLocaleString()}</b>
            <span>of {event.max_attendees.toLocaleString()} slots available</span>
          </div>
          <div className="progress" aria-hidden="true">
            <div className="bar" style={{ width: `${pct}%` }} />
          </div>
          {/* The big number already shows open seats; only add the status when it says more */}
          {(!open || isFillingFast(event)) && <EventStatus event={event} />}

          <div className="deadline">
            <span className="deadline-label">Registration deadline</span>
            <b>{formatDateTime(event.registration_deadline)}</b>
            <span className={`small ${deadlineIn ? 'muted' : 'closed'}`}>
              {deadlineIn
                ? `Closes ${deadlineIn}${sameDayDeadline ? ' (when the event starts)' : ''}`
                : 'Registration has closed'}
            </span>
          </div>

          {/* Keep the form mounted once opened, so its success message survives the seat refresh
              (e.g. when this registration took the last slot) */}
          {showForm ? (
            <div className="inline-form-box">
              <RegistrationForm event={event} onSuccess={() => load()} onClose={() => setShowForm(false)} />
            </div>
          ) : (
            <button className="btn primary block" disabled={!open} onClick={() => setShowForm(true)}>
              {registerLabel(event, 'Register now')}
            </button>
          )}
          <p className="muted small center">One event per date per person.</p>
        </aside>
      </div>
    </article>
  );
}
