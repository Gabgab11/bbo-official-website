import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { defaults } from '../../lib/siteContent.jsx';
import { Button, Card, ErrorNote, Field, Icon, Loading, PageHead, siteUrl, timeAgo, useLoad, useToast } from '../ui.jsx';

const SECTIONS = [
  {
    key: 'hero',
    title: 'Home page',
    description: 'The text under the large “BBO” at the top of the site.',
    anchor: '',
    fields: [
      { name: 'fullName', label: 'Name line', max: 80 },
      { name: 'headline', label: 'Headline', max: 120, hint: 'One short sentence.' },
    ],
  },
  {
    key: 'featured',
    title: 'Featured release',
    description: 'Shown on the home page and at the top of the Music section.',
    anchor: '#music',
    fields: [
      { name: 'title', label: 'Title', max: 80 },
      { name: 'description', label: 'Description', max: 280, multiline: true },
      { name: 'href', label: 'Listening link', max: 300, type: 'url', hint: 'Where “Stream on Spotify” and “Listen on Spotify” go. Starts with https://' },
    ],
  },
  {
    key: 'about',
    title: 'About',
    description: 'BBO’s story. On phones, only the first paragraph shows until the visitor taps “Read the full story”.',
    anchor: '#about',
    fields: [
      { name: 'title', label: 'Heading', max: 80 },
      { name: 'paragraphs', label: 'Paragraphs', paragraphs: true },
      { name: 'quote', label: 'Quote', max: 240, multiline: true, optional: true, hint: 'Leave empty to hide the quote.' },
      { name: 'quoteSource', label: 'Where the quote is from', max: 80, optional: true, hint: 'e.g. ThisDay, October 2024' },
      { name: 'quoteHref', label: 'Link to the source', max: 300, type: 'url', optional: true },
    ],
  },
  {
    key: 'booking',
    title: 'Booking section',
    description: 'Introduces the booking form.',
    anchor: '#booking',
    fields: [
      { name: 'title', label: 'Heading', max: 80 },
      { name: 'lede', label: 'Introduction', max: 300, multiline: true },
    ],
  },
  {
    key: 'newsletter',
    title: 'Newsletter section',
    description: 'Introduces the email sign-up.',
    anchor: '#booking',
    fields: [
      { name: 'title', label: 'Heading', max: 80 },
      { name: 'lede', label: 'Introduction', max: 240, multiline: true },
    ],
  },
];

function validate(section, value) {
  const errors = {};
  for (const f of section.fields) {
    const v = value[f.name];
    if (f.paragraphs) {
      const filled = (v || []).filter((p) => p.trim());
      if (!filled.length) errors[f.name] = 'Add at least one paragraph.';
      continue;
    }
    if (!f.optional && !String(v || '').trim()) errors[f.name] = 'This cannot be empty.';
    if (f.type === 'url' && String(v || '').trim() && !/^https:\/\/\S+\.\S+/.test(v.trim())) errors[f.name] = 'Enter a full link starting with https://';
  }
  return errors;
}

function SectionEditor({ section, row, profile, onSaved }) {
  const initial = { ...defaults[section.key], ...(row?.value || {}) };
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const dirty = JSON.stringify(value) !== JSON.stringify(initial);

  useEffect(() => { setValue({ ...defaults[section.key], ...(row?.value || {}) }); }, [row, section.key]);

  const set = (name, v) => setValue((x) => ({ ...x, [name]: v }));

  const save = async () => {
    const found = validate(section, value);
    setErrors(found);
    if (Object.keys(found).length) return;
    const clean = Object.fromEntries(Object.entries(value).map(([k, v]) => [k, Array.isArray(v) ? v.map((p) => p.trim()).filter(Boolean) : String(v ?? '').trim()]));
    setSaving(true);
    const res = await api.update('site_content', section.key, { value: clean, updated_at: new Date().toISOString(), updated_by: profile.user_id }, 'key');
    setSaving(false);
    if (!res.ok) return toast(res.error, { error: true });
    if (!res.data?.length) return toast('Could not save. Sign out and in again, then try once more.', { error: true });
    onSaved(res.data[0]);
    toast(`${section.title} saved. Visitors see it the next time they open the website.`);
  };

  return (
    <Card
      title={section.title}
      description={section.description}
      actions={<a className="a-link a-nowrap" href={`${siteUrl()}${section.anchor}`} target="_blank" rel="noopener noreferrer">View on site <Icon.external /></a>}
    >
      <div className="a-stack a-pad">
        {section.fields.map((f) => {
          if (f.paragraphs) {
            const list = value[f.name] || [];
            return (
              <fieldset key={f.name} className="a-paragraphs">
                <legend>{f.label}</legend>
                <p className="a-help">Put *asterisks* around a song title to show it in italics, e.g. *Most High*.</p>
                {list.map((p, i) => (
                  <div key={i} className="a-paragraph">
                    <label className="a-sr" htmlFor={`${section.key}-p${i}`}>Paragraph {i + 1}</label>
                    <textarea id={`${section.key}-p${i}`} rows={5} maxLength={1200} value={p} onChange={(e) => set(f.name, list.map((x, j) => (j === i ? e.target.value : x)))} />
                    <div className="a-paragraph__bar">
                      <span className="a-muted">Paragraph {i + 1}{i === 0 ? ' (always visible)' : ''}</span>
                      <Button size="sm" variant="ghost" icon={Icon.up} disabled={i === 0} aria-label="Move paragraph up" onClick={() => { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; set(f.name, n); }} />
                      <Button size="sm" variant="ghost" icon={Icon.down} disabled={i === list.length - 1} aria-label="Move paragraph down" onClick={() => { const n = [...list]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; set(f.name, n); }} />
                      <Button size="sm" variant="quiet-danger" disabled={list.length <= 1} onClick={() => set(f.name, list.filter((_, j) => j !== i))}>Remove</Button>
                    </div>
                  </div>
                ))}
                {errors[f.name] && <p className="a-help a-help--error">{errors[f.name]}</p>}
                {list.length < 8 && <Button size="sm" icon={Icon.plus} onClick={() => set(f.name, [...list, ''])}>Add a paragraph</Button>}
              </fieldset>
            );
          }
          return (
            <Field key={f.name} label={f.label} hint={f.hint} optional={f.optional} error={errors[f.name]}>
              {(p) => f.multiline
                ? <textarea {...p} rows={3} maxLength={f.max} value={value[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} />
                : <input {...p} type={f.type === 'url' ? 'url' : 'text'} inputMode={f.type === 'url' ? 'url' : undefined} maxLength={f.max} value={value[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} />}
            </Field>
          );
        })}
      </div>
      <footer className="a-card__foot">
        <span className="a-muted">{dirty ? 'Unsaved changes' : row?.updated_at ? `Last saved ${timeAgo(row.updated_at)}` : ''}</span>
        <div className="a-row">
          {dirty && <Button onClick={() => { setValue(initial); setErrors({}); }}>Discard</Button>}
          <Button variant="primary" loading={saving} disabled={!dirty} onClick={save}>Save {section.title.toLowerCase()}</Button>
        </div>
      </footer>
    </Card>
  );
}

export default function TextPage({ profile }) {
  const { data, error, loading, reload, setData } = useLoad(() => api.select('site_content', 'select=*'));
  return (
    <>
      <PageHead title="Site text" description="Change the words on the website. Each section saves on its own." />
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {loading && !data && <Loading />}
      {data && (
        <div className="a-stack-l">
          {SECTIONS.map((s) => (
            <SectionEditor
              key={s.key}
              section={s}
              profile={profile}
              row={data.find((r) => r.key === s.key)}
              onSaved={(row) => setData((list) => list.map((r) => (r.key === row.key ? row : r)))}
            />
          ))}
        </div>
      )}
    </>
  );
}
