import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'L8EntSpace Product Roadmap | The Future of GEO',
  description: 'Our master plan for building the deterministic operating system for AI-era search. Track completed milestones (SoV tracking, 768-D latent space mapping, drift detection) and upcoming GEO features.',
  metadataBase: new URL('https://l8entspace.com'),
  alternates: { canonical: 'https://l8entspace.com/roadmap' },
  openGraph: {
    title: 'L8EntSpace Product Roadmap | The Future of GEO',
    description: 'Track completed milestones and upcoming features in the L8EntSpace GEO platform.',
    url: 'https://l8entspace.com/roadmap',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'L8EntSpace Roadmap' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'L8EntSpace Product Roadmap | The Future of GEO',
    description: 'Track completed milestones and upcoming features in the L8EntSpace GEO platform.',
    images: ['/geo-infographic.png'],
  },
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
