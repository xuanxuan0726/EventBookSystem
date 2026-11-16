import { useAuth } from '../context/AuthContext.jsx';

const TABS = [
  { key: 'events', label: 'Events' },
  { key: 'mine', label: 'My Registrations' },
  { key: 'admin', label: 'Admin' },
];

export default function Header({ page, onNavigate }) {
  const { admin, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo">EventBook</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${page === t.key ? 'active' : ''}`}
              aria-current={page === t.key ? 'page' : undefined}
              onClick={() => onNavigate(t.key)}
            >
              {t.label}
            </button>
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
