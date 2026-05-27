import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Auspexi Product Roadmap | The Future of GEO',
  description: 'Our master plan for building the deterministic operating system for AI-era search. Track completed milestones — SoV tracking, 768-D latent space mapping, drift detection — and upcoming GEO features.',
  metadataBase: new URL('https://auspexi.com'),
  alternates: { canonical: 'https://auspexi.com/roadmap' },
  openGraph: {
    title: 'Auspexi Product Roadmap | The Future of GEO',
    description: 'Track completed milestones and upcoming features in the Auspexi GEO platform.',
    url: 'https://auspexi.com/roadmap',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'Auspexi Roadmap' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auspexi Product Roadmap | The Future of GEO',
    description: 'Track completed milestones and upcoming features in the Auspexi GEO platform.',
    images: ['/geo-infographic.png'],
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
