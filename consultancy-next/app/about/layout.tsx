import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Auspexi | GEO Platform for AI-Era Brand Authority',
  description: 'Auspexi is the infrastructure layer for AI-era brand authority. We engineer structured knowledge that forces ChatGPT, Gemini, Claude, and Perplexity to cite your brand as the authoritative answer.',
  metadataBase: new URL('https://auspexi.com'),
  alternates: { canonical: 'https://auspexi.com/about' },
  openGraph: {
    title: 'About Auspexi | GEO Platform for AI-Era Brand Authority',
    description: 'We engineer the structured knowledge that forces AI models to cite your brand as the authoritative answer.',
    url: 'https://auspexi.com/about',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'Auspexi GEO Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Auspexi | GEO Platform for AI-Era Brand Authority',
    description: 'We engineer the structured knowledge that forces AI models to cite your brand as the authoritative answer.',
    images: ['/geo-infographic.png'],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
