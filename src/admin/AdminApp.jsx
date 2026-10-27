import { useCallback, useEffect, useState } from 'react';
import './admin.css';
import { supabaseConfigured } from '../lib/supabase.js';
import { getValidSession, signOut } from './session.js';
import { api, setExpiredHandler } from './api.js';
import { Button, Icon, Loading, Providers, navigate, siteUrl } from './ui.jsx';
import Login from './pages/Login.jsx';
import Join from './pages/Join.jsx';
import Overview from './pages/Overview.jsx';
import Bookings from './pages/Bookings.jsx';
import Photos from './pages/Photos.jsx';
import TextPage from './pages/TextPage.jsx';
import Music from './pages/Music.jsx';
import Subscribers from './pages/Subscribers.jsx';
import Bin from './pages/Bin.jsx';
import Team from './pages/Team.jsx';
import Account from './pages/Account.jsx';

const SECTIONS = [
  { id: '', label: 'Overview', icon: Icon.home, page: Overview, primary: true },
  { id: 'bookings', label: 'Bookings', icon: Icon.inbox, page: Bookings, primary: true },
  { id: 'photos', label: 'Photos', icon: Icon.photo, page: Photos, primary: true },
  { id: 'text', label: 'Site text', icon: Icon.text, page: TextPage, primary: true },
  { id: 'music', label: 'Music & videos', icon: Icon.music, page: Music },
  { id: 'subscribers', label: 'Subscribers', icon: Icon.mail, page: Subscribers },
  { id: 'deleted', label: 'Recently deleted', icon: Icon.bin, page: Bin },
  { id: 'team', label: 'Team', icon: Icon.users, page: Team },
  { id: 'account', label: 'Your account', icon: Icon.user, page: Account },
];

function Wordmark() {
  return (
    <a className="a-wordmark" href="#admin">
      BBO <span>Admin</span>
    </a>
  );
}

function Shell({ profile, section, onSignOut }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const current = SECTIONS.find((s) => s.id === section) || SECTIONS[0];
  const Page = current.page;

  useEffect(() => { setMoreOpen(false); window.scrollTo(0, 0); }, [section]);
  useEffect(() => { document.title = `${current.label} · BBO Admin`; }, [current]);

  const link = (s) => (
    <a key={s.id} href={s.id ? `#admin/${s.id}` : '#admin'} className="a-nav__link" aria-current={s.id === current.id ? 'page' : undefined}>
      <s.icon /> <span>{s.label}</span>
    </a>
  );

  return (
    <div className="a-shell">
      <aside className="a-side">
        <Wordmark />
        <nav className="a-nav" aria-label="Admin">{SECTIONS.map(link)}</nav>
        <div className="a-side__foot">
          <a className="a-nav__link" href={siteUrl()} target="_blank" rel="noopener noreferrer"><Icon.external /> <span>View website</span></a>
          <button type="button" className="a-nav__link" onClick={onSignOut}><Icon.logout /> <span>Sign out</span></button>
          <p className="a-side__who">{profile.name || profile.email}<br /><span>{profile.role === 'owner' ? 'Owner' : 'Editor'}</span></p>
        </div>
      </aside>

      <header className="a-topbar">
        <Wordmark />
        <a className="a-topbar__site" href={siteUrl()} target="_blank" rel="noopener noreferrer"><Icon.external /> <span className="a-sr">View website</span></a>
      </header>

      <main className="a-main" id="admin-main">
        <Page profile={profile} />
      </main>

      <nav className="a-tabbar" aria-label="Admin">
        {SECTIONS.filter((s) => s.primary).map((s) => (
          <a key={s.id} href={s.id ? `#admin/${s.id}` : '#admin'} aria-current={s.id === current.id ? 'page' : undefined}>
            <s.icon /><span>{s.label === 'Site text' ? 'Text' : s.label}</span>
          </a>
        ))}
        <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)} aria-current={!current.primary ? 'page' : undefined}>
          <Icon.more /><span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="a-sheet" onClick={(e) => e.target === e.currentTarget && setMoreOpen(false)}>
          <div className="a-sheet__panel">
            <p className="a-sheet__who">{profile.name || profile.email} · {profile.role === 'owner' ? 'Owner' : 'Editor'}</p>
            {SECTIONS.filter((s) => !s.primary).map(link)}
            <a className="a-nav__link" href={siteUrl()} target="_blank" rel="noopener noreferrer"><Icon.external /> <span>View website</span></a>
            <button type="button" className="a-nav__link" onClick={onSignOut}><Icon.logout /> <span>Sign out</span></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminApp({ route }) {
  const [state, setState] = useState({ status: 'checking', profile: null, notice: '' });
  const [section, param] = route;

  const loadProfile = useCallback(async (notice = '') => {
    const session = await getValidSession();
    if (!session) return setState({ status: 'signedOut', profile: null, notice });
    const res = await api.select('admin_users', `select=*&user_id=eq.${session.user.id}`);
    if (!res.ok) return setState({ status: 'error', profile: null, notice: res.error });
    if (!res.data.length) return setState({ status: 'noAccess', profile: null, notice: '' });
    setState({ status: 'ready', profile: res.data[0], notice: '' });
    // Housekeeping: erase uploaded photo files whose 30 days in the bin are over.
    api.rpc('admin_take_expired_uploads').then((r) => {
      if (r.ok && r.data?.length) api.removeFiles(r.data.flatMap((p) => [`${p}-800.jpg`, `${p}-1600.jpg`]));
    });
  }, []);

  useEffect(() => {
    setExpiredHandler(() => setState({ status: 'signedOut', profile: null, notice: 'Your session has expired. Sign in again.' }));
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'robots'; document.head.appendChild(meta); }
    meta.content = 'noindex, nofollow';
    document.documentElement.classList.add('is-admin');
    return () => { document.documentElement.classList.remove('is-admin'); meta.content = 'index, follow'; };
  }, []);

  const doSignOut = async () => {
    await signOut();
    setState({ status: 'signedOut', profile: null, notice: 'You have signed out.' });
    navigate('');
  };

  let content;
  if (!supabaseConfigured) {
    content = (
      <div className="a-gate">
        <div className="a-gate__panel">
          <Wordmark />
          <h1>Almost ready</h1>
          <p>The admin panel is built, but this copy of the website is not connected to its database yet. The site owner needs to add the <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> setting in GitHub (Settings → Secrets and variables → Actions → Variables), then run the deploy again.</p>
        </div>
      </div>
    );
  } else if (section === 'join') {
    content = <Join code={param} onDone={() => { navigate(''); loadProfile(); }} />;
  } else if (state.status === 'checking') {
    content = <div className="a-gate"><Loading label="Opening the admin panel" /></div>;
  } else if (state.status === 'signedOut' || state.status === 'error') {
    content = <Login notice={state.notice} onSignedIn={() => loadProfile()} />;
  } else if (state.status === 'noAccess') {
    content = (
      <div className="a-gate">
        <div className="a-gate__panel">
          <Wordmark />
          <h1>No access</h1>
          <p>This account is not on BBO’s website team. If you should have access, ask an owner to send you an invite link.</p>
          <Button variant="primary" onClick={doSignOut}>Sign out</Button>
        </div>
      </div>
    );
  } else {
    content = <Shell profile={state.profile} section={section} onSignOut={doSignOut} />;
  }

  return <Providers><div className="admin">{content}</div></Providers>;
}
