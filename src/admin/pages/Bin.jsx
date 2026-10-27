import { useMemo, useState } from 'react';
import { api, restore } from '../api.js';
import { rowToPhoto } from '../../lib/siteContent.jsx';
import { photoSources } from '../../data/media.js';
import { Button, Card, Empty, ErrorNote, Icon, Loading, PageHead, daysLeft, timeAgo, useLoad, useToast } from '../ui.jsx';

const TYPES = {
  booking_inquiries: { label: 'Booking request', title: (r) => `${r.first_name} ${r.last_name}`, sub: (r) => `${r.event_type} · ${r.email}` },
  newsletter_subscribers: { label: 'Subscriber', title: (r) => r.email, sub: () => 'Newsletter' },
  gallery_photos: { label: 'Photo', title: (r) => r.alt || 'Photo', sub: (r) => [r.in_gallery && 'Gallery', r.on_home && 'Home page'].filter(Boolean).join(' and ') || 'Not shown' },
  releases: { label: 'Release', title: (r) => r.title, sub: (r) => [r.kind, r.year].filter(Boolean).join(', ') },
  videos: { label: 'Video', title: (r) => r.title, sub: (r) => r.credit || 'YouTube video' },
};

async function loadBin() {
  const tables = Object.keys(TYPES);
  const results = await Promise.all(tables.map((t) => api.select(t, 'select=*&deleted_at=not.is.null&order=deleted_at.desc')));
  const failed = results.find((r) => !r.ok);
  if (failed) return failed;
  const items = results.flatMap((r, i) => r.data.map((row) => ({ table: tables[i], row })));
  items.sort((a, b) => new Date(b.row.deleted_at) - new Date(a.row.deleted_at));
  return { ok: true, data: items };
}

export default function Bin() {
  const { data, error, loading, reload, setData } = useLoad(loadBin);
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  const groups = useMemo(() => {
    const g = {};
    (data || []).forEach((it) => { (g[it.table] ||= []).push(it); });
    return g;
  }, [data]);

  const doRestore = async ({ table, row }) => {
    setBusy(`${table}-${row.id}`);
    const res = await restore(table, row.id);
    setBusy(null);
    if (!res.ok) return toast(res.error, { error: true });
    setData((l) => l.filter((x) => !(x.table === table && x.row.id === row.id)));
    toast(`${TYPES[table].label} restored`);
  };

  return (
    <>
      <PageHead title="Recently deleted" description="Anything removed in the admin panel waits here for 30 days before it is erased for good. Restore it before then to put it back exactly as it was." />
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {loading && !data && <Loading />}
      {data && data.length === 0 && (
        <Card><Empty icon={Icon.bin} title="Nothing here">Items you remove will appear here for 30 days, in case you need them back.</Empty></Card>
      )}
      {Object.entries(groups).map(([table, items]) => (
        <Card key={table} title={`${TYPES[table].label}s`}>
          <ul className="a-rows">
            {items.map((it) => {
              const left = daysLeft(it.row.deleted_at);
              const photo = table === 'gallery_photos' ? photoSources(rowToPhoto(it.row)) : null;
              return (
                <li key={it.row.id} className="a-rowitem">
                  {photo && <img className="a-rowitem__thumb" src={photo.src} alt="" loading="lazy" />}
                  {table === 'videos' && <img className="a-rowitem__thumb" src={`https://i.ytimg.com/vi/${it.row.youtube_id}/mqdefault.jpg`} alt="" loading="lazy" />}
                  <div className="a-rowitem__main">
                    <strong className="a-break">{TYPES[table].title(it.row)}</strong>
                    <span className="a-muted">{TYPES[table].sub(it.row)}</span>
                    <span className={`a-muted a-small${left <= 3 ? ' a-warn' : ''}`}>Removed {timeAgo(it.row.deleted_at)}. Erased in {left} {left === 1 ? 'day' : 'days'}.</span>
                  </div>
                  <div className="a-rowitem__actions">
                    <Button size="sm" icon={Icon.restore} loading={busy === `${table}-${it.row.id}`} onClick={() => doRestore(it)}>Restore</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </>
  );
}
