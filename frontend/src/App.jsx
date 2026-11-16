import { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import Header from './components/Header.jsx';
import EventsPage from './pages/EventsPage.jsx';
import MyRegistrationsPage from './pages/MyRegistrationsPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

const PAGES = {
  events: EventsPage,
  mine: MyRegistrationsPage,
  admin: AdminPage,
};

export default function App() {
  const [page, setPage] = useState('events');
  const Page = PAGES[page];

  return (
    <AuthProvider>
      <Header page={page} onNavigate={setPage} />
      <main className="container">
        <Page />
      </main>
    </AuthProvider>
  );
}
