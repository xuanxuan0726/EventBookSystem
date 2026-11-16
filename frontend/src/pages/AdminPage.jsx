import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { eventsApi, registrationsApi } from '../api/client.js';
import { formatDateTime } from '../utils/format.js';
import EventForm from '../components/EventForm.jsx';
import RegistrationTable from '../components/RegistrationTable.jsx';
import InputField from '../components/InputField.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar.jsx';
import { BOOKING_STATUSES, filterBookings } from '../utils/bookings.js';

const REGISTRATION_SORTS = [
  { value: 'booked', label: 'Recently booked' },
  { value: 'upcoming', label: 'Upcoming first' },
  { value: 'latest', label: 'Latest date first' },
];
const ADMIN_FILTERS = { ...EMPTY_FILTERS, sort: 'booked' };

export default function AdminPage() {
  const { admin, checking } = useAuth();
  if (checking) return <Loader text="Checking session…" />;
  return admin ? <AdminDashboard /> : <LoginForm />;
}

function LoginForm() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('Username and password are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(form.username.trim(), form.password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <section className="narrow">
      <form className="card stack" onSubmit={submit} noValidate>
        <h2>Admin login</h2>
        <p className="muted small">Log in to create or delete events. Demo account: admin / admin123</p>
        <InputField label="Username" value={form.username} onChange={update('username')} autoComplete="username" autoFocus />
        <InputField label="Password" type="password" value={form.password} onChange={update('password')} autoComplete="current-password" />
        <Alert>{error}</Alert>
        <button className="btn primary" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </section>
  );
}

function AdminDashboard() {
  const { admin, expire } = useAuth();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filters, setFilters] = useState(ADMIN_FILTERS);

  const handleError = useCallback(
    (err) => (err.status === 401 ? expire() : setError(err.message)),
    [expire]
  );

  const load = useCallback(async () => {
    try {
      const [ev, regs] = await Promise.all([eventsApi.list(), registrationsApi.all()]);
      setEvents(ev.data);
      setRegistrations(regs.data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleRegistrations = useMemo(
    () => filterBookings(registrations, filters, (r) => `${r.event_title} ${r.name} ${r.email}`),
    [registrations, filters]
  );

  const createEvent = async (payload) => {
    try {
      const res = await eventsApi.create(payload);
      setNotice(res.message);
      load();
    } catch (err) {
      if (err.status === 401) expire();
      throw err; // EventForm shows the message / field errors
    }
  };

  const deleteEvent = async (event) => {
    const extra = event.registered_count ? ` Its ${event.registered_count} registration(s) will also be removed.` : '';
    if (!window.confirm(`Delete "${event.title}"?${extra}`)) return;
    setBusyId(`e${event.id}`);
    try {
      const res = await eventsApi.remove(event.id);
      setNotice(res.message);
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  };

  const cancelRegistration = async (reg) => {
    if (!window.confirm(`Cancel ${reg.name}'s registration for "${reg.event_title}"?`)) return;
    setBusyId(reg.id);
    try {
      const res = await registrationsApi.adminCancel(reg.id);
      setNotice(res.message);
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader text="Loading dashboard…" />;

  const totalSlots = events.reduce((s, e) => s + e.max_attendees, 0);
  const totalBooked = events.reduce((s, e) => s + e.registered_count, 0);
  const confirmedCount = registrations.filter((r) => r.status === 'confirmed').length;

  return (
    <section>
      <div className="section-head">
        <h2>Admin dashboard</h2>
        <span className="muted small">Signed in as {admin.username}</span>
      </div>

      <div className="stats">
        <Stat value={events.length} label="Events" />
        <Stat value={confirmedCount} label="Confirmed bookings" />
        <Stat value={events.filter((e) => e.is_full).length} label="Full events" />
        <Stat value={totalSlots ? `${Math.round((totalBooked / totalSlots) * 100)}%` : '–'} label="Overall fill rate" />
      </div>

      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="ok" onClose={() => setNotice('')}>{notice}</Alert>

      <div className="admin-grid">
        <EventForm onSubmit={createEvent} onAuthError={expire} />

        <div className="card">
          <h3>All events</h3>
          {events.length === 0 ? (
            <p className="empty">No events yet.</p>
          ) : (
            <ul className="event-rows">
              {events.map((e) => (
                <li key={e.id}>
                  <div>
                    <b>{e.title}</b>
                    <div className="muted small">
                      {formatDateTime(e.event_date)} · {e.registered_count}/{e.max_attendees} registered
                    </div>
                  </div>
                  <button className="btn danger small" disabled={busyId === `e${e.id}`} onClick={() => deleteEvent(e)}>
                    {busyId === `e${e.id}` ? 'Deleting…' : 'Delete'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h3 className="mt">All registrations</h3>
      {registrations.length === 0 ? (
        <p className="empty">No registrations yet.</p>
      ) : (
        <>
          <FilterBar
            filters={filters}
            onChange={setFilters}
            defaults={ADMIN_FILTERS}
            statuses={BOOKING_STATUSES}
            searchPlaceholder="Search event, name, email…"
            sorts={REGISTRATION_SORTS}
          />
          {visibleRegistrations.length === 0 ? (
            <p className="empty">No registrations match your filters.</p>
          ) : (
            <RegistrationTable registrations={visibleRegistrations} onCancel={cancelRegistration} cancellingId={busyId} showAttendee />
          )}
        </>
      )}
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
