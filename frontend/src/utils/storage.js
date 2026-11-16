// localStorage can throw (private mode, blocked storage), so every access is guarded.
const LAST_EMAIL_KEY = 'eventbook_last_email';

export function readLastEmail() {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveLastEmail(email) {
  try {
    localStorage.setItem(LAST_EMAIL_KEY, email);
  } catch {
    /* not critical */
  }
}
