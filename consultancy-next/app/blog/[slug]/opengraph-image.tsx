import { ImageResponse } from 'next/og';
import { blogPosts } from '@/data/blogPosts';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find(p => p.slug === slug);

  const title = post?.title || 'L8EntSpace — GEO Strategy';
  const category = post?.category || 'GEO';
  const fontSize = title.length > 70 ? 40 : title.length > 50 ? 48 : 56;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#09090b',
          padding: '0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Pink grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,20,147,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,20,147,0.12) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,20,147,0.18) 0%, transparent 70%)',
          }}
        />

        {/* White border */}
        <div
          style={{
            position: 'absolute',
            inset: '4px',
            border: '2px solid rgba(255,255,255,0.9)',
            display: 'flex',
          }}
        />
        {/* Pink outer border */}
        <div
          style={{
            position: 'absolute',
            inset: '0px',
            border: '4px solid rgba(255,20,147,0.9)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '64px 72px',
            flex: 1,
            gap: '0',
          }}
        >
          {/* Category pill */}
          <div
            style={{
              display: 'flex',
              marginBottom: '24px',
            }}
          >
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#f9a8d4',
                backgroundColor: 'rgba(255,20,147,0.15)',
                border: '1px solid rgba(255,20,147,0.4)',
                padding: '5px 16px',
                borderRadius: '100px',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              {category}
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: '40px',
              maxWidth: '1000px',
            }}
          >
            {title}
          </div>

          {/* Branding row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,20,147,0.2)',
                border: '1px solid rgba(255,20,147,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#ff1493', fontSize: '18px', fontWeight: 900 }}>A</span>
            </div>
            <span style={{ color: '#ff1493', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              L8EntSpace
            </span>
            <span style={{ color: '#3f3f46', fontSize: '20px' }}>·</span>
            <span style={{ color: '#71717a', fontSize: '16px' }}>l8entspace.com</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
