'use client'

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    setVisible(true);
    setProgress(15);

    timers.current.push(setTimeout(() => setProgress(60), 80));
    timers.current.push(setTimeout(() => setProgress(85), 250));
    timers.current.push(setTimeout(() => setProgress(100), 450));
    timers.current.push(setTimeout(() => setVisible(false), 700));

    return () => timers.current.forEach(clearTimeout);
  }, [pathname]);

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-pink-500 shadow-[0_0_8px_rgba(255,20,147,0.6)] pointer-events-none"
      style={{
        width: visible ? `${progress}%` : '0%',
        opacity: visible ? 1 : 0,
        transition: visible
          ? 'width 300ms ease-out, opacity 200ms ease'
          : 'opacity 300ms ease, width 0ms',
      }}
    />
  );
}
