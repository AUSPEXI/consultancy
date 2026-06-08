import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GEO Resources | Guides, Reports & Tools | L8EntSpace',
  description: 'Free guides, reports, and tools to master Generative Engine Optimization. Download the CEO\'s GEO playbook, the 2026 State of AI Search report, and the Latent Space Moat deep-dive.',
  metadataBase: new URL('https://l8entspace.com'),
  alternates: { canonical: 'https://l8entspace.com/resources' },
  openGraph: {
    title: 'GEO Resources | Guides, Reports & Tools | L8EntSpace',
    description: 'Free guides, reports, and tools to master Generative Engine Optimization and dominate AI search.',
    url: 'https://l8entspace.com/resources',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'GEO Resources — L8EntSpace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEO Resources | Guides, Reports & Tools | L8EntSpace',
    description: 'Free guides, reports, and tools to master Generative Engine Optimization.',
    images: ['/geo-infographic.png'],
  },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
