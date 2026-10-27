import { useMemo, useState } from 'react';
import { api, moveToBin, restore } from '../api.js';
import { Button, Empty, ErrorNote, Icon, Loading, PageHead, formatDate, timeAgo, useLoad, useToast } from '../ui.jsx';

const STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'declined', label: 'Declined' },
];

function BookingDetail({ b, onChange, onBin }) {
  const [notes, setNotes] = useState(b.notes || '');
  const [saving, setSaving] = useState('');
  const toast = useToast();

  const setStatus = async (status) => {
    if (status === b.status) return;
    setSaving('status');
    const res = await api.update('booking_inquiries', b.id, { status });
    setSaving('');
    if (res.ok) { onChange({ ...b, status }); toast(`Marked as ${STATUSES.find((s) => s.id === status).label.toLowerCase()}`); }
    else toast(res.error, { error: true });
  };
  const saveNotes = async () => {
    setSaving('notes');
    const res = await api.update('booking_inquiries', b.id, { notes });
    setSaving('');
    if (res.ok) { onChange({ ...b, notes }); toast('Notes saved'); }
    else toast(res.error, { error: true });
  };

  const subject = encodeURIComponent(`Your booking request for BBO${b.event_date ? ` (${formatDate(b.event_date)})` : ''}`);
  const body = encodeURIComponent(`Dear ${b.first_name},\n\nThank you for inviting BBO to minister at your ${b.event_type.toLowerCase()}.\n\n`);

  return (
    <div className="a-booking__detail">
      <dl className="a-dl">
        <div><dt><Icon.mail /> Email</dt><dd><a className="a-link" href={`mailto:${b.email}`}>{b.email}</a></dd></div>
        {b.phone && <div><dt><Icon.phone /> Phone</dt><dd><a className="a-link" href={`tel:${b.phone.replace(/[^\d+]/g, '')}`}>{b.phone}</a></dd></div>}
        <div><dt><Icon.calendar /> Date</dt><dd>{b.event_date ? formatDate(b.event_date) : 'Not given'}</dd></div>
        {b.duration && <div><dt><Icon.clock /> Length</dt><dd>{b.duration}</dd></div>}
        {b.venue ? (
          <>
            <div><dt><Icon.pin /> Venue</dt><dd>{b.venue}</dd></div>
            <div><dt><Icon.pin /> City</dt><dd>{b.city}</dd></div>
            <div><dt><Icon.pin /> Country</dt><dd>{b.country}</dd></div>
          </>
        ) : (
          <div><dt><Icon.pin /> Venue</dt><dd>{b.location || 'Not given'}</dd></div>
        )}
      </dl>
      <div className="a-booking__message">
        <h4>About the event</h4>
        <p>{b.details}</p>
      </div>

      <div className="a-booking__controls">
        <div>
          <h4>Status</h4>
          <div className="a-chips" role="radiogroup" aria-label="Status">
            {STATUSES.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={b.status === s.id} className={`a-chip a-chip--${s.id}`} disabled={saving === 'status'} onClick={() => setStatus(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="a-field">
          <label htmlFor={`notes-${b.id}`}>Team notes <span className="a-optional">(only the team sees these)</span></label>
          <textarea id={`notes-${b.id}`} rows={3} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Fee agreed, travel, contact person…" />
          {notes !== (b.notes || '') && <Button size="sm" variant="primary" loading={saving === 'notes'} onClick={saveNotes} className="a-mt-s">Save notes</Button>}
        </div>
      </div>

      <div className="a-booking__actions">
        <a className="a-btn a-btn--primary" href={`mailto:${b.email}?subject=${subject}&body=${body}`}><Icon.mail /> Reply by email</a>
        {b.phone && <a className="a-btn" href={`tel:${b.phone.replace(/[^\d+]/g, '')}`}><Icon.phone /> Call</a>}
        <Button variant="quiet-danger" icon={Icon.bin} onClick={onBin}>Move to Recently deleted</Button>
      </div>
    </div>
  );
}

export default function Bookings() {
  const { data, error, loading, reload, setData } = useLoad(() =>
    api.select('booking_inquiries', 'select=*&deleted_at=is.null&order=created_at.desc'),
  );
  const [filter, setFilter] = useState('new');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);
  const toast = useToast();

  const counts = useMemo(() => {
    const c = { all: data?.length || 0 };
    STATUSES.forEach((s) => { c[s.id] = data?.filter((b) => b.status === s.id).length || 0; });
    return c;
  }, [data]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    // The request being worked on stays visible even after its status changes.
    return (data || []).filter((b) =>
      (b.id === open || filter === 'all' || b.status === filter) &&
      (!q || `${b.first_name} ${b.last_name} ${b.email} ${b.location || ''} ${b.country || ''} ${b.event_type}`.toLowerCase().includes(q)),
    );
  }, [data, filter, query, open]);

  const replace = (row) => setData((list) => list.map((b) => (b.id === row.id ? row : b)));

  const bin = async (b) => {
    const res = await moveToBin('booking_inquiries', b.id);
    if (!res.ok) return toast(res.error, { error: true });
    setData((list) => list.filter((x) => x.id !== b.id));
    setOpen(null);
    toast(`Request from ${b.first_name} moved to Recently deleted`, {
      action: { label: 'Undo', onClick: async () => { await restore('booking_inquiries', b.id); reload(); } },
    });
  };

  return (
    <>
      <PageHead title="Booking requests" description="Everything sent through the booking form on the website." />
      <div className="a-toolbar">
        <div className="a-chips a-chips--filter" role="tablist" aria-label="Filter by status">
          {[...STATUSES, { id: 'all', label: 'All' }].map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={filter === s.id} className="a-chip" onClick={() => { setFilter(s.id); setOpen(null); }}>
              {s.label} <span className="a-chip__count">{counts[s.id]}</span>
            </button>
          ))}
        </div>
        <label className="a-search">
          <Icon.search />
          <span className="a-sr">Search bookings</span>
          <input type="search" placeholder="Search name, email, city or country" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {loading && !data && <Loading />}
      {data && shown.length === 0 && (
        <Empty icon={Icon.inbox} title={query ? 'No matches' : filter === 'new' ? 'No new requests' : 'Nothing here'}>
          {query ? 'Try a different name, email or city.' : filter === 'new' ? 'New booking requests from the website will appear here.' : 'Requests with this status will appear here.'}
        </Empty>
      )}
      <ul className="a-bookings">
        {shown.map((b) => (
          <li key={b.id} className={`a-booking${open === b.id ? ' is-open' : ''}`}>
            <button type="button" className="a-booking__summary" aria-expanded={open === b.id} onClick={() => setOpen(open === b.id ? null : b.id)}>
              <span className={`a-dot a-dot--${b.status}`} aria-hidden="true" />
              <span className="a-booking__who">
                <strong>{b.first_name} {b.last_name}</strong>
                <span className="a-muted">{b.event_type}{b.location ? ` · ${b.location}` : ''}</span>
              </span>
              <span className="a-booking__when">
                <span>{b.event_date ? formatDate(b.event_date) : 'No date yet'}</span>
                <span className="a-muted">Received {timeAgo(b.created_at)}</span>
              </span>
              <Icon.down />
            </button>
            {open === b.id && <BookingDetail b={b} onChange={replace} onBin={() => bin(b)} />}
          </li>
        ))}
      </ul>
    </>
  );
}
