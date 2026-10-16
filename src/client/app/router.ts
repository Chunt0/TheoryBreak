import { useEffect, useState } from 'react';

const parse = (): string[] => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);

export function useRoute(): string[] {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function go(path: string): void {
  location.hash = path.startsWith('#') ? path : `#/${path.replace(/^\//, '')}`;
}

export const href = (path: string): string => `#/${path.replace(/^\//, '')}`;
