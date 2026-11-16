import { useCallback, useEffect, useState } from 'react';
import { eventsApi } from '../api/client.js';

/** Loads events for the given filters; exposes loading/error state and a reload(). */
export function useEvents(filters = {}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const { search = '', date = '', category = '', sort = 'upcoming' } = filters;

  useEffect(() => {
    const controller = new AbortController();
    // Debounce so typing in the search box doesn't fire a request per keystroke
    const timer = setTimeout(() => {
      setLoading(true);
      eventsApi
        .list({ search, date, category, sort }, controller.signal)
        .then((res) => {
          setEvents(res.data);
          setError('');
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setError(err.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, date, category, sort, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { events, loading, error, reload };
}
