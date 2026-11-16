import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { key: 'events', label: 'Events', href: '#/events' },
  { key: 'bookings', label: 'My Bookings', href: '#/bookings' },
  { key: 'admin', label: 'Admin', href: '#/admin' },
];

export default function Header({ page }) {
  const { admin, logout } = useAuth();
  // The event details page belongs to the Events tab
  const activeTab = page === 'event' ? 'events' : page;

  return (
    <header className="header">
      <div className="header-inner">
        <a className="logo" href="#/events">
          EventBook
        </a>
        <nav className="tabs">
          {TABS.map((t) => (
            <a
              key={t.key}
              href={t.href}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              aria-current={activeTab === t.key ? 'page' : undefined}
            >
              {t.label}
            </a>
          ))}
          {admin && (
            <button className="tab" onClick={logout} title={`Signed in as ${admin.username}`}>
              Log out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
