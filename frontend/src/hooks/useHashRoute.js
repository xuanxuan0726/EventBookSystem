import { useEffect, useState } from 'react';

/**
 * Minimal hash router, so pages have shareable URLs and the browser Back button works
 * without adding a routing library.
 *   #/events     -> { page: 'events' }
 *   #/events/12  -> { page: 'event', id: 12 }
 *   #/bookings   -> { page: 'bookings' }
 *   #/admin      -> { page: 'admin' }
 */
function parse(hash) {
  const path = hash.replace(/^#/, '') || '/events';
  const event = path.match(/^\/events\/(\d+)$/);
  if (event) return { page: 'event', id: Number(event[1]) };
  if (path === '/bookings') return { page: 'bookings' };
  if (path === '/admin') return { page: 'admin' };
  return { page: 'events' };
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash));

  useEffect(() => {
    const onChange = () => {
      setRoute(parse(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export const eventPath = (id) => `#/events/${id}`;
