import { AuthProvider } from './context/AuthContext.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import Header from './components/Header.jsx';
import EventsPage from './pages/EventsPage.jsx';
import EventDetailsPage from './pages/EventDetailsPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  const route = useHashRoute();

  return (
    <AuthProvider>
      <Header page={route.page} />
      <main className="container">
        {route.page === 'events' && <EventsPage />}
        {/* key: remount (and refetch) when moving between two different events */}
        {route.page === 'event' && <EventDetailsPage key={route.id} id={route.id} />}
        {route.page === 'bookings' && <MyBookingsPage />}
        {route.page === 'admin' && <AdminPage />}
      </main>
    </AuthProvider>
  );
}
