import { useState } from 'react';
import { signIn } from '../session.js';
import { Button, Field } from '../ui.jsx';

export default function Login({ notice, onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    setError('');
    const res = await signIn(email, password);
    setBusy(false);
    if (res.ok) onSignedIn();
    else setError(res.error);
  }

  return (
    <div className="a-gate">
      <div className="a-gate__art" aria-hidden="true">
        <span>BBO</span>
      </div>
      <div className="a-gate__panel">
        <p className="a-gate__brand">BBO <span>Admin</span></p>
        <h1>Sign in</h1>
        <p className="a-muted">For BBO’s website team only.</p>
        {notice && <p className="a-note">{notice}</p>}
        <form onSubmit={submit} noValidate className="a-stack">
          <Field label="Email">
            {(p) => <input {...p} type="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Password">
            {(p) => (
              <div className="a-password">
                <input {...p} type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShow((v) => !v)}>{show ? 'Hide' : 'Show'}</button>
              </div>
            )}
          </Field>
          {error && <p className="a-note a-note--error" role="alert">{error}</p>}
          <Button type="submit" variant="primary" loading={busy} className="a-btn--block">Sign in</Button>
        </form>
        <p className="a-gate__help">Forgot your password, or need access? Ask an owner on the team for a link.</p>
      </div>
    </div>
  );
}
