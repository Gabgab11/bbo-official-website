import { useState } from 'react';
import { api } from '../api.js';
import { changePassword } from '../session.js';
import { Button, Card, Field, PageHead, useToast } from '../ui.jsx';

export default function Account({ profile }) {
  const [name, setName] = useState(profile.name || '');
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [savingPw, setSavingPw] = useState(false);
  const toast = useToast();

  const saveName = async () => {
    setSavingName(true);
    const res = await api.update('admin_users', profile.user_id, { name: name.trim() }, 'user_id');
    setSavingName(false);
    if (!res.ok) return toast(res.error, { error: true });
    profile.name = name.trim();
    toast('Name saved');
  };

  const savePassword = async () => {
    const e = {};
    if (pw.next.length < 10) e.next = 'Use at least 10 characters.';
    else if (pw.next !== pw.confirm) e.confirm = 'The two passwords do not match.';
    setPwErrors(e);
    if (Object.keys(e).length) return;
    setSavingPw(true);
    const res = await changePassword(pw.next);
    setSavingPw(false);
    if (!res.ok) return toast(res.error, { error: true });
    setPw({ next: '', confirm: '' });
    toast('Password changed. Use the new one next time you sign in.');
  };

  return (
    <>
      <PageHead title="Your account" description={`Signed in as ${profile.email} (${profile.role === 'owner' ? 'owner' : 'editor'}).`} />
      <div className="a-grid-2">
        <Card title="Your name" description="Shown to the rest of the team.">
          <div className="a-pad a-stack">
            <Field label="Name">{(p) => <input {...p} maxLength={80} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}</Field>
            <Button variant="primary" loading={savingName} disabled={name.trim() === (profile.name || '')} onClick={saveName} className="a-self-start">Save name</Button>
          </div>
        </Card>
        <Card title="Change password" description="At least 10 characters.">
          <div className="a-pad a-stack">
            <Field label="New password" error={pwErrors.next}>{(p) => <input {...p} type="password" autoComplete="new-password" maxLength={72} value={pw.next} onChange={(e) => setPw((x) => ({ ...x, next: e.target.value }))} />}</Field>
            <Field label="Type it again" error={pwErrors.confirm}>{(p) => <input {...p} type="password" autoComplete="new-password" maxLength={72} value={pw.confirm} onChange={(e) => setPw((x) => ({ ...x, confirm: e.target.value }))} />}</Field>
            <Button variant="primary" loading={savingPw} disabled={!pw.next} onClick={savePassword} className="a-self-start">Change password</Button>
          </div>
        </Card>
      </div>
    </>
  );
}
