export default function EventFilters({ filters, onChange }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = filters.search || filters.date;

  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search title or location…"
        value={filters.search}
        onChange={set('search')}
        aria-label="Search events"
      />
      <input type="date" value={filters.date} onChange={set('date')} aria-label="Filter by date" />
      {active && (
        <button className="btn ghost" onClick={() => onChange({ search: '', date: '' })}>
          Clear
        </button>
      )}
    </div>
  );
}
