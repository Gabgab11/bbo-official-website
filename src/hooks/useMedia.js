import { useEffect, useState } from 'react';

/** Tracks a CSS media query. */
export function useMediaQuery(query) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches;
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

export const useIsMobile = () => useMediaQuery('(max-width: 760px)');
export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/** True while the browser tab is visible. */
export function usePageVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  return visible;
}
