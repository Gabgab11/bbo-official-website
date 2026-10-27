import { useState } from 'react';
import { EMAIL_RE, formsConfigured, subscribe } from '../lib/forms.js';
import { useSiteContent } from '../lib/siteContent.jsx';

export default function Newsletter() {
  const { newsletter } = useSiteContent();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState({ status: 'idle', message: '', field: null });

  async function onSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return setState({ status: 'error', message: 'Enter your email address.', field: 'email' });
    if (!EMAIL_RE.test(value)) return setState({ status: 'error', message: 'Enter an email address like name@example.com.', field: 'email' });
    if (!consent) return setState({ status: 'error', message: 'Tick the box to agree to receive emails from BBO.', field: 'consent' });

    setState({ status: 'sending', message: '', field: null });
    const result = await subscribe(value);
    if (result.ok) {
      setEmail('');
      setConsent(false);
      return setState({ status: 'success', message: 'You’re subscribed. News of new music and events will come to your inbox.' });
    }
    const messages = {
      network: 'You could not be subscribed because the connection failed. Check your connection and try again.',
      invalid: 'That email address could not be accepted. Check it and try again.',
      limited: 'Sign-ups are busy right now. Please try again in a few minutes.',
      unavailable: 'Subscriptions are temporarily unavailable. Please try again later.',
    };
    setState({
      status: 'error',
      message: (result.reason === 'limited' && result.message) || messages[result.reason] || 'The subscription service did not respond. Try again in a few minutes.',
    });
  }

  const invalidEmail = state.status === 'error' && state.field === 'email';

  return (
    <section className="section newsletter" aria-labelledby="newsletter-title">
      <div className="container newsletter__grid">
        <div>
          <h2 className="newsletter__title" id="newsletter-title">{newsletter.title}</h2>
          <p className="lede">{newsletter.lede}</p>
        </div>
        <form className="newsletter__form" onSubmit={onSubmit} noValidate>
          <div className="newsletter__row">
            <label htmlFor="newsletter-email" className="visually-hidden">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Your email address"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={invalidEmail ? 'true' : undefined}
              aria-describedby="newsletter-msg"
              required
            />
            <button className="btn btn--gold" type="submit" disabled={state.status === 'sending' || !formsConfigured}>
              {state.status === 'sending' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </div>
          <label className="check">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-invalid={state.field === 'consent' ? 'true' : undefined} />
            <span>Yes, send me BBO’s newsletter. I can unsubscribe at any time.</span>
          </label>
          <p
            id="newsletter-msg"
            className={`newsletter__msg${state.status === 'error' ? ' newsletter__msg--error' : ''}${state.status === 'success' ? ' newsletter__msg--success' : ''}`}
            role={state.status === 'error' ? 'alert' : 'status'}
          >
            {!formsConfigured ? 'Subscriptions are temporarily unavailable. Please try again later.' : state.message}
          </p>
        </form>
      </div>
    </section>
  );
}
