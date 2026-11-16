import { bookingStatus, isCancellable } from '../utils/bookings.js';
import { formatDay, formatDateTime, formatTime } from '../utils/format.js';
import { eventPath } from '../hooks/useHashRoute.js';
import { CalendarClockIcon, ChevronRight, PinIcon } from './icons.jsx';
import EventCover from './EventCover.jsx';

/** One booking in "My Bookings": event summary, status, booking dates and actions. */
export default function BookingCard({ booking, onCancel, cancelling }) {
  const status = bookingStatus(booking);
  const event = { category: booking.category, image_url: booking.image_url };

  return (
    <article className={`booking-card is-${status.key}`}>
      <a href={eventPath(booking.event_id)} className="booking-thumb" aria-label={`View ${booking.event_title}`}>
        <EventCover event={event} className="booking-cover" width={120} />
      </a>

      <div className="booking-body">
        <div className="booking-title-row">
          <a href={eventPath(booking.event_id)} className="booking-title">
            {booking.event_title}
          </a>
          <span className={`pill ${status.key}`}>{status.label}</span>
        </div>

        <div className="booking-meta">
          <span>
            <CalendarClockIcon /> {formatDay(booking.event_date)} | {formatTime(booking.event_date)}
          </span>
          <span>
            <PinIcon /> {booking.location}
          </span>
        </div>

        <p className="booking-history small muted">
          Booking #{booking.id} · {booking.name} · booked {formatDateTime(booking.created_at)}
          {booking.cancelled_at && <> · cancelled {formatDateTime(booking.cancelled_at)}</>}
        </p>
      </div>

      <div className="booking-actions">
        <a className="btn ghost small" href={eventPath(booking.event_id)}>
          Event details <ChevronRight size={14} />
        </a>
        {isCancellable(booking) && (
          <button className="btn danger small" disabled={cancelling} onClick={() => onCancel(booking)}>
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        )}
      </div>
    </article>
  );
}
