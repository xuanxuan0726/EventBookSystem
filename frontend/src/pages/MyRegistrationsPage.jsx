import { useState } from 'react';
import { registrationsApi } from '../api/client.js';
import { isValidEmail } from '../utils/validation.js';
import { readLastEmail } from '../utils/storage.js';
import RegistrationTable from '../components/RegistrationTable.jsx';
import Loader from '../components/Loader.jsx';
import Alert from '../components/Alert.jsx';

export default function MyRegistrationsPage() {
  const [email, setEmail] = useState(readLastEmail());
  const [searchedEmail, setSearchedEmail] = useState('');
  const [registrations, setRegistrations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const load = async (target) => {
    setLoading(true);
    setError('');
    try {
      const res = await registrationsApi.byEmail(target);
      setRegistrations(res.data);
      setSearchedEmail(target);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const search = (e) => {
    e.preventDefault();
    setNotice('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    load(email.trim());
  };

  const cancel = async (reg) => {
    if (!window.confirm(`Cancel your registration for "${reg.event_title}"?`)) return;
    setCancellingId(reg.id);
    try {
      const res = await registrationsApi.cancel(reg.id, searchedEmail);
      setNotice(res.message);
      setRegistrations((list) => list.filter((r) => r.id !== reg.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <section>
      <h2>My Registrations</h2>
      <p className="muted small">Enter the email you registered with to view or cancel your registrations.</p>

      <form className="inline-form" onSubmit={search} noValidate>
        <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        <button className="btn primary" disabled={loading}>
          {loading ? 'Searching…' : 'Find'}
        </button>
      </form>

      <Alert onClose={() => setError('')}>{error}</Alert>
      <Alert type="ok" onClose={() => setNotice('')}>{notice}</Alert>

      {loading && !registrations && <Loader />}
      {registrations && registrations.length === 0 && (
        <p className="empty">No registrations found for {searchedEmail}.</p>
      )}
      {registrations && registrations.length > 0 && (
        <RegistrationTable registrations={registrations} onCancel={cancel} cancellingId={cancellingId} />
      )}
    </section>
  );
}
