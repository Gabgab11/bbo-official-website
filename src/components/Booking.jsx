import { useRef, useState } from 'react';
import { countries, durations, eventTypes, socials } from '../data/content.js';
import { EMAIL_RE, formsConfigured, submitBooking } from '../lib/forms.js';
import { track } from '../lib/analytics.js';
import { useSiteContent } from '../lib/siteContent.jsx';

const empty = { first_name: '', last_name: '', email: '', phone: '', event_type: '', event_date: '', duration: '', country: '', city: '', venue: '', details: '', website: '' };

const PHONE_RE = /^\+?[0-9 ()-]{7,25}$/;
const OTHER_COUNTRY = 'Other (please say in the details)';

/** Today's date as YYYY-MM-DD in the visitor's own time zone. */
const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function validate(v) {
  const e = {};
  if (!v.first_name.trim()) e.first_name = 'Enter your first name.';
  if (!v.last_name.trim()) e.last_name = 'Enter your last name.';
  if (!v.email.trim()) e.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter an email address like name@example.com.';
  if (!v.phone.trim()) e.phone = 'Enter a phone number.';
  else if (!PHONE_RE.test(v.phone.trim())) e.phone = 'Enter a phone number using digits, with the country code, e.g. +234 803 000 0000.';
  if (!v.event_type) e.event_type = 'Choose the type of event.';
  if (!v.event_date) e.event_date = 'Choose the date of the event.';
  else if (v.event_date < today()) e.event_date = 'Choose a date that hasn’t passed.';
  if (!v.duration) e.duration = 'Choose how long BBO is to minister.';
  if (!v.country) e.country = 'Choose the country.';
  if (!v.city.trim()) e.city = 'Enter the city.';
  if (!v.venue.trim()) e.venue = 'Enter the venue.';
  if (v.details.trim().length < 10) e.details = 'Tell us a little more about the event (at least 10 characters).';
  return e;
}

const messages = {
  network: 'Your request could not be sent because the connection failed. Check your internet connection and try again.',
  invalid: 'Some details could not be accepted. Check each field and try again.',
  limited: 'We have already received several requests from this email address today. We will be in touch soon.',
  server: 'The booking service did not respond. Try again in a few minutes.',
  unavailable: 'Online booking is temporarily unavailable. Please send BBO a direct message on Instagram.',
};

export default function Booking() {
  const { booking } = useSiteContent();
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
      phone: values.phone.trim(),
      event_type: values.event_type,
      event_date: values.event_date,
      duration: values.duration,
      country: values.country === OTHER_COUNTRY ? 'Other' : values.country,
      city: values.city.trim(),
      venue: values.venue.trim(),
      details: values.details.trim(),
    };
    const result = await submitBooking(row);
    if (result.ok) {
      track('generate_lead', { form: 'booking', event_type: row.event_type, duration: row.duration, country: row.country });
      setStatus('success');
      setValues(empty);
    } else {
      setFailure((result.reason === 'limited' && result.message) || messages[result.reason] || messages.server);
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
          <h2 className="section-title" id="booking-title">{booking.title}</h2>
          <p className="lede">{booking.lede}</p>
          <ul className="booking__notes">
            <li>Tell us the expected audience and anything special about the programme.</li>
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
              <label htmlFor="book-phone">Phone</label>
              <input {...field('phone')} type="tel" autoComplete="tel" inputMode="tel" maxLength={25} placeholder="+234 803 000 0000" required />
              <FieldError name="phone" />
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
              <label htmlFor="book-event_date">Event date</label>
              <input {...field('event_date')} type="date" min={today()} required />
              <FieldError name="event_date" />
            </div>
            <div className="field">
              <label htmlFor="book-duration">Length of ministration</label>
              <select {...field('duration')} required>
                <option value="">Choose one</option>
                {durations.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <FieldError name="duration" />
            </div>
            <div className="field">
              <label htmlFor="book-country">Country</label>
              <select {...field('country')} autoComplete="country-name" required>
                <option value="">Choose a country</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value={OTHER_COUNTRY}>{OTHER_COUNTRY}</option>
              </select>
              <FieldError name="country" />
            </div>
            <div className="field">
              <label htmlFor="book-city">City</label>
              <input {...field('city')} autoComplete="address-level2" maxLength={80} required />
              <FieldError name="city" />
            </div>
            <div className="field">
              <label htmlFor="book-venue">Venue</label>
              <input {...field('venue')} maxLength={160} placeholder="Church, hall or address" required />
              <FieldError name="venue" />
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
