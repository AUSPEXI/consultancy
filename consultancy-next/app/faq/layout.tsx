import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GEO FAQs | Generative Engine Optimization Explained | Auspexi',
  description: 'Deep-dive answers on Generative Engine Optimization — Cite-Magnets, 768-D latent space mapping, AI Share of Voice tracking, semantic drift detection, and AI-era brand strategy.',
  metadataBase: new URL('https://auspexi.com'),
  alternates: { canonical: 'https://auspexi.com/faq' },
  openGraph: {
    title: 'GEO FAQs | Generative Engine Optimization Explained | Auspexi',
    description: 'Deep-dive answers on GEO — Cite-Magnets, latent space mapping, Share of Voice tracking, and AI-era brand strategy.',
    url: 'https://auspexi.com/faq',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'GEO FAQ — Auspexi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEO FAQs | Generative Engine Optimization Explained | Auspexi',
    description: 'Deep-dive answers on Generative Engine Optimization from the Auspexi team.',
    images: ['/geo-infographic.png'],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
