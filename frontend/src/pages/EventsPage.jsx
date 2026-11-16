import { useState } from 'react';
import { useEvents } from '../hooks/useEvents.js';
import EventCard from '../components/EventCard.jsx';
import EventFilters from '../components/EventFilters.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import Modal from '../components/Modal.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

export default function EventsPage() {
  const [filters, setFilters] = useState({ search: '', date: '' });
  const { events, loading, error, reload } = useEvents(filters);
  const [selected, setSelected] = useState(null);

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Events</h2>
          <p className="muted small">You can register for one event per date.</p>
        </div>
        <EventFilters filters={filters} onChange={setFilters} />
      </div>

      {error && (
        <Alert>
          {error}{' '}
          <button className="link" onClick={reload}>
            Try again
          </button>
        </Alert>
      )}
      {loading && events.length === 0 && <Loader text="Loading events…" />}
      {!loading && !error && events.length === 0 && (
        <p className="empty">No events match your filters.</p>
      )}

      <div className={`grid ${loading && events.length ? 'is-refreshing' : ''}`}>
        {events.map((event) => (
          <EventCard key={event.id} event={event} onRegister={setSelected} />
        ))}
      </div>

      {selected && (
        <Modal title={`Register for ${selected.title}`} onClose={() => setSelected(null)}>
          <RegistrationForm event={selected} onSuccess={reload} onClose={() => setSelected(null)} />
        </Modal>
      )}
    </section>
  );
}
