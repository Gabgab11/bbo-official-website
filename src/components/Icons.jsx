const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false };

export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 3.5v17l14-8.5z" fill="currentColor" /></svg>
);
export const PauseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" /></svg>
);
export const HeadphonesIcon = () => (
  <svg {...base}><path d="M3 14v-2a9 9 0 0 1 18 0v2" /><path d="M21 15a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 15a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z" /></svg>
);
export const CloseIcon = () => (
  <svg {...base}><path d="M5 5l14 14M19 5L5 19" /></svg>
);
export const ArrowLeft = () => (
  <svg {...base}><path d="M15 5l-7 7 7 7" /></svg>
);
export const ArrowRight = () => (
  <svg {...base}><path d="M9 5l7 7-7 7" /></svg>
);
