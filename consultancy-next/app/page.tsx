import type { Metadata } from 'next'
import { LandingPageClient } from './components/LandingPageClient'

export const metadata: Metadata = {
  title: 'Auspexi | Generative Engine Optimization (GEO)',
  description: "Auspexi is the leading Generative Engine Optimization (GEO) platform. Track your brand's AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity.",
  keywords: 'generative engine optimization, GEO, AI search optimization, LLM SEO, brand visibility AI, AI share of voice, ChatGPT SEO',
  robots: { index: true, follow: true },
  metadataBase: new URL('https://auspexi.com'),
  openGraph: {
    title: 'Auspexi | Generative Engine Optimization (GEO)',
    description: 'Ensure your brand is cited by ChatGPT, Gemini, Claude and Perplexity. Track AI Share of Voice, inject cite-magnet facts, detect sentiment drift.',
    url: 'https://auspexi.com',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'Auspexi GEO Dashboard' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auspexi | Generative Engine Optimization (GEO)',
    description: 'The premier GEO platform. Track your brand across ChatGPT, Gemini, Claude and Perplexity.',
    images: ['/geo-infographic.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://auspexi.com/#app',
      name: 'Auspexi',
      applicationCategory: 'BusinessApplication',
      description: 'Generative Engine Optimization (GEO) platform tracking brand AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity.',
      url: 'https://auspexi.com',
      image: 'https://auspexi.com/geo-infographic.png',
      offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: '149', highPrice: '1899' },
    },
    {
      '@type': 'Organization',
      '@id': 'https://auspexi.com/#org',
      name: 'Auspexi',
      url: 'https://auspexi.com',
      logo: 'https://auspexi.com/geo-infographic.png',
      description: 'The leading Generative Engine Optimization platform. Track and grow your brand\'s AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity.',
      sameAs: ['https://linkedin.com/company/auspexi', 'https://x.com/auspexi'],
    },
  ],
}

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingPageClient />
    </>
  )
}
