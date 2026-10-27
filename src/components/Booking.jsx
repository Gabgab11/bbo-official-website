import { useRef, useState } from 'react';
import { eventTypes, socials } from '../data/content.js';
import { EMAIL_RE, formsConfigured, submitBooking } from '../lib/forms.js';

const empty = { first_name: '', last_name: '', email: '', phone: '', event_type: '', event_date: '', location: '', details: '', website: '' };

function validate(v) {
  const e = {};
  if (!v.first_name.trim()) e.first_name = 'Enter your first name.';
  if (!v.last_name.trim()) e.last_name = 'Enter your last name.';
  if (!v.email.trim()) e.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter an email address like name@example.com.';
  if (!v.event_type) e.event_type = 'Choose the type of event.';
  if (v.details.trim().length < 10) e.details = 'Tell us a little more about the event (at least 10 characters).';
  return e;
}

const messages = {
  network: 'Your request could not be sent because the connection failed. Check your internet connection and try again.',
  invalid: 'Some details could not be accepted. Check each field and try again.',
  server: 'The booking service did not respond. Try again in a few minutes.',
  unavailable: 'Online booking is temporarily unavailable. Please send BBO a direct message on Instagram.',
};

export default function Booking() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error
  const [failure, setFailure] = useState('');
  const formRef = useRef(null);
  const statusRef = useRef(null);
  const startedAt = useRef(Date.now());
  const instagram = socials.find((s) => s.label === 'Instagram');

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      formRef.current?.querySelector(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }
    // Quietly drop obvious bots: hidden field filled, or submitted in under 3 seconds.
    if (values.website || Date.now() - startedAt.current < 3000) {
      setStatus('success');
      return;
    }

    setStatus('sending');
    const row = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      event_type: values.event_type,
      event_date: values.event_date || null,
      location: values.location.trim() || null,
      details: values.details.trim(),
    };
    const result = await submitBooking(row);
    if (result.ok) {
      setStatus('success');
      setValues(empty);
    } else {
      setFailure(messages[result.reason] || messages.server);
      setStatus('error');
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  const field = (name) => ({
    id: `book-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `book-${name}-error` : undefined,
  });
  const FieldError = ({ name }) => (errors[name] ? <span className="field__error" id={`book-${name}-error`}>{errors[name]}</span> : null);

  return (
    <section className="section on-light booking" id="booking" aria-labelledby="booking-title">
      <div className="container booking__grid">
        <div className="booking__intro">
          <h2 className="section-title" id="booking-title">Invite BBO to minister</h2>
          <p className="lede">Tell us about your church service, concert, conference or celebration. Every request is read by BBO’s team, who reply by email.</p>
          <ul className="booking__notes">
            <li>Include the date, city and expected audience if you know them.</li>
            <li>For international events, allow extra time for travel arrangements.</li>
            <li>
              Prefer a direct message? Reach the team on{' '}
              <a className="text-link" href={instagram.href} target="_blank" rel="noopener noreferrer">Instagram<span className="visually-hidden"> (opens in a new tab)</span></a>.
            </li>
          </ul>
        </div>

        {status === 'success' ? (
          <div className="form-status form-status--success" role="status" tabIndex={-1} ref={statusRef}>
            <strong>Request sent</strong>
            Thank you. BBO’s team has your booking request and will reply to the email address you gave.
            <p style={{ marginTop: '1.25rem' }}>
              <button type="button" className="btn" onClick={() => { setStatus('idle'); startedAt.current = Date.now(); }}>Send another request</button>
            </p>
          </div>
        ) : (
          <form className="form" ref={formRef} onSubmit={onSubmit} noValidate aria-describedby={!formsConfigured ? 'booking-unavailable' : undefined}>
            {status === 'error' && (
              <div className="form-status form-status--error" role="alert" tabIndex={-1} ref={statusRef}>{failure}</div>
            )}
            {!formsConfigured && (
              <p className="form-status form-status--error" id="booking-unavailable">{messages.unavailable}</p>
            )}
            <div className="field">
              <label htmlFor="book-first_name">First name</label>
              <input {...field('first_name')} autoComplete="given-name" maxLength={80} required />
              <FieldError name="first_name" />
            </div>
            <div className="field">
              <label htmlFor="book-last_name">Last name</label>
              <input {...field('last_name')} autoComplete="family-name" maxLength={80} required />
              <FieldError name="last_name" />
            </div>
            <div className="field">
              <label htmlFor="book-email">Email</label>
              <input {...field('email')} type="email" autoComplete="email" inputMode="email" maxLength={254} required />
              <FieldError name="email" />
            </div>
            <div className="field">
              <label htmlFor="book-phone">Phone <span className="optional">(optional)</span></label>
              <input {...field('phone')} type="tel" autoComplete="tel" maxLength={40} />
            </div>
            <div className="field">
              <label htmlFor="book-event_type">Type of event</label>
              <select {...field('event_type')} required>
                <option value="">Choose one</option>
                {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <FieldError name="event_type" />
            </div>
            <div className="field">
              <label htmlFor="book-event_date">Event date <span className="optional">(optional)</span></label>
              <input {...field('event_date')} type="date" />
            </div>
            <div className="field field--full">
              <label htmlFor="book-location">Venue and city <span className="optional">(optional)</span></label>
              <input {...field('location')} autoComplete="address-level2" maxLength={160} />
            </div>
            <div className="field field--full">
              <label htmlFor="book-details">Tell us about the event</label>
              <textarea {...field('details')} maxLength={4000} required />
              <FieldError name="details" />
            </div>
            <div className="hp-field" aria-hidden="true">
              <label htmlFor="book-website">Leave this field empty</label>
              <input id="book-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
            </div>
            <div className="form__foot">
              <button type="submit" className="btn btn--dark" disabled={status === 'sending' || !formsConfigured}>
                {status === 'sending' ? 'Sending request…' : 'Send booking request'}
              </button>
              <p className="form__privacy">Your details are used only to respond to this request.</p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
