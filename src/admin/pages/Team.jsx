import { useState } from 'react';
import { api } from '../api.js';
import { Button, Card, Dialog, ErrorNote, Field, Icon, Loading, PageHead, siteUrl, timeAgo, useConfirm, useLoad, useToast } from '../ui.jsx';

const ROLE = { owner: 'Owner', editor: 'Editor' };

function LinkDialog({ link, title, intro, onClose }) {
  const [copied, setCopied] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied('Copied'); }
    catch { setCopied('Select the link above and copy it'); }
  };
  const message = encodeURIComponent(`${intro}\n${link}`);
  return (
    <Dialog open onClose={onClose} title={title} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <div className="a-stack">
        <p className="a-muted">Send this link privately. It works once{title.includes('reset') ? ' and expires in 2 days' : ' and expires in 7 days'}. You will not be able to see it again after closing this window.</p>
        <div className="a-copy">
          <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Link" />
          <Button icon={copied === 'Copied' ? Icon.check : Icon.link} onClick={copy}>{copied === 'Copied' ? 'Copied' : 'Copy'}</Button>
        </div>
        {copied && copied !== 'Copied' && <p className="a-help">{copied}</p>}
        <div className="a-row">
          <a className="a-btn" href={`https://wa.me/?text=${message}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
          <a className="a-btn" href={`mailto:?subject=${encodeURIComponent('BBO website admin')}&body=${message}`}>Share by email</a>
        </div>
      </div>
    </Dialog>
  );
}

async function loadTeam(isOwner) {
  const [members, invites] = await Promise.all([
    api.select('admin_users', 'select=*&order=created_at.asc'),
    isOwner ? api.rpc('admin_list_invites') : Promise.resolve({ ok: true, data: [] }),
  ]);
  if (!members.ok) return members;
  return { ok: true, data: { members: members.data, invites: invites.ok ? invites.data : [] } };
}

export default function Team({ profile }) {
  const isOwner = profile.role === 'owner';
  const { data, error, loading, reload } = useLoad(() => loadTeam(isOwner), [isOwner]);
  const [invite, setInvite] = useState({ role: 'editor', note: '' });
  const [creating, setCreating] = useState(false);
  const [shown, setShown] = useState(null); // { link, title, intro }
  const toast = useToast();
  const confirm = useConfirm();

  const createInvite = async () => {
    setCreating(true);
    const res = await api.rpc('admin_create_invite', { p_role: invite.role, p_note: invite.note.trim() });
    setCreating(false);
    if (!res.ok) return toast(res.error, { error: true });
    setShown({ link: `${siteUrl()}admin/join/${res.data}`, title: 'Invite link ready', intro: 'You have been invited to manage BBO’s website. Create your account here:' });
    setInvite({ role: 'editor', note: '' });
    reload();
  };

  const resetLink = async (m) => {
    const res = await api.rpc('admin_create_reset', { p_user: m.user_id });
    if (!res.ok) return toast(res.error, { error: true });
    setShown({ link: `${siteUrl()}admin/join/${res.data}`, title: `Password reset link for ${m.name || m.email}`, intro: 'Use this link to choose a new password for BBO’s website admin:' });
  };

  const setRole = async (m, role) => {
    const res = await api.rpc('admin_set_role', { p_user: m.user_id, p_role: role });
    if (!res.ok) return toast(res.error, { error: true });
    toast(`${m.name || m.email} is now ${role === 'owner' ? 'an owner' : 'an editor'}`);
    reload();
  };

  const remove = async (m) => {
    const ok = await confirm({
      title: `Remove ${m.name || m.email} from the team?`,
      message: 'They will be signed out and will not be able to sign in again. Everything they changed on the website stays. You can invite them again later.',
      confirmLabel: 'Remove from team',
      danger: true,
    });
    if (!ok) return;
    const res = await api.rpc('admin_remove_member', { p_user: m.user_id });
    if (!res.ok) return toast(res.error, { error: true });
    toast(`${m.name || m.email} removed from the team`);
    reload();
  };

  const revoke = async (i) => {
    const res = await api.rpc('admin_revoke_invite', { p_id: i.id });
    if (!res.ok) return toast(res.error, { error: true });
    toast('Invite cancelled');
    reload();
  };

  return (
    <>
      <PageHead title="Team" description="People who can sign in to this admin panel. Editors can change everything on the website; owners can also manage the team." />
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {loading && !data && <Loading />}
      {data && (
        <div className="a-stack-l">
          <Card title={`Members (${data.members.length})`}>
            <ul className="a-rows">
              {data.members.map((m) => (
                <li key={m.user_id} className="a-rowitem">
                  <span className="a-avatar" aria-hidden="true">{(m.name || m.email).slice(0, 1).toUpperCase()}</span>
                  <div className="a-rowitem__main">
                    <strong>{m.name || m.email}{m.user_id === profile.user_id && <span className="a-badge">You</span>}</strong>
                    <span className="a-muted a-break">{m.email} · joined {timeAgo(m.created_at)}</span>
                  </div>
                  {isOwner && m.user_id !== profile.user_id ? (
                    <div className="a-rowitem__actions a-rowitem__actions--wrap">
                      <label className="a-sr" htmlFor={`role-${m.user_id}`}>Role</label>
                      <select id={`role-${m.user_id}`} className="a-select-sm" value={m.role} onChange={(e) => setRole(m, e.target.value)}>
                        <option value="editor">Editor</option>
                        <option value="owner">Owner</option>
                      </select>
                      <Button size="sm" onClick={() => resetLink(m)}>Reset password</Button>
                      <Button size="sm" variant="quiet-danger" onClick={() => remove(m)}>Remove</Button>
                    </div>
                  ) : (
                    <span className={`a-badge a-badge--${m.role}`}>{ROLE[m.role]}</span>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {isOwner ? (
            <>
              <Card title="Invite someone" description="Creates a one-time link for a new team member to set up their own account with their email and password.">
                <div className="a-pad a-row a-row--fields a-row--end">
                  <Field label="Who is it for?" optional hint="Only you see this, e.g. “Media team”.">
                    {(p) => <input {...p} maxLength={80} value={invite.note} onChange={(e) => setInvite((x) => ({ ...x, note: e.target.value }))} />}
                  </Field>
                  <Field label="Role">
                    {(p) => (
                      <select {...p} value={invite.role} onChange={(e) => setInvite((x) => ({ ...x, role: e.target.value }))}>
                        <option value="editor">Editor: manages the website</option>
                        <option value="owner">Owner: also manages the team</option>
                      </select>
                    )}
                  </Field>
                  <Button variant="primary" icon={Icon.link} loading={creating} onClick={createInvite}>Create invite link</Button>
                </div>
              </Card>
              {data.invites.length > 0 && (
                <Card title="Invites not used yet">
                  <ul className="a-rows">
                    {data.invites.map((i) => (
                      <li key={i.id} className="a-rowitem">
                        <div className="a-rowitem__main">
                          <strong>{i.note || 'Invite'} <span className="a-badge">{ROLE[i.role]}</span></strong>
                          <span className="a-muted">Created {timeAgo(i.created_at)}, expires {timeAgo(i.expires_at)}</span>
                        </div>
                        <div className="a-rowitem__actions"><Button size="sm" variant="quiet-danger" onClick={() => revoke(i)}>Cancel invite</Button></div>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </>
          ) : (
            <p className="a-note">Only owners can invite people or change the team. Ask an owner if someone needs access.</p>
          )}
        </div>
      )}
      {shown && <LinkDialog {...shown} onClose={() => setShown(null)} />}
    </>
  );
}
