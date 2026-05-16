"use client";
import React, { useRef, useState, MouseEvent as ReactMouseEvent } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  zoomLevel?: number;
}

export function ImageZoom({ src, alt, zoomLevel = 2.5 }: ImageZoomProps) {
  const [showZoom, setShowZoom] = useState(false);
  const [lensStyle, setLensStyle] = useState<React.CSSProperties>({});
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imgRef.current) return;
    
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    // Cursor position relative to the image
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Prevent lens from showing if cursor is outside the image bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      setShowZoom(false);
      return;
    } else {
      setShowZoom(true);
    }

    const lensSize = 250; // 250px width/height for the magnifying glass
    const lensRadius = lensSize / 2;

    // Calculate background position
    const bgPosX = (x * zoomLevel) - lensRadius;
    const bgPosY = (y * zoomLevel) - lensRadius;

    setLensStyle({
      left: `${x - lensRadius}px`,
      top: `${y - lensRadius}px`,
      width: `${lensSize}px`,
      height: `${lensSize}px`,
      backgroundImage: `url('${src}')`,
      backgroundSize: `${rect.width * zoomLevel}px ${rect.height * zoomLevel}px`,
      backgroundPosition: `-${bgPosX}px -${bgPosY}px`,
      backgroundRepeat: 'no-repeat',
    });
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto group cursor-crosshair">
      <div 
        className="relative"
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
        onTouchStart={() => setShowZoom(true)}
        onTouchEnd={() => setShowZoom(false)}
      >
        <img 
          ref={imgRef}
          src={src} 
          alt={alt} 
          className="w-full h-auto block rounded-xl border border-zinc-800 shadow-2xl"
        />
        {showZoom && (
          <div 
            className="absolute rounded-full pointer-events-none z-30 border-2 border-white/20 bg-zinc-900"
            style={{
              ...lensStyle,
              boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 10px 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(0,0,0,0.5)'
            }}
          />
        )}
      </div>
    </div>
  );
}
