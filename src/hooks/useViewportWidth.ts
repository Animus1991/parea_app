import { useEffect, useState } from 'react';

function readWidth(): number {
  return typeof window === 'undefined' ? 1024 : window.innerWidth;
}

/** Live `window.innerWidth` for layout that must match the screen, not a breakpoint query. */
export function useViewportWidth(): number {
  const [width, setWidth] = useState(readWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}
