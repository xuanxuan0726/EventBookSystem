// Small inline SVG icons (stroke style), so no icon library is needed.
const Icon = ({ children, size = 16, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const PinIcon = (p) => (
  <Icon {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icon>
);

/** Calendar with a small clock, as used for "date | time". */
export const CalendarClockIcon = (p) => (
  <Icon {...p}>
    <path d="M11 20H5.5A2.5 2.5 0 0 1 3 17.5v-10A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5V11" />
    <path d="M3 9.5h16M7.5 3v4M14.5 3v4" />
    <circle cx="17.5" cy="17.5" r="3.8" />
    <path d="M17.5 15.9v1.8l1.1.7" />
  </Icon>
);

export const ChevronRight = (p) => (
  <Icon {...p}>
    <path d="m9 6 6 6-6 6" />
  </Icon>
);

export const UsersIcon = (p) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
  </Icon>
);
