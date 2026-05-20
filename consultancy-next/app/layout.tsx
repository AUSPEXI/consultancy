import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Auspexi | Generative Engine Optimization (GEO)',
  description: 'Auspexi helps your brand dominate AI search. Optimize your content to be cited by ChatGPT, Gemini, and Claude.',
  keywords: 'GEO, Generative Engine Optimization, AI Search, LLM Optimization',
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
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Auspexi',
              applicationCategory: 'BusinessApplication',
              description: 'Generative Engine Optimization (GEO) platform',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body className="bg-zinc-950 text-zinc-50 font-sans">
        {children}
      </body>
    </html>
  )
}
