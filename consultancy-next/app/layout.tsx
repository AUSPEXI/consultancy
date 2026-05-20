import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'Auspexi | Generative Engine Optimization (GEO)',
  description: 'Auspexi helps your brand dominate AI search. Optimize your content to be cited by ChatGPT, Gemini, and Claude.',
  keywords: 'GEO, Generative Engine Optimization, AI Search, LLM Optimization, Auspexi',
  metadataBase: new URL('https://auspexi.com'),
  openGraph: {
    type: 'website',
    url: 'https://auspexi.com',
    title: 'Auspexi | Generative Engine Optimization',
    description: 'Ensure your brand is the definitive answer when users ask AI.',
    images: [
      {
        url: 'https://auspexi.com/geo-infographic.png',
        width: 1200,
        height: 630,
        alt: 'Generative Engine Optimization Strategy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auspexi | Generative Engine Optimization',
    description: 'Ensure your brand is the definitive answer when users ask AI.',
    images: ['https://auspexi.com/geo-infographic.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Auspexi',
              applicationCategory: 'BusinessApplication',
              description:
                'Generative Engine Optimization (GEO) platform to ensure brands are cited as the primary source of truth by AI models.',
              url: 'https://auspexi.com',
              image: 'https://auspexi.com/geo-infographic.png',
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: 'USD',
                lowPrice: '149',
                highPrice: '4999',
              },
            }),
          }}
        />
      </head>
      <body className="bg-zinc-950 text-zinc-50 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
