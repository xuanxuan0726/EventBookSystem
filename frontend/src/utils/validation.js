// Client-side validation mirrors the backend rules for instant feedback.
// The backend remains the source of truth and re-validates everything.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) => EMAIL_RE.test(email.trim());

export function validateRegistration({ name, email }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required.';
  else if (name.trim().length > 100) errors.name = 'Name must be at most 100 characters.';

  if (!email.trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address.';
  return errors;
}

export function validateEvent({ title, location, event_date, max_attendees }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Title is required.';
  if (!location.trim()) errors.location = 'Location is required.';
  if (!event_date) errors.event_date = 'Event date is required.';
  else if (new Date(event_date) <= new Date()) errors.event_date = 'Event date must be in the future.';

  const max = Number(max_attendees);
  if (!Number.isInteger(max) || max < 1) errors.max_attendees = 'Max attendees must be at least 1.';
  return errors;
}
