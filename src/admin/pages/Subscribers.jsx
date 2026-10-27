import { useMemo, useState } from 'react';
import { api, moveToBin, restore } from '../api.js';
import { Button, Card, Empty, ErrorNote, Icon, Loading, PageHead, useLoad, useToast } from '../ui.jsx';

function downloadCsv(rows) {
  const lines = [['Email', 'Signed up'], ...rows.map((r) => [r.email, new Date(r.created_at).toISOString().slice(0, 10)])];
  const csv = lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `bbo-newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv` });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Subscribers() {
  const { data, error, loading, reload, setData } = useLoad(() =>
    api.select('newsletter_subscribers', 'select=id,email,created_at&deleted_at=is.null&order=created_at.desc'),
  );
  const [query, setQuery] = useState('');
  const toast = useToast();

  const shown = useMemo(() => (data || []).filter((s) => s.email.includes(query.trim().toLowerCase())), [data, query]);
  const thisMonth = useMemo(() => (data || []).filter((s) => new Date(s.created_at) > new Date(Date.now() - 30 * 86400000)).length, [data]);

  const bin = async (s) => {
    const res = await moveToBin('newsletter_subscribers', s.id);
    if (!res.ok) return toast(res.error, { error: true });
    setData((l) => l.filter((x) => x.id !== s.id));
    toast(`${s.email} removed`, { action: { label: 'Undo', onClick: async () => { await restore('newsletter_subscribers', s.id); reload(); } } });
  };

  return (
    <>
      <PageHead
        title="Newsletter subscribers"
        description="People who signed up for news by email on the website."
        actions={data?.length ? <Button variant="primary" icon={Icon.download} onClick={() => downloadCsv(data)}>Download list</Button> : null}
      />
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {loading && !data && <Loading />}
      {data && (
        <>
          <div className="a-stats a-stats--2">
            <div className="a-stat"><span className="a-stat__num">{data.length}</span><span className="a-stat__label">Subscribers</span></div>
            <div className="a-stat"><span className="a-stat__num">{thisMonth}</span><span className="a-stat__label">Joined in the last 30 days</span></div>
          </div>
          <Card>
            {data.length === 0 ? (
              <Empty icon={Icon.mail} title="No subscribers yet">Sign-ups from the website appear here. Download the list as a spreadsheet file to use it with any email service.</Empty>
            ) : (
              <>
                <div className="a-pad">
                  <label className="a-search a-search--full">
                    <Icon.search />
                    <span className="a-sr">Search subscribers</span>
                    <input type="search" placeholder="Search by email" value={query} onChange={(e) => setQuery(e.target.value)} />
                  </label>
                </div>
                <ul className="a-rows">
                  {shown.map((s) => (
                    <li key={s.id} className="a-rowitem">
                      <div className="a-rowitem__main">
                        <strong className="a-break">{s.email}</strong>
                        <span className="a-muted">Signed up {new Date(s.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="a-rowitem__actions">
                        <Button size="sm" variant="quiet-danger" icon={Icon.bin} aria-label={`Remove ${s.email}`} onClick={() => bin(s)} />
                      </div>
                    </li>
                  ))}
                  {shown.length === 0 && <li className="a-pad a-muted">No subscriber matches “{query}”.</li>}
                </ul>
              </>
            )}
          </Card>
        </>
      )}
    </>
  );
}
