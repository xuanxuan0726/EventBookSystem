import { useState } from 'react';
import { eventsApi, registrationsApi } from '../api/client.js';
import { dayOf, formatDateTime, formatDay } from '../utils/format.js';
import { validateRegistration } from '../utils/validation.js';
import InputField from './InputField.jsx';
import Alert from './Alert.jsx';
import { readLastEmail, saveLastEmail } from '../utils/storage.js';

export default function RegistrationForm({ event, onSuccess, onClose }) {
  const [form, setForm] = useState({ name: '', email: readLastEmail() });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');

    const fieldErrors = validateRegistration(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSubmitting(true);
    try {
      // Same-date pre-check for instant feedback (the backend enforces it regardless)
      const existing = await registrationsApi.byEmail(form.email.trim());
      const clash = existing.data.find((r) => dayOf(r.event_date) === dayOf(event.event_date));
      if (clash) {
        setServerError(
          clash.event_id === event.id
            ? 'You are already registered for this event.'
            : `You already registered for "${clash.event_title}" on ${formatDay(clash.event_date)}. You can only attend one event per date.`
        );
        return;
      }

      const res = await eventsApi.register(event.id, { name: form.name.trim(), email: form.email.trim() });
      saveLastEmail(form.email.trim());
      setDone(res.message);
      onSuccess();
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h3>Register for {event.title}</h3>
      <p className="muted small">
        {formatDateTime(event.event_date)} · {event.location} · {event.available_slots} slots left
      </p>

      {done ? (
        <div className="stack">
          <Alert type="ok">
            {done} A spot is reserved for <b>{form.email.trim()}</b>.
          </Alert>
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <InputField label="Full name" value={form.name} onChange={update('name')} error={errors.name} autoFocus maxLength={100} />
          <InputField label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email} maxLength={150} />
          <Alert>{serverError}</Alert>
          <button className="btn primary" disabled={submitting}>
            {submitting ? 'Registering…' : 'Confirm registration'}
          </button>
        </form>
      )}
    </>
  );
}
