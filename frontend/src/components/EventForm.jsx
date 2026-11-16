import { useRef, useState } from 'react';
import { uploadsApi } from '../api/client.js';
import { IMAGE_TYPES, validateEvent, validateImageFile } from '../utils/validation.js';
import { CATEGORY_THEME } from '../utils/categories.js';
import InputField from './InputField.jsx';
import Alert from './Alert.jsx';
import EventCover from './EventCover.jsx';

const EMPTY = {
  title: '',
  category: 'Music',
  description: '',
  location: '',
  image_url: '',
  event_date: '',
  registration_deadline: '',
  max_attendees: '50',
};

/** Admin form for creating an event. `onSubmit` returns a promise. */
export default function EventForm({ onSubmit, onAuthError }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInput = useRef(null);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((errs) => ({ ...errs, [field]: undefined }));
  };
  const update = (field) => (e) => setField(field, e.target.value);

  const uploadCover = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // allow choosing the same file again later
    if (!file) return;

    const problem = validateImageFile(file);
    if (problem) {
      setErrors((errs) => ({ ...errs, image_url: problem }));
      return;
    }

    setUploading(true);
    try {
      const res = await uploadsApi.image(file);
      setField('image_url', res.data.url);
      setFileName(file.name);
    } catch (err) {
      if (err.status === 401) onAuthError?.();
      setErrors((errs) => ({ ...errs, image_url: err.message }));
    } finally {
      setUploading(false);
    }
  };

  const clearCover = () => {
    setField('image_url', '');
    setFileName('');
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
      setFileName('');
    } catch (err) {
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  };

  const uploaded = form.image_url.startsWith('/uploads/');

  return (
    <form className="card stack" onSubmit={submit} noValidate>
      <h3>Create event</h3>
      <InputField label="Title" value={form.title} onChange={update('title')} error={errors.title} maxLength={150} />
      <InputField label="Description" hint="(optional)" textarea rows={3} value={form.description} onChange={update('description')} error={errors.description} />
      <div className="field">
        <label htmlFor="event-category">Category</label>
        <select id="event-category" value={form.category} onChange={update('category')}>
          {Object.entries(CATEGORY_THEME).map(([name, t]) => (
            <option key={name} value={name}>
              {t.emoji} {name}
            </option>
          ))}
        </select>
      </div>
      <InputField label="Location" value={form.location} onChange={update('location')} error={errors.location} maxLength={150} />

      {/* Cover image: upload from computer, or paste a link */}
      <div className={`field ${errors.image_url ? 'has-error' : ''}`}>
        <label>
          Cover image <span className="hint">(optional, JPG/PNG/WEBP/GIF up to 5 MB)</span>
        </label>
        <div className="cover-picker">
          {/* key forces a fresh <img> (and error state) whenever the image changes */}
          <EventCover key={form.image_url} event={form} className="cover-preview" width={96} />
          <div className="cover-controls">
            <div className="cover-buttons">
              <button type="button" className="btn ghost small" disabled={uploading} onClick={() => fileInput.current.click()}>
                {uploading ? 'Uploading…' : 'Upload from computer'}
              </button>
              {form.image_url && (
                <button type="button" className="btn ghost small" onClick={clearCover}>
                  Remove
                </button>
              )}
            </div>
            {uploaded ? (
              <p className="small muted">Uploaded: {fileName || 'image'}</p>
            ) : (
              <input
                type="url"
                placeholder="…or paste an image link (https://…)"
                value={form.image_url}
                onChange={update('image_url')}
                aria-label="Cover image link"
                maxLength={500}
              />
            )}
          </div>
          <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} onChange={uploadCover} hidden />
        </div>
        {errors.image_url && <p className="field-error">{errors.image_url}</p>}
      </div>

      <div className="row">
        <InputField label="Date & time" type="datetime-local" value={form.event_date} onChange={update('event_date')} error={errors.event_date} />
        <InputField label="Max attendees" type="number" min="1" value={form.max_attendees} onChange={update('max_attendees')} error={errors.max_attendees} />
      </div>
      <InputField
        label="Registration deadline"
        hint="(optional, defaults to the event start)"
        type="datetime-local"
        value={form.registration_deadline}
        max={form.event_date || undefined}
        onChange={update('registration_deadline')}
        error={errors.registration_deadline}
      />
      <Alert>{serverError}</Alert>
      <button className="btn primary" disabled={submitting || uploading}>
        {submitting ? 'Creating…' : 'Create event'}
      </button>
    </form>
  );
}
