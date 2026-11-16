import { useState } from 'react';
import { useEvents } from '../hooks/useEvents.js';
import EventCard from '../components/EventCard.jsx';
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import Modal from '../components/Modal.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

const EVENT_SORTS = [
  { value: 'upcoming', label: 'Upcoming first' },
  { value: 'latest', label: 'Latest date first' },
  { value: 'popular', label: 'Most popular' },
];

export default function EventsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const { events, loading, error, reload } = useEvents(filters);
  const [registering, setRegistering] = useState(null);

  return (
    <section>
      <div className="page-head">
        <h2>Events</h2>
        <p className="muted small">You can register for one event per date.</p>
      </div>
      <FilterBar
        filters={filters}
        onChange={setFilters}
        searchPlaceholder="Search event name or location…"
        sorts={EVENT_SORTS}
      />

      {error && (
        <Alert>
          {error}{' '}
          <button className="link" onClick={reload}>
            Try again
          </button>
        </Alert>
      )}
      {loading && events.length === 0 && <Loader text="Loading events…" />}
      {!loading && !error && events.length === 0 && <p className="empty">No events match your filters.</p>}

      <div className={`grid ${loading && events.length ? 'is-refreshing' : ''}`}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} onRegister={setRegistering} />
        ))}
      </div>

      {registering && (
        <Modal title={`Register for ${registering.title}`} onClose={() => setRegistering(null)}>
          <RegistrationForm event={registering} onSuccess={reload} onClose={() => setRegistering(null)} />
        </Modal>
      )}
    </section>
  );
}
