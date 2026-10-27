import { api } from '../api.js';
import { Card, ErrorNote, Icon, Loading, PageHead, formatDate, siteUrl, timeAgo, useLoad } from '../ui.jsx';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

async function loadOverview() {
  const [bookings, subs, photos, rel, vid] = await Promise.all([
    api.select('booking_inquiries', 'select=id,first_name,last_name,event_type,event_date,location,status,created_at,deleted_at&order=created_at.desc'),
    api.select('newsletter_subscribers', 'select=id,deleted_at'),
    api.select('gallery_photos', 'select=id,in_gallery,on_home,deleted_at'),
    api.select('releases', 'select=id,deleted_at'),
    api.select('videos', 'select=id,deleted_at'),
  ]);
  const failed = [bookings, subs, photos, rel, vid].find((r) => !r.ok);
  if (failed) return failed;
  const live = (r) => r.data.filter((x) => !x.deleted_at);
  const binned = [bookings, subs, photos, rel, vid].reduce((n, r) => n + r.data.filter((x) => x.deleted_at).length, 0);
  return {
    ok: true,
    data: {
      newBookings: live(bookings).filter((b) => b.status === 'new').length,
      latest: live(bookings).slice(0, 4),
      subscribers: live(subs).length,
      galleryPhotos: live(photos).filter((p) => p.in_gallery).length,
      homePhotos: live(photos).filter((p) => p.on_home).length,
      releases: live(rel).length,
      videos: live(vid).length,
      binned,
    },
  };
}

const STATUS = { new: 'New', contacted: 'Contacted', confirmed: 'Confirmed', declined: 'Declined' };

export default function Overview({ profile }) {
  const { data, error, loading, reload } = useLoad(loadOverview);
  const first = (profile.name || '').split(' ')[0];

  return (
    <>
      <PageHead title={`${greeting()}${first ? `, ${first}` : ''}`} description="Here is what is happening on BBO’s website." />
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {loading && !data && <Loading />}
      {data && (
        <>
          <div className="a-stats">
            <a className={`a-stat${data.newBookings ? ' a-stat--hot' : ''}`} href="#admin/bookings">
              <span className="a-stat__num">{data.newBookings}</span>
              <span className="a-stat__label">New booking {data.newBookings === 1 ? 'request' : 'requests'}</span>
            </a>
            <a className="a-stat" href="#admin/subscribers">
              <span className="a-stat__num">{data.subscribers}</span>
              <span className="a-stat__label">Newsletter subscribers</span>
            </a>
            <a className="a-stat" href="#admin/photos">
              <span className="a-stat__num">{data.galleryPhotos}</span>
              <span className="a-stat__label">Photos in the gallery, {data.homePhotos} on the home page</span>
            </a>
            <a className="a-stat" href="#admin/music">
              <span className="a-stat__num">{data.releases + data.videos}</span>
              <span className="a-stat__label">{data.releases} releases and {data.videos} videos</span>
            </a>
          </div>

          <div className="a-grid-2">
            <Card title="Latest booking requests" actions={<a className="a-link" href="#admin/bookings">See all</a>}>
              {data.latest.length === 0 ? (
                <p className="a-muted a-pad">No booking requests yet. They appear here as soon as someone sends the form on the website.</p>
              ) : (
                <ul className="a-list">
                  {data.latest.map((b) => (
                    <li key={b.id}>
                      <a className="a-list__row" href="#admin/bookings">
                        <div>
                          <strong>{b.first_name} {b.last_name}</strong>
                          <span className="a-muted">{b.event_type}{b.event_date ? ` · ${formatDate(b.event_date)}` : ''}{b.location ? ` · ${b.location}` : ''}</span>
                        </div>
                        <div className="a-list__meta">
                          <span className={`a-badge a-badge--${b.status}`}>{STATUS[b.status]}</span>
                          <span className="a-muted">{timeAgo(b.created_at)}</span>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Quick actions">
              <div className="a-actions">
                <a className="a-action" href="#admin/photos"><Icon.upload /><span><strong>Add photos</strong>Upload to the gallery or home page</span></a>
                <a className="a-action" href="#admin/text"><Icon.text /><span><strong>Edit site text</strong>Headline, About, featured release</span></a>
                <a className="a-action" href="#admin/music"><Icon.play /><span><strong>Add a video or release</strong>Paste a YouTube or streaming link</span></a>
                <a className="a-action" href={siteUrl()} target="_blank" rel="noopener noreferrer"><Icon.external /><span><strong>View the website</strong>Opens in a new tab</span></a>
              </div>
              {data.binned > 0 && (
                <p className="a-muted a-pad-x">
                  <a className="a-link" href="#admin/deleted">{data.binned} {data.binned === 1 ? 'item' : 'items'} in Recently deleted</a>
                </p>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
