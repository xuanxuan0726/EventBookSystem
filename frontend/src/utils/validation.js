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

// Paths returned by the upload endpoint, e.g. /uploads/3f9c...e1.jpg
const UPLOADED_PATH_RE = /^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp|gif)$/;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Checks a file chosen for upload before sending it (the server re-checks the real content). */
export function validateImageFile(file) {
  if (!IMAGE_TYPES.includes(file.type)) return 'Only JPG, PNG, WEBP or GIF images are allowed.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 5 MB or smaller.';
  return null;
}

export function validateEvent({ title, location, image_url = '', event_date, registration_deadline = '', max_attendees }) {
  const errors = {};
  const now = new Date();
  if (!title.trim()) errors.title = 'Title is required.';
  if (!location.trim()) errors.location = 'Location is required.';
  if (!event_date) errors.event_date = 'Event date is required.';
  else if (new Date(event_date) <= now) errors.event_date = 'Event date must be in the future.';

  if (registration_deadline) {
    if (new Date(registration_deadline) <= now) errors.registration_deadline = 'Registration deadline must be in the future.';
    else if (event_date && new Date(registration_deadline) > new Date(event_date))
      errors.registration_deadline = 'Registration deadline must be on or before the event date.';
  }

  const img = image_url.trim();
  if (img && !UPLOADED_PATH_RE.test(img) && !/^https?:\/\/\S+$/i.test(img))
    errors.image_url = 'Cover image must be an uploaded image or a valid http(s) link.';

  const max = Number(max_attendees);
  if (!Number.isInteger(max) || max < 1) errors.max_attendees = 'Max attendees must be at least 1.';
  return errors;
}
