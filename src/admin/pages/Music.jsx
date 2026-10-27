import { useMemo, useState } from 'react';
import { api, moveToBin, restore } from '../api.js';
import { Button, Card, Dialog, Empty, ErrorNote, Field, Icon, Loading, PageHead, Switch, reorder, useLoad, useToast } from '../ui.jsx';

const KINDS = ['Single', 'Live single', 'EP', 'Album', 'Live album', 'Compilation'];
const STORES = ['All platforms', 'Spotify', 'Apple Music', 'YouTube Music', 'Deezer', 'Audiomack', 'Boomplay'];

/** Finds the 11-character video ID in any common YouTube link. */
export function youtubeId(input) {
  const s = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1, 12);
    if (u.searchParams.get('v')) return u.searchParams.get('v').slice(0, 11);
    const m = u.pathname.match(/\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------- releases */
function ReleaseDialog({ release, onClose, onSaved, nextSort }) {
  const [v, setV] = useState(release || { title: '', credit: '', kind: 'Single', year: String(new Date().getFullYear()), href: '', store: 'All platforms' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    const found = {};
    if (!v.title.trim()) found.title = 'Enter the title.';
    if (!/^https:\/\/\S+\.\S+/.test(v.href.trim())) found.href = 'Paste the full link, starting with https://';
    if (v.year && !/^\d{4}$/.test(v.year)) found.year = 'Use four digits, e.g. 2026.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const row = { title: v.title.trim(), credit: v.credit.trim(), kind: v.kind, year: v.year.trim(), href: v.href.trim(), store: v.store };
    const res = release ? await api.update('releases', release.id, row) : await api.insert('releases', { ...row, sort: nextSort });
    setSaving(false);
    if (!res.ok) return toast(res.error, { error: true });
    onSaved(res.data[0], !release);
  };

  return (
    <Dialog open onClose={onClose} title={release ? 'Edit release' : 'Add a release'} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={save}>{release ? 'Save' : 'Add release'}</Button></>}>
      <div className="a-stack">
        <Field label="Title" error={errors.title}>{(p) => <input {...p} maxLength={120} value={v.title} onChange={set('title')} />}</Field>
        <Field label="Featuring or with" optional hint="e.g. featuring Tope Alabi">{(p) => <input {...p} maxLength={160} value={v.credit} onChange={set('credit')} />}</Field>
        <div className="a-row a-row--fields">
          <Field label="Type">{(p) => <select {...p} value={v.kind} onChange={set('kind')}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>}</Field>
          <Field label="Year" optional error={errors.year}>{(p) => <input {...p} inputMode="numeric" maxLength={4} value={v.year} onChange={set('year')} />}</Field>
        </div>
        <Field label="Listening link" error={errors.href} hint="A smart link (ONErpm, Linktree) or a Spotify, Apple Music or Deezer page.">
          {(p) => <input {...p} type="url" inputMode="url" maxLength={300} placeholder="https://" value={v.href} onChange={set('href')} />}
        </Field>
        <Field label="Button label" hint="What the link button on the website says.">
          {(p) => <select {...p} value={v.store} onChange={set('store')}>{STORES.map((k) => <option key={k} value={k}>{k === 'All platforms' ? 'Listen (all platforms)' : k}</option>)}</select>}
        </Field>
      </div>
    </Dialog>
  );
}

/* ----------------------------------------------------------- videos */
function VideoDialog({ video, onClose, onSaved, nextSort }) {
  const [v, setV] = useState(video ? { ...video, link: `https://www.youtube.com/watch?v=${video.youtube_id}` } : { link: '', title: '', credit: '', embed: true });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const id = youtubeId(v.link);
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  const save = async () => {
    const found = {};
    if (!id) found.link = 'Paste a YouTube link, e.g. https://www.youtube.com/watch?v=…';
    if (!v.title.trim()) found.title = 'Enter a title.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    const row = { youtube_id: id, title: v.title.trim(), credit: v.credit.trim(), embed: v.embed };
    const res = video ? await api.update('videos', video.id, row) : await api.insert('videos', { ...row, sort: nextSort });
    setSaving(false);
    if (!res.ok) return toast(res.error, { error: true });
    onSaved(res.data[0], !video);
  };

  return (
    <Dialog open onClose={onClose} title={video ? 'Edit video' : 'Add a video'} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" loading={saving} onClick={save}>{video ? 'Save' : 'Add video'}</Button></>}>
      <div className="a-stack">
        <Field label="YouTube link" error={errors.link} hint="Copy it from the Share button on YouTube.">
          {(p) => <input {...p} type="url" inputMode="url" placeholder="https://youtu.be/…" value={v.link} onChange={set('link')} />}
        </Field>
        {id && <img className="a-video-preview" src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="Video thumbnail preview" />}
        <Field label="Title" error={errors.title}>{(p) => <input {...p} maxLength={120} value={v.title} onChange={set('title')} />}</Field>
        <Field label="Line under the title" optional hint="e.g. Featuring Tope Alabi, or Recorded live">{(p) => <input {...p} maxLength={160} value={v.credit} onChange={set('credit')} />}</Field>
        <Switch
          label="Play on the website"
          description="Turn off if the video says “Video unavailable” on the site. Some channels block playing their videos on other websites; then visitors are sent to YouTube."
          checked={v.embed}
          onChange={(embed) => setV((x) => ({ ...x, embed }))}
        />
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------- page */
export default function Music() {
  const [tab, setTab] = useState('videos');
  const releases = useLoad(() => api.select('releases', 'select=*&deleted_at=is.null&order=sort.asc,created_at.asc'));
  const videos = useLoad(() => api.select('videos', 'select=*&deleted_at=is.null&order=sort.asc,created_at.asc'));
  const [dialog, setDialog] = useState(null); // { type, item }
  const toast = useToast();

  const relList = useMemo(() => [...(releases.data || [])].sort((a, b) => a.sort - b.sort), [releases.data]);
  const vidList = useMemo(() => [...(videos.data || [])].sort((a, b) => a.sort - b.sort), [videos.data]);

  const move = async (store, table, list, i, d) => {
    const result = reorder(list, i, d, 'sort');
    if (!result) return;
    store.setData(result.next);
    const res = await Promise.all(result.updates.map((u) => api.update(table, u.id, u.patch)));
    if (res.some((r) => !r.ok)) { toast('Could not save the new order. Try again.', { error: true }); store.reload(); }
  };

  const bin = async (store, table, item, label) => {
    const res = await moveToBin(table, item.id);
    if (!res.ok) return toast(res.error, { error: true });
    store.setData((l) => l.filter((x) => x.id !== item.id));
    toast(`“${item.title}” moved to Recently deleted`, { action: { label: 'Undo', onClick: async () => { await restore(table, item.id); store.reload(); } } });
  };

  const onSaved = (store, label) => (row, isNew) => {
    store.setData((l) => (isNew ? [...l, row] : l.map((x) => (x.id === row.id ? row : x))));
    setDialog(null);
    toast(isNew ? `${label} added to the website` : `${label} saved`);
  };

  const nextSort = (list) => Math.max(-1, ...list.map((x) => x.sort)) + 1;

  return (
    <>
      <PageHead
        title="Music & videos"
        description="The Watch section and the list of releases. New items go to the end; use the arrows to move them."
        actions={tab === 'videos'
          ? <Button variant="primary" icon={Icon.plus} onClick={() => setDialog({ type: 'video' })}>Add a video</Button>
          : <Button variant="primary" icon={Icon.plus} onClick={() => setDialog({ type: 'release' })}>Add a release</Button>}
      />
      <div className="a-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'videos'} onClick={() => setTab('videos')}>Videos <span className="a-chip__count">{vidList.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === 'releases'} onClick={() => setTab('releases')}>Releases <span className="a-chip__count">{relList.length}</span></button>
      </div>

      {tab === 'videos' && (
        <Card>
          {videos.error && <ErrorNote onRetry={videos.reload}>{videos.error}</ErrorNote>}
          {videos.loading && !videos.data && <Loading />}
          {videos.data && vidList.length === 0 && <Empty icon={Icon.play} title="No videos" action={<Button variant="primary" icon={Icon.plus} onClick={() => setDialog({ type: 'video' })}>Add a video</Button>}>Add BBO’s YouTube videos to show them in the Watch section.</Empty>}
          <ol className="a-rows">
            {vidList.map((v, i) => (
              <li key={v.id} className="a-rowitem">
                <img className="a-rowitem__thumb" src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`} alt="" loading="lazy" />
                <div className="a-rowitem__main">
                  <strong>{v.title}</strong>
                  <span className="a-muted">{v.credit}{!v.embed && <span className="a-badge">Opens on YouTube</span>}{i === 0 && <span className="a-badge a-badge--new">Shown first</span>}</span>
                </div>
                <div className="a-rowitem__actions">
                  <Button size="sm" variant="ghost" icon={Icon.up} disabled={i === 0} aria-label="Move up" onClick={() => move(videos, 'videos', vidList, i, -1)} />
                  <Button size="sm" variant="ghost" icon={Icon.down} disabled={i === vidList.length - 1} aria-label="Move down" onClick={() => move(videos, 'videos', vidList, i, 1)} />
                  <Button size="sm" variant="ghost" icon={Icon.edit} aria-label={`Edit ${v.title}`} onClick={() => setDialog({ type: 'video', item: v })} />
                  <Button size="sm" variant="quiet-danger" icon={Icon.bin} aria-label={`Remove ${v.title}`} onClick={() => bin(videos, 'videos', v)} />
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {tab === 'releases' && (
        <Card>
          {releases.error && <ErrorNote onRetry={releases.reload}>{releases.error}</ErrorNote>}
          {releases.loading && !releases.data && <Loading />}
          {releases.data && relList.length === 0 && <Empty icon={Icon.music} title="No releases" action={<Button variant="primary" icon={Icon.plus} onClick={() => setDialog({ type: 'release' })}>Add a release</Button>}>Add BBO’s singles, EPs and albums with their listening links.</Empty>}
          <ol className="a-rows">
            {relList.map((r, i) => (
              <li key={r.id} className="a-rowitem">
                <span className="a-rowitem__index">{i + 1}</span>
                <div className="a-rowitem__main">
                  <strong>{r.title}</strong>
                  <span className="a-muted">{[r.credit, r.kind, r.year].filter(Boolean).join(', ')}</span>
                </div>
                <a className="a-link a-rowitem__link" href={r.href} target="_blank" rel="noopener noreferrer">{r.store === 'All platforms' ? 'Listen' : r.store} <Icon.external /></a>
                <div className="a-rowitem__actions">
                  <Button size="sm" variant="ghost" icon={Icon.up} disabled={i === 0} aria-label="Move up" onClick={() => move(releases, 'releases', relList, i, -1)} />
                  <Button size="sm" variant="ghost" icon={Icon.down} disabled={i === relList.length - 1} aria-label="Move down" onClick={() => move(releases, 'releases', relList, i, 1)} />
                  <Button size="sm" variant="ghost" icon={Icon.edit} aria-label={`Edit ${r.title}`} onClick={() => setDialog({ type: 'release', item: r })} />
                  <Button size="sm" variant="quiet-danger" icon={Icon.bin} aria-label={`Remove ${r.title}`} onClick={() => bin(releases, 'releases', r)} />
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {dialog?.type === 'video' && <VideoDialog video={dialog.item} nextSort={nextSort(vidList)} onClose={() => setDialog(null)} onSaved={onSaved(videos, 'Video')} />}
      {dialog?.type === 'release' && <ReleaseDialog release={dialog.item} nextSort={nextSort(relList)} onClose={() => setDialog(null)} onSaved={onSaved(releases, 'Release')} />}
    </>
  );
}
