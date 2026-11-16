import { useState } from 'react';
import { validateEvent } from '../utils/validation.js';
import InputField from './InputField.jsx';
import Alert from './Alert.jsx';

const EMPTY = { title: '', description: '', location: '', event_date: '', max_attendees: '50' };

/** Admin form for creating an event. `onSubmit` returns a promise. */
export default function EventForm({ onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    const fieldErrors = validateEvent(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit({ ...form, max_attendees: Number(form.max_attendees) });
      setForm(EMPTY);
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card stack" onSubmit={submit} noValidate>
      <h3>Create event</h3>
      <InputField label="Title" value={form.title} onChange={update('title')} error={errors.title} maxLength={150} />
      <InputField label="Description" hint="(optional)" textarea rows={3} value={form.description} onChange={update('description')} error={errors.description} />
      <InputField label="Location" value={form.location} onChange={update('location')} error={errors.location} maxLength={150} />
      <div className="row">
        <InputField label="Date & time" type="datetime-local" value={form.event_date} onChange={update('event_date')} error={errors.event_date} />
        <InputField label="Max attendees" type="number" min="1" value={form.max_attendees} onChange={update('max_attendees')} error={errors.max_attendees} />
      </div>
      <Alert>{serverError}</Alert>
      <button className="btn primary" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create event'}
      </button>
    </form>
  );
}
