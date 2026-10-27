import { useMemo, useRef, useState } from 'react';
import { api, moveToBin, restore } from '../api.js';
import { prepareImage } from '../image.js';
import { rowToPhoto } from '../../lib/siteContent.jsx';
import { photoSources } from '../../data/media.js';
import { Button, Card, Dialog, Empty, ErrorNote, Field, Icon, Loading, PageHead, Switch, reorder, useConfirm, useLoad, useToast } from '../ui.jsx';

function Thumb({ row, sizes = '240px', className = '' }) {
  const { src, srcSet } = photoSources(rowToPhoto(row));
  return <img className={className} src={src} srcSet={srcSet} sizes={sizes} alt="" loading="lazy" decoding="async" style={{ objectPosition: row.pos || '50% 50%' }} />;
}

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/* ------------------------------------------------------------ editor */
function PhotoEditor({ row, onClose, onSaved, onBin, homeCount }) {
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const pos = (draft.pos || '50% 50%').split(' ').map((v) => parseInt(v, 10));

  const pickFocus = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - r.left) / r.width) * 100);
    const y = Math.round(((e.clientY - r.top) / r.height) * 100);
    const value = `${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`;
    set({ pos: value, pos_mobile: value });
  };

  const save = async () => {
    if (row.on_home && !draft.on_home && homeCount <= 1) return toast('The home page needs at least one photo.', { error: true });
    setSaving(true);
    const patch = {
      alt: draft.alt.trim(),
      in_gallery: draft.in_gallery,
      on_home: draft.on_home,
      home_mono: draft.home_mono,
      pos: draft.pos,
      pos_mobile: draft.pos_mobile,
    };
    const res = await api.update('gallery_photos', row.id, patch);
    setSaving(false);
    if (!res.ok) return toast(res.error, { error: true });
    onSaved(res.data[0]);
    toast('Photo saved. The website shows the change straight away.');
  };

  return (
    <Dialog
      open
      wide
      onClose={onClose}
      title="Edit photo"
      footer={(
        <>
          <Button variant="quiet-danger" icon={Icon.bin} onClick={onBin} className="a-mr-auto">Move to Recently deleted</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={save}>Save</Button>
        </>
      )}
    >
      <div className="a-editor">
        <div>
          <button type="button" className="a-focus" onClick={pickFocus} aria-label="Choose the part of the photo to keep in view">
            <Thumb row={draft} sizes="(max-width: 700px) 90vw, 420px" className="a-focus__img" />
            <span className="a-focus__dot" style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }} aria-hidden="true" />
          </button>
          <p className="a-help">Tap the most important part, usually BBO’s face. When the photo is cropped to fit a screen, that part stays in view.</p>
          {draft.on_home && (
            <div className="a-crops" aria-hidden="true">
              <figure><div className="a-crops__frame a-crops__frame--wide"><Thumb row={draft} className={draft.home_mono ? 'is-mono' : ''} /></div><figcaption>Computer</figcaption></figure>
              <figure><div className="a-crops__frame a-crops__frame--tall"><Thumb row={draft} className={draft.home_mono ? 'is-mono' : ''} /></div><figcaption>Phone</figcaption></figure>
            </div>
          )}
        </div>
        <div className="a-stack">
          <Field label="Description" hint="Describe the photo for people using screen readers, e.g. “BBO ministering at LAUTECH”.">
            {(p) => <input {...p} maxLength={200} value={draft.alt} onChange={(e) => set({ alt: e.target.value })} />}
          </Field>
          <Switch label="Show in the gallery" description="The slideshow in the Gallery section." checked={draft.in_gallery} onChange={(v) => set({ in_gallery: v })} />
          <Switch label="Show on the home page" description="Photos at the top of the site change every 10 seconds." checked={draft.on_home} onChange={(v) => set({ on_home: v })} />
          {draft.on_home && (
            <Switch label="Black and white on the home page" description="Helps colour photos blend with the others." checked={draft.home_mono} onChange={(v) => set({ home_mono: v })} />
          )}
          {!draft.in_gallery && !draft.on_home && <p className="a-note">This photo will be kept but not shown anywhere on the website.</p>}
        </div>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------ page */
export default function Photos() {
  const { data, error, loading, reload, setData } = useLoad(() =>
    api.select('gallery_photos', 'select=*&deleted_at=is.null&order=gallery_sort.asc,created_at.asc'),
  );
  const [editing, setEditing] = useState(null);
  const [uploads, setUploads] = useState([]); // { id, name, status, error }
  const fileRef = useRef(null);
  const toast = useToast();
  const confirm = useConfirm();

  const gallery = useMemo(() => (data || []).filter((p) => p.in_gallery).sort((a, b) => a.gallery_sort - b.gallery_sort), [data]);
  const home = useMemo(() => (data || []).filter((p) => p.on_home).sort((a, b) => a.home_sort - b.home_sort), [data]);
  const hidden = useMemo(() => (data || []).filter((p) => !p.in_gallery && !p.on_home), [data]);

  const replaceRows = (rows) => setData((list) => list.map((p) => rows.find((r) => r.id === p.id) || p));

  const move = async (list, index, delta, key) => {
    const result = reorder(list, index, delta, key);
    if (!result) return;
    setData((all) => all.map((p) => result.next.find((n) => n.id === p.id) || p));
    const res = await Promise.all(result.updates.map((u) => api.update('gallery_photos', u.id, u.patch)));
    const failed = res.find((r) => !r.ok);
    if (failed) { toast(failed.error, { error: true }); reload(); }
  };

  const toggle = async (row, patch, message) => {
    const res = await api.update('gallery_photos', row.id, patch);
    if (!res.ok) return toast(res.error, { error: true });
    replaceRows(res.data);
    toast(message);
  };

  const bin = async (row) => {
    if (row.on_home && home.length <= 1) return toast('The home page needs at least one photo. Add another one first.', { error: true });
    const ok = await confirm({
      title: 'Move this photo to Recently deleted?',
      message: 'It disappears from the website straight away. You can restore it from Recently deleted for 30 days.',
      confirmLabel: 'Move to Recently deleted',
      danger: true,
    });
    if (!ok) return;
    const res = await moveToBin('gallery_photos', row.id);
    if (!res.ok) return toast(res.error, { error: true });
    setData((list) => list.filter((p) => p.id !== row.id));
    setEditing(null);
    toast('Photo moved to Recently deleted', { action: { label: 'Undo', onClick: async () => { await restore('gallery_photos', row.id); reload(); } } });
  };

  const onFiles = async (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    let nextSort = Math.max(-1, ...(data || []).map((p) => p.gallery_sort)) + 1;
    const items = files.map((f) => ({ id: newId(), name: f.name, status: 'Preparing' }));
    setUploads((u) => [...u, ...items]);
    const update = (id, patch) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, ...patch } : x)));

    for (let i = 0; i < files.length; i++) {
      const item = items[i];
      try {
        const img = await prepareImage(files[i]);
        update(item.id, { status: 'Uploading' });
        const base = `uploads/${new Date().toISOString().slice(0, 7)}/${item.id}`;
        const [a, b] = await Promise.all([api.upload(`${base}-800.jpg`, img.small), api.upload(`${base}-1600.jpg`, img.large)]);
        if (!a.ok || !b.ok) throw new Error((a.ok ? b : a).error);
        const res = await api.insert('gallery_photos', {
          kind: 'upload', ref: base, width: img.width, height: img.height, alt: '',
          in_gallery: true, gallery_sort: nextSort++, on_home: false, home_sort: 0, home_mono: false,
        });
        if (!res.ok) { await api.removeFiles([`${base}-800.jpg`, `${base}-1600.jpg`]); throw new Error(res.error); }
        setData((list) => [...(list || []), res.data[0]]);
        update(item.id, { status: 'Done' });
      } catch (err) {
        update(item.id, { status: 'Failed', error: err.message });
      }
    }
    setTimeout(() => setUploads((u) => u.filter((x) => x.status !== 'Done')), 2500);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadButton = (
    <>
      <input ref={fileRef} type="file" accept="image/*" multiple className="a-sr" id="photo-upload" onChange={(e) => onFiles(e.target.files)} />
      <label htmlFor="photo-upload" className="a-btn a-btn--primary"><Icon.upload /> Upload photos</label>
    </>
  );

  return (
    <>
      <PageHead
        title="Photos"
        description="Upload photos, choose what appears on the home page and in the gallery, and set the order. Changes appear on the website straight away."
        actions={uploadButton}
      />

      {uploads.length > 0 && (
        <ul className="a-uploads" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.id} className={`a-upload a-upload--${u.status.toLowerCase()}`}>
              {u.status === 'Preparing' || u.status === 'Uploading' ? <span className="a-spinner" aria-hidden="true" /> : u.status === 'Done' ? <Icon.check /> : <Icon.close />}
              <span className="a-upload__name">{u.name}</span>
              <span className="a-upload__status">{u.status === 'Failed' ? u.error : u.status === 'Done' ? 'Added to the gallery' : `${u.status}…`}</span>
              {u.status === 'Failed' && <Button size="sm" variant="ghost" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>Dismiss</Button>}
            </li>
          ))}
        </ul>
      )}

      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {loading && !data && <Loading />}

      {data && (
        <>
          <Card title="Home page" description={`These photos take turns at the top of the website, ${home.length === 1 ? 'shown on its own' : 'changing every 10 seconds'}. Use the arrows to set the order.`}>
            <ol className="a-strip">
              {home.map((p, i) => (
                <li key={p.id} className="a-tile">
                  <button type="button" className="a-tile__img a-tile__img--tall" onClick={() => setEditing(p)} aria-label={`Edit home page photo ${i + 1}`}>
                    <Thumb row={p} className={p.home_mono ? 'is-mono' : ''} />
                    <span className="a-tile__num">{i + 1}</span>
                  </button>
                  <div className="a-tile__bar">
                    <Button size="sm" variant="ghost" icon={Icon.left} disabled={i === 0} onClick={() => move(home, i, -1, 'home_sort')} aria-label="Show earlier" />
                    <Button size="sm" variant="ghost" onClick={() => (home.length <= 1 ? toast('The home page needs at least one photo.', { error: true }) : toggle(p, { on_home: false }, 'Removed from the home page'))}>Remove</Button>
                    <Button size="sm" variant="ghost" icon={Icon.right} disabled={i === home.length - 1} onClick={() => move(home, i, 1, 'home_sort')} aria-label="Show later" />
                  </div>
                </li>
              ))}
            </ol>
            <p className="a-help a-pad-x">To add a photo here, open it in the gallery below and turn on “Show on the home page”.</p>
          </Card>

          <Card title="Gallery" description={`${gallery.length} ${gallery.length === 1 ? 'photo' : 'photos'} in the slideshow, in this order. Tap a photo to edit it.`}>
            {gallery.length === 0 ? (
              <Empty icon={Icon.photo} title="The gallery is empty" action={uploadButton}>Upload photos to fill the gallery slideshow.</Empty>
            ) : (
              <ol className="a-photogrid">
                {gallery.map((p, i) => (
                  <li key={p.id} className="a-tile">
                    <button type="button" className="a-tile__img" onClick={() => setEditing(p)} aria-label={`Edit photo ${i + 1}${p.alt ? `: ${p.alt}` : ''}`}>
                      <Thumb row={p} />
                      <span className="a-tile__num">{i + 1}</span>
                      {p.on_home && <span className="a-tile__tag">Home page</span>}
                      {!p.alt && <span className="a-tile__tag a-tile__tag--warn">Needs description</span>}
                    </button>
                    <div className="a-tile__bar">
                      <Button size="sm" variant="ghost" icon={Icon.left} disabled={i === 0} onClick={() => move(gallery, i, -1, 'gallery_sort')} aria-label="Move earlier" />
                      <Button size="sm" variant="ghost" icon={Icon.edit} onClick={() => setEditing(p)}>Edit</Button>
                      <Button size="sm" variant="ghost" icon={Icon.right} disabled={i === gallery.length - 1} onClick={() => move(gallery, i, 1, 'gallery_sort')} aria-label="Move later" />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {hidden.length > 0 && (
            <Card title="Not shown on the website" description="Kept for later. Open a photo to put it back in the gallery or on the home page.">
              <ol className="a-photogrid a-photogrid--small">
                {hidden.map((p) => (
                  <li key={p.id} className="a-tile">
                    <button type="button" className="a-tile__img" onClick={() => setEditing(p)} aria-label="Edit hidden photo"><Thumb row={p} /></button>
                    <div className="a-tile__bar">
                      <Button size="sm" variant="ghost" onClick={() => toggle(p, { in_gallery: true, gallery_sort: Math.max(-1, ...gallery.map((g) => g.gallery_sort)) + 1 }, 'Added back to the gallery')}>Add to gallery</Button>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </>
      )}

      {editing && (
        <PhotoEditor
          row={editing}
          homeCount={home.length}
          onClose={() => setEditing(null)}
          onBin={() => bin(editing)}
          onSaved={(row) => {
            // Newly shown photos go to the end of their list.
            const fixes = {};
            if (row.on_home && !editing.on_home) fixes.home_sort = Math.max(-1, ...home.map((h) => h.home_sort)) + 1;
            if (row.in_gallery && !editing.in_gallery) fixes.gallery_sort = Math.max(-1, ...gallery.map((g) => g.gallery_sort)) + 1;
            if (Object.keys(fixes).length) api.update('gallery_photos', row.id, fixes).then((r) => r.ok && replaceRows(r.data));
            replaceRows([{ ...row, ...fixes }]);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
