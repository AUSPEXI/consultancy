import type { Metadata } from 'next'
import { LandingPageClient } from './components/LandingPageClient'

export const metadata: Metadata = {
  title: 'L8EntSpace | Generative Engine Optimization (GEO)',
  description: "L8EntSpace is the leading Generative Engine Optimization (GEO) platform. Track your brand's AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity.",
  keywords: 'generative engine optimization, GEO, AI search optimization, LLM SEO, brand visibility AI, AI share of voice, ChatGPT SEO',
  robots: { index: true, follow: true },
  metadataBase: new URL('https://l8entspace.com'),
  openGraph: {
    title: 'L8EntSpace | Generative Engine Optimization (GEO)',
    description: 'Ensure your brand is cited by ChatGPT, Gemini, Claude and Perplexity. Track AI Share of Voice, inject cite-magnet facts, detect sentiment drift.',
    url: 'https://l8entspace.com',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'L8EntSpace GEO Dashboard' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'L8EntSpace | Generative Engine Optimization (GEO)',
    description: 'The premier GEO platform. Track your brand across ChatGPT, Gemini, Claude and Perplexity.',
    images: ['/geo-infographic.png'],
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://l8entspace.com/#app',
      name: 'L8EntSpace',
      applicationCategory: 'BusinessApplication',
      description: 'Generative Engine Optimization (GEO) platform tracking brand AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity.',
      url: 'https://l8entspace.com',
      image: 'https://l8entspace.com/geo-infographic.png',
      offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: '0', highPrice: '1899', offerCount: 4 },
    },
    {
      '@type': 'Organization',
      '@id': 'https://l8entspace.com/#org',
      name: 'L8EntSpace',
      url: 'https://l8entspace.com',
      logo: 'https://l8entspace.com/l8entspace-icon.png',
      description: 'The leading Generative Engine Optimization platform. Track and grow your brand\'s AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity.',
      sameAs: ['https://linkedin.com/company/l8entspace', 'https://x.com/l8entspace'],
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
