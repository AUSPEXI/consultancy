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
      offers: { '@type': 'AggregateOffer', priceCurrency: 'USD', lowPrice: '149', highPrice: '4999' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is Generative Engine Optimization (GEO)?', acceptedAnswer: { '@type': 'Answer', text: "GEO is the practice of optimizing your brand's content so AI models cite your brand as the authoritative source." } },
        { '@type': 'Question', name: 'How is GEO different from traditional SEO?', acceptedAnswer: { '@type': 'Answer', text: 'SEO targets ranked blue links. GEO targets zero-click AI answers from ChatGPT, Gemini, Claude and Perplexity.' } },
        { '@type': 'Question', name: 'What is AI Share of Voice?', acceptedAnswer: { '@type': 'Answer', text: 'A-SOV measures how often AI models mention your brand versus competitors across industry queries.' } },
      ],
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
