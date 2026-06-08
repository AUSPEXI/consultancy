import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GEO FAQs | Generative Engine Optimization Explained | L8EntSpace',
  description: 'Deep-dive answers on Generative Engine Optimization — Cite-Magnets, 768-D latent space mapping, AI Share of Voice tracking, semantic drift detection, and AI-era brand strategy.',
  metadataBase: new URL('https://l8entspace.com'),
  alternates: { canonical: 'https://l8entspace.com/faq' },
  openGraph: {
    title: 'GEO FAQs | Generative Engine Optimization Explained | L8EntSpace',
    description: 'Deep-dive answers on GEO — Cite-Magnets, latent space mapping, Share of Voice tracking, and AI-era brand strategy.',
    url: 'https://l8entspace.com/faq',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'GEO FAQ — L8EntSpace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GEO FAQs | Generative Engine Optimization Explained | L8EntSpace',
    description: 'Deep-dive answers on Generative Engine Optimization from the L8EntSpace team.',
    images: ['/geo-infographic.png'],
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
