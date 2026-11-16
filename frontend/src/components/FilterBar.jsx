import { CATEGORY_THEME } from '../utils/categories.js';

export const EMPTY_FILTERS = { search: '', date: '', category: '', sort: 'upcoming' };

const DEFAULT_SORTS = [
  { value: 'upcoming', label: 'Upcoming first' },
  { value: 'latest', label: 'Latest date first' },
];

/**
 * Search + date + category + sort controls. Shared by the Events, My Bookings
 * and admin Registrations views so they all filter the same way.
 */
export default function FilterBar({
  filters,
  onChange,
  searchPlaceholder = 'Search event name…',
  sorts = DEFAULT_SORTS,
  defaults = EMPTY_FILTERS, // what "Clear" resets to
}) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = filters.search || filters.date || filters.category || filters.sort !== defaults.sort;

  return (
    <div className="filters" role="search">
      <input
        type="search"
        className="filter-search"
        placeholder={searchPlaceholder}
        value={filters.search}
        onChange={set('search')}
        aria-label="Search"
      />
      <input type="date" value={filters.date} onChange={set('date')} aria-label="Filter by event date" />
      <select value={filters.category} onChange={set('category')} aria-label="Filter by category">
        <option value="">All categories</option>
        {Object.entries(CATEGORY_THEME).map(([name, t]) => (
          <option key={name} value={name}>
            {t.emoji} {name}
          </option>
        ))}
      </select>
      <select value={filters.sort} onChange={set('sort')} aria-label="Sort">
        {sorts.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {active && (
        <button type="button" className="btn ghost" onClick={() => onChange(defaults)}>
          Clear
        </button>
      )}
    </div>
  );
}
