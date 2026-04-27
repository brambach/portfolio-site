import { useCallback, useEffect, useState } from 'react';

const PARAM = 'project';

function readSlug(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(PARAM);
}

export function useProjectFromUrl() {
  const [openSlug, setOpenSlug] = useState<string | null>(() => readSlug());

  useEffect(() => {
    function onPop() {
      setOpenSlug(readSlug());
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openProject = useCallback((slug: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(PARAM, slug);
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    setOpenSlug(slug);
  }, []);

  const closeProject = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete(PARAM);
    const search = url.search ? url.search : '';
    window.history.pushState({}, '', `${url.pathname}${search}`);
    setOpenSlug(null);
  }, []);

  return { openSlug, openProject, closeProject };
}
