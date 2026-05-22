"use client";
import React, { useRef, useState } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  zoomLevel?: number;
}

export function ImageZoom({ src, alt, zoomLevel = 2.5 }: ImageZoomProps) {
  const [showZoom, setShowZoom] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  const updateLens = (clientX: number, clientY: number) => {
    if (!imgRef.current || !lensRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setShowZoom(false);
      return;
    }

    const lensSize = 450;
    const lensRadius = lensSize / 2;

    // Clamp lens so it never leaves the image area
    const lensLeft = Math.max(0, Math.min(x - lensRadius, rect.width - lensSize));
    const lensTop = Math.max(0, Math.min(y - lensRadius, rect.height - lensSize));

    // Clamp background offset so the scaled image never shows empty space
    const bgPosX = Math.max(0, Math.min(x * zoomLevel - lensRadius, rect.width * zoomLevel - lensSize));
    const bgPosY = Math.max(0, Math.min(y * zoomLevel - lensRadius, rect.height * zoomLevel - lensSize));

    const lens = lensRef.current;
    lens.style.left = `${lensLeft}px`;
    lens.style.top = `${lensTop}px`;
    lens.style.backgroundImage = `url('${src}')`;
    lens.style.backgroundSize = `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`;
    lens.style.backgroundPosition = `-${bgPosX}px -${bgPosY}px`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    updateLens(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    updateLens(e.touches[0].clientX, e.touches[0].clientY);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto group cursor-crosshair">
      <div
        className="relative"
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={() => setShowZoom(true)}
        onTouchEnd={() => setShowZoom(false)}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full h-auto block rounded-xl shadow-[0_0_0_2px_rgba(255,255,255,1),0_0_0_4px_rgba(190,24,93,1)]"
        />
        <div
          ref={lensRef}
          className="absolute rounded-full pointer-events-none z-30 border-2 border-white/20 bg-zinc-900 bg-no-repeat"
          style={{
            width: '450px',
            height: '450px',
            display: showZoom ? 'block' : 'none',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)',
          }}
        />
      </div>
    </div>
  );
}
