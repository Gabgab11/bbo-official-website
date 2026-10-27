import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

/* ---------------------------------------------------------------- icons */
const I = (d, extra) => () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...extra}>{d}</svg>
);
export const Icon = {
  home: I(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>),
  inbox: I(<><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5 5h14l2 8v6H3v-6z" /></>),
  photo: I(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 17-5-5-9 8" /></>),
  text: I(<><path d="M4 6h16M4 12h10M4 18h13" /></>),
  music: I(<><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>),
  users: I(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.9 2.6 2.6 3 5.2" /></>),
  mail: I(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  bin: I(<><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></>),
  user: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4.2 4.2-6.5 8-6.5s7 2.3 8 6.5" /></>),
  more: I(<><circle cx="5" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="19" cy="12" r="1.2" fill="currentColor" /></>),
  plus: I(<path d="M12 5v14M5 12h14" />),
  up: I(<path d="m6 15 6-6 6 6" />),
  down: I(<path d="m6 9 6 6 6-6" />),
  left: I(<path d="m15 6-6 6 6 6" />),
  right: I(<path d="m9 6 6 6-6 6" />),
  close: I(<path d="M6 6l12 12M18 6 6 18" />),
  check: I(<path d="m5 12.5 4.5 4.5L19 7.5" />),
  external: I(<><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>),
  upload: I(<><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>),
  edit: I(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>),
  restore: I(<><path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5" /><path d="M4 4v4.5h4.5" /></>),
  logout: I(<><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" /><path d="M10 16l-4-4 4-4M6 12h10" /></>),
  link: I(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>),
  download: I(<><path d="M12 4v12M7 11l5 5 5-5" /><path d="M4 20h16" /></>),
  play: I(<path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />),
  search: I(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>),
  phone: I(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />),
  calendar: I(<><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>),
  pin: I(<><path d="M12 21s-7-6.3-7-11.5a7 7 0 0 1 14 0C19 14.7 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>),
};

/* -------------------------------------------------------------- buttons */
export function Button({ variant = 'default', size, icon: Ico, children, loading, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`a-btn a-btn--${variant}${size ? ` a-btn--${size}` : ''}${!children ? ' a-btn--icon' : ''} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <span className="a-spinner" aria-hidden="true" /> : Ico ? <Ico /> : null}
      {children}
    </button>
  );
}

/* --------------------------------------------------------------- fields */
export function Field({ label, hint, error, optional, children, className = '' }) {
  const id = useId();
  const child = typeof children === 'function' ? children({ id, 'aria-describedby': hint || error ? `${id}-help` : undefined, 'aria-invalid': error ? 'true' : undefined }) : children;
  return (
    <div className={`a-field ${className}`}>
      <label htmlFor={id}>{label}{optional && <span className="a-optional"> (optional)</span>}</label>
      {child}
      {(error || hint) && <p className={`a-help${error ? ' a-help--error' : ''}`} id={`${id}-help`}>{error || hint}</p>}
    </div>
  );
}

export function Switch({ checked, onChange, label, description, disabled }) {
  const id = useId();
  return (
    <div className="a-switch">
      <div className="a-switch__text">
        <label htmlFor={id}>{label}</label>
        {description && <p>{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className="a-switch__control"
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- dialog */
export function Dialog({ open, onClose, title, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    const d = ref.current;
    const onCancel = (e) => { e.preventDefault(); onClose(); };
    d?.addEventListener('cancel', onCancel);
    return () => d?.removeEventListener('cancel', onCancel);
  }, [onClose]);
  return (
    <dialog ref={ref} className={`a-dialog${wide ? ' a-dialog--wide' : ''}`} aria-labelledby="a-dialog-title" onClick={(e) => e.target === e.currentTarget && onClose()}>
      {open && (
        <div className="a-dialog__panel">
          <header className="a-dialog__head">
            <h2 id="a-dialog-title">{title}</h2>
            <Button variant="ghost" icon={Icon.close} onClick={onClose} aria-label="Close" />
          </header>
          <div className="a-dialog__body">{children}</div>
          {footer && <footer className="a-dialog__foot">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

/** Promise-based confirmation, e.g. `if (await confirm({...})) ...` */
const ConfirmContext = createContext(async () => false);
export const useConfirm = () => useContext(ConfirmContext);

/* ---------------------------------------------------------------- toast */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function Providers({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);

  const toast = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-2), { id, message, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.action ? 7000 : 3800);
  }, []);

  const confirm = useCallback((opts) => new Promise((resolve) => setConfirmState({ ...opts, resolve })), []);
  const settle = (value) => { confirmState?.resolve(value); setConfirmState(null); };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <Dialog
          open={!!confirmState}
          onClose={() => settle(false)}
          title={confirmState?.title}
          footer={confirmState && (
            <>
              <Button onClick={() => settle(false)}>Cancel</Button>
              <Button variant={confirmState.danger ? 'danger' : 'primary'} onClick={() => settle(true)}>{confirmState.confirmLabel || 'Confirm'}</Button>
            </>
          )}
        >
          <p className="a-muted">{confirmState?.message}</p>
        </Dialog>
        <div className="a-toasts" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`a-toast${t.error ? ' a-toast--error' : ''}`}>
              <span>{t.message}</span>
              {t.action && (
                <button type="button" onClick={() => { t.action.onClick(); setToasts((x) => x.filter((y) => y.id !== t.id)); }}>
                  {t.action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

/* --------------------------------------------------------------- layout */
export function PageHead({ title, description, actions }) {
  return (
    <header className="a-pagehead">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="a-pagehead__actions">{actions}</div>}
    </header>
  );
}

export function Card({ title, description, actions, children, className = '' }) {
  return (
    <section className={`a-card ${className}`}>
      {(title || actions) && (
        <header className="a-card__head">
          <div>
            {title && <h2>{title}</h2>}
            {description && <p>{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Empty({ icon: Ico = Icon.inbox, title, children, action }) {
  return (
    <div className="a-empty">
      <span className="a-empty__icon"><Ico /></span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading' }) {
  return <div className="a-loading"><span className="a-spinner" aria-hidden="true" /> {label}…</div>;
}

export function ErrorNote({ children, onRetry }) {
  return (
    <div className="a-note a-note--error" role="alert">
      <span>{children}</span>
      {onRetry && <Button size="sm" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

/* -------------------------------------------------------------- helpers */
/** Loads data and exposes { data, error, loading, reload, setData }. */
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const res = await loader();
    setState({ data: res.ok ? res.data : null, error: res.ok ? null : res.error, loading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  const setData = useCallback((fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })), []);
  return { ...state, reload, setData };
}

const rtf = typeof Intl !== 'undefined' && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) : null;
export function timeAgo(iso) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(s);
  if (!rtf) return new Date(iso).toLocaleString();
  if (abs < 60) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(s / 86400), 'day');
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(d) {
  if (!d) return '';
  return new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Days left before something in the bin is erased. */
export function daysLeft(deletedAt) {
  const end = new Date(deletedAt).getTime() + 30 * 86400000;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
}

/** Admin pages live at real addresses: /admin, /admin/bookings, /admin/join/<code>… */
export const adminPath = (section) => (section ? `/admin/${section}` : '/admin');

export const navigate = (section, { replace = false } = {}) => {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', adminPath(section));
  window.dispatchEvent(new PopStateEvent('popstate'));
};

/** The public website's address (the domain root), e.g. https://www.officialbbo.com/ */
export const siteUrl = () => `${window.location.origin}/`;

/** Swaps an item with its neighbour and returns the updates to save. */
export function reorder(list, index, delta, sortKey) {
  const target = index + delta;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  const updates = [];
  next.forEach((item, i) => {
    if (item[sortKey] !== i) updates.push({ id: item.id, patch: { [sortKey]: i } });
  });
  return { next: next.map((item, i) => ({ ...item, [sortKey]: i })), updates };
}
