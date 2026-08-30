import { useEffect } from 'react';

/** Leave the tab and the title changes; come back and it's home. */
export function WindowTitle() {
  useEffect(() => {
    const onVis = () => {
      document.title = document.hidden ? 'the hare waits.' : 'bryce.';
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      document.title = 'bryce.';
    };
  }, []);
  return null;
}
