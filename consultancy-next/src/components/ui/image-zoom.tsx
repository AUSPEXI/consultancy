"use client";
import React, { useRef, useState, useCallback } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  zoomLevel?: number;
}

export function ImageZoom({ src, alt, zoomLevel = 2.5 }: ImageZoomProps) {
  const [showZoom, setShowZoom] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  // The lens is sized relative to the rendered image so it stays usable on
  // every screen: ~48% of the shorter image edge, clamped to a sane range.
  // On a ~360px-wide phone this yields a ~170px lens (it used to be a fixed
  // 450px — larger than the whole image, which pinned it to the top-left and
  // hid the edges). The lens dimensions are written on every update so it
  // adapts to orientation changes and responsive breakpoints.
  const lensSizeFor = (rect: DOMRect) =>
    Math.round(Math.max(150, Math.min(rect.width, rect.height) * 0.48, Math.min(420, rect.width * 0.6)));

  const updateLens = useCallback((clientX: number, clientY: number) => {
    if (!imgRef.current || !lensRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setShowZoom(false);
      return;
    }

    const lensSize = lensSizeFor(rect);
    const lensRadius = lensSize / 2;

    // Clamp the lens so it never leaves the image area.
    const lensLeft = Math.max(0, Math.min(x - lensRadius, rect.width - lensSize));
    const lensTop = Math.max(0, Math.min(y - lensRadius, rect.height - lensSize));

    // Clamp the background offset so the scaled image never shows empty space.
    const bgPosX = Math.max(0, Math.min(x * zoomLevel - lensRadius, rect.width * zoomLevel - lensSize));
    const bgPosY = Math.max(0, Math.min(y * zoomLevel - lensRadius, rect.height * zoomLevel - lensSize));

    const lens = lensRef.current;
    lens.style.width = `${lensSize}px`;
    lens.style.height = `${lensSize}px`;
    lens.style.left = `${lensLeft}px`;
    lens.style.top = `${lensTop}px`;
    lens.style.backgroundImage = `url('${src}')`;
    lens.style.backgroundSize = `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`;
    lens.style.backgroundPosition = `-${bgPosX}px -${bgPosY}px`;
  }, [src, zoomLevel]);

  const handleEnter = (clientX: number, clientY: number) => {
    setShowZoom(true);
    // Position immediately so the lens shows content on first contact rather
    // than appearing as a grey disc until the first move event.
    updateLens(clientX, clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => updateLens(e.clientX, e.clientY);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    // Prevent the page from scrolling while the user pans the lens.
    e.preventDefault();
    updateLens(e.touches[0].clientX, e.touches[0].clientY);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto group cursor-crosshair">
      <div
        className="relative touch-none"
        onMouseEnter={(e) => handleEnter(e.clientX, e.clientY)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={(e) => e.touches.length && handleEnter(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setShowZoom(false)}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-auto block rounded-xl shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(255,20,147,1)]"
        />
        <div
          ref={lensRef}
          className="absolute rounded-full pointer-events-none z-30 border-2 border-pink-500/40 bg-zinc-900 bg-no-repeat"
          style={{
            display: showZoom ? 'block' : 'none',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        />
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500 select-none">
        Hover (or touch &amp; drag on mobile) to magnify
      </p>
    </div>
  );
}
