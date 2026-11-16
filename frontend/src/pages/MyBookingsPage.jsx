import { useMemo, useState } from 'react';
import { registrationsApi } from '../api/client.js';
import { isValidEmail } from '../utils/validation.js';
import { readLastEmail } from '../utils/storage.js';
import { bookingStatus, filterBookings } from '../utils/bookings.js';
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar.jsx';
import BookingCard from '../components/BookingCard.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', match: (r) => bookingStatus(r).key === 'confirmed' },
  { key: 'history', label: 'History', match: () => true },
];

const BOOKING_SORTS = [
  { value: 'upcoming', label: 'Upcoming first' },
  { value: 'latest', label: 'Latest date first' },
  { value: 'booked', label: 'Recently booked' },
];

export default function MyBookingsPage() {
  const [email, setEmail] = useState(readLastEmail());
  const [searchedEmail, setSearchedEmail] = useState('');
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [tab, setTab] = useState('upcoming');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const load = async (target) => {
    setLoading(true);
    setError('');
    try {
      const res = await registrationsApi.byEmail(target);
      setBookings(res.data);
      setSearchedEmail(target);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const search = (e) => {
    e.preventDefault();
    setNotice('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    load(email.trim());
  };

  const cancel = async (booking) => {
    if (!window.confirm(`Cancel your registration for "${booking.event_title}"?`)) return;
    setCancellingId(booking.id);
    setError('');
    try {
      const res = await registrationsApi.cancel(booking.id, searchedEmail);
      setNotice(res.message);
      await load(searchedEmail); // refresh so the booking moves to History as "Cancelled"
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const tabDef = TABS.find((t) => t.key === tab);
  const counts = useMemo(
    () => Object.fromEntries(TABS.map((t) => [t.key, (bookings || []).filter(t.match).length])),
    [bookings]
  );
  const visible = useMemo(
    () => filterBookings((bookings || []).filter(tabDef.match), filters, (r) => `${r.event_title} ${r.location}`),
    [bookings, tabDef, filters]
  );

  return (
    <section>
      <div className="page-head">
        <h2>My Bookings</h2>
        <p className="muted small">Enter the email you registered with to see your bookings and history.</p>
      </div>

      <form className="inline-form" onSubmit={search} noValidate>
        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <button className="btn primary" disabled={loading}>
          {loading ? 'Searching…' : 'Find my bookings'}
        </button>
      </form>

      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="ok" onClose={() => setNotice('')}>{notice}</Alert>

      {loading && !bookings && <Loader />}

      {bookings && (
        <>
          <div className="seg-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`seg-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label} <span className="count">{counts[t.key]}</span>
              </button>
            ))}
          </div>

          {bookings.length > 0 && (
            <FilterBar filters={filters} onChange={setFilters} searchPlaceholder="Search event name…" sorts={BOOKING_SORTS} />
          )}

          {bookings.length === 0 && <p className="empty">No bookings found for {searchedEmail}.</p>}
          {bookings.length > 0 && visible.length === 0 && (
            <p className="empty">
              {counts[tab] === 0 && tab === 'upcoming' ? (
                <>
                  No upcoming bookings. <a href="#/events">Browse events</a>
                </>
              ) : (
                'No bookings match your filters.'
              )}
            </p>
          )}

          <div className="booking-list">
            {visible.map((b) => (
              <BookingCard key={b.id} booking={b} onCancel={cancel} cancelling={cancellingId === b.id} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
