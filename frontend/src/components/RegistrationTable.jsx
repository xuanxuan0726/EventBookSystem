import { formatDateTime } from '../utils/format.js';
import { bookingStatus, isCancellable } from '../utils/bookings.js';
import { eventPath } from '../hooks/useHashRoute.js';

export default function RegistrationTable({ registrations, onCancel, cancellingId, showAttendee = false }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            {showAttendee && <th>Attendee</th>}
            <th>Event</th>
            <th>Date</th>
            <th>Status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {registrations.map((r) => {
            const status = bookingStatus(r);
            return (
              <tr key={r.id}>
                <td>{r.id}</td>
                {showAttendee && (
                  <td>
                    {r.name}
                    <div className="muted small">{r.email}</div>
                  </td>
                )}
                <td>
                  <a href={eventPath(r.event_id)}>{r.event_title}</a>
                  <div className="muted small">{r.location}</div>
                </td>
                <td className="small">{formatDateTime(r.event_date)}</td>
                <td>
                  <span className={`pill ${status.key}`}>{status.label}</span>
                  <div className="muted small">booked {formatDateTime(r.created_at)}</div>
                </td>
                <td className="right">
                  {isCancellable(r) && (
                    <button className="btn danger small" disabled={cancellingId === r.id} onClick={() => onCancel(r)}>
                      {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
