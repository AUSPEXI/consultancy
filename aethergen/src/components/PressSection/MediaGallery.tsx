import React, { useEffect, useState } from 'react';

type MediaItem = {
  type: 'image' | 'video'
  src: string
  alt?: string
  caption?: string
}

const defaultItems: MediaItem[] = [
  { type: 'image', src: '/og-image.svg', alt: 'AethergenAI OG Image', caption: 'AethergenAI overview' },
  { type: 'image', src: '/auspexi.svg', alt: 'Auspexi logo', caption: 'Auspexi brand' },
];

const MediaGallery: React.FC<{ items?: MediaItem[] }> = ({ items }) => {
  const [loaded, setLoaded] = useState<MediaItem[] | null>(items || null);

  useEffect(() => {
    let cancelled = false;
    if (loaded) return;
    fetch('/press/manifest.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.items)) {
          const sanitized: MediaItem[] = (data.items as any[])
            .filter((it) => (it && (it.type === 'image' || it.type === 'video') && typeof it.src === 'string' && it.src.length > 0))
            .map((it) => ({ type: it.type, src: it.src, alt: it.alt, caption: it.caption }))
          setLoaded(sanitized.length > 0 ? sanitized : defaultItems)
        } else {
          setLoaded(defaultItems)
        }
      })
      .catch(() => setLoaded(defaultItems));
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  const itemsToShow = loaded || defaultItems;

  return (
    <div>
      <h3 className="text-2xl font-bold text-white mb-6">Media Gallery</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {itemsToShow.map((m, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
            {m.type === 'image' ? (
              <img src={m.src} alt={m.alt || ''} className="w-full h-48 object-contain bg-white" />
            ) : (
              <video controls className="w-full h-48 bg-black">
                <source src={m.src} />
              </video>
            )}
            {m.caption && (
              <div className="p-3 text-sm text-white/80">{m.caption}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaGallery;



