import { useEffect, useState } from 'react';
import { rest } from '../../lib/supabase.js';
import { signIn } from '../session.js';
import { Button, Field, Loading } from '../ui.jsx';

export default function Join({ code, onDone }) {
  const [info, setInfo] = useState(undefined); // undefined: loading, null: invalid
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    rest('rpc/admin_invite_info', { method: 'POST', body: { p_code: code || '' } }).then((r) => {
      if (!r.ok) { setInfo(null); setError(r.error); return; }
      setInfo(r.data || null);
      if (r.data?.kind === 'reset') setForm((f) => ({ ...f, email: r.data.email }));
    });
  }, [code]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const reset = info?.kind === 'reset';

  async function submit(e) {
    e.preventDefault();
    const found = {};
    if (!reset && !form.name.trim()) found.name = 'Enter your name.';
    if (!reset && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) found.email = 'Enter a valid email address.';
    if (form.password.length < 10) found.password = 'Use at least 10 characters.';
    else if (form.password !== form.confirm) found.confirm = 'The two passwords do not match.';
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    setError('');
    const res = await rest('rpc/admin_join', {
      method: 'POST',
      body: { p_code: code, p_email: form.email.trim(), p_password: form.password, p_name: form.name.trim() },
    });
    if (!res.ok) { setBusy(false); setError(res.error); return; }
    const login = await signIn(form.email, form.password);
    setBusy(false);
    if (login.ok) onDone();
    else setError('Your password is set. Go to the sign-in page and sign in with it.');
  }

  let body;
  if (info === undefined) body = <Loading label="Checking your link" />;
  else if (!info) {
    body = (
      <>
        <h1>This link has expired</h1>
        <p className="a-muted">Invite links work once and expire after 7 days (password reset links after 2 days). Ask an owner on the team for a new one.</p>
        <a className="a-btn a-btn--primary a-btn--block" href="/admin">Go to sign in</a>
      </>
    );
  } else {
    body = (
      <>
        <h1>{reset ? 'Choose a new password' : 'Join the website team'}</h1>
        <p className="a-muted">
          {reset
            ? <>For <strong>{info.email}</strong>. After this you can sign in with your new password.</>
            : <>You have been invited as {info.role === 'owner' ? 'an owner (can also manage the team)' : 'an editor'}. Create your account to start.</>}
        </p>
        <form onSubmit={submit} noValidate className="a-stack">
          {!reset && (
            <>
              <Field label="Your name" error={errors.name}>
                {(p) => <input {...p} autoComplete="name" maxLength={80} value={form.name} onChange={set('name')} />}
              </Field>
              <Field label="Email" hint="Use your team email. You will sign in with it." error={errors.email}>
                {(p) => <input {...p} type="email" autoComplete="username" inputMode="email" value={form.email} onChange={set('email')} />}
              </Field>
            </>
          )}
          <Field label={reset ? 'New password' : 'Password'} hint="At least 10 characters. A short phrase is easy to remember." error={errors.password}>
            {(p) => <input {...p} type="password" autoComplete="new-password" maxLength={72} value={form.password} onChange={set('password')} />}
          </Field>
          <Field label="Type it again" error={errors.confirm}>
            {(p) => <input {...p} type="password" autoComplete="new-password" maxLength={72} value={form.confirm} onChange={set('confirm')} />}
          </Field>
          {error && <p className="a-note a-note--error" role="alert">{error}</p>}
          <Button type="submit" variant="primary" loading={busy} className="a-btn--block">{reset ? 'Save new password' : 'Create my account'}</Button>
        </form>
      </>
    );
  }

  return (
    <div className="a-gate">
      <div className="a-gate__art" aria-hidden="true"><span>BBO</span></div>
      <div className="a-gate__panel">
        <p className="a-gate__brand">BBO <span>Admin</span></p>
        {body}
      </div>
    </div>
  );
}
