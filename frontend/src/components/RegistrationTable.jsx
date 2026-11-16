import { formatDateTime } from '../utils/format.js';

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
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {registrations.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              {showAttendee && (
                <td>
                  {r.name}
                  <div className="muted small">{r.email}</div>
                </td>
              )}
              <td>
                {r.event_title}
                <div className="muted small">{r.location}</div>
              </td>
              <td className="small">{formatDateTime(r.event_date)}</td>
              <td className="right">
                <button className="btn danger small" disabled={cancellingId === r.id} onClick={() => onCancel(r)}>
                  {cancellingId === r.id ? 'Cancelling…' : 'Cancel'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
