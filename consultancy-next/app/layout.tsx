import type { Metadata } from 'next'
import Script from 'next/script'
import { AuthProvider } from '@/contexts/AuthContext'
import { NavigationProgress } from '@/components/ui/NavigationProgress'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { buildOrganizationSchema } from '@/lib/site-schema'
import './globals.css'

export const metadata: Metadata = {
  title: 'Auspexi | Generative Engine Optimization (GEO)',
  description:
    "Auspexi is the leading Generative Engine Optimization (GEO) platform. Track your brand's AI Share of Voice across ChatGPT, Gemini, Claude and Perplexity.",
  keywords:
    'generative engine optimization, GEO, AI search optimization, LLM SEO, brand visibility AI, AI share of voice, ChatGPT SEO',
  metadataBase: new URL('https://auspexi.com'),
  openGraph: {
    type: 'website',
    url: 'https://auspexi.com',
    title: 'Auspexi | Generative Engine Optimization (GEO)',
    description:
      'Ensure your brand is cited by ChatGPT, Gemini, Claude and Perplexity. Track AI Share of Voice, inject cite-magnet facts, detect sentiment drift.',
    images: [
      {
        url: '/geo-infographic.png',
        width: 1200,
        height: 630,
        alt: 'Auspexi Generative Engine Optimization Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Auspexi | Generative Engine Optimization (GEO)',
    description:
      'The premier GEO platform. Track your brand across ChatGPT, Gemini, Claude and Perplexity.',
    images: ['/geo-infographic.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

async function SiteSchemas() {
  // Organization only site-wide — safe for all pages, no policy concerns.
  // FAQPage is intentionally scoped to /faq only (see app/faq/page.tsx).
  // Experiment 021 in geo-lab will measure whether site-wide FAQPage improves
  // AI citation enough to justify the GSC structured-data policy risk.
  const orgSchema = {
    '@context': 'https://schema.org',
    '@graph': [buildOrganizationSchema()],
  };

  // Any user-saved schemas from the registry (best-effort; non-blocking).
  let registrySchemas: any[] = [];
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://auspexi.com';
    const res = await fetch(`${base}/api/schema-registry?domain=auspexi.com`, { next: { revalidate: 300 } });
    if (res.ok) {
      const { schemas } = await res.json();
      if (Array.isArray(schemas)) registrySchemas = schemas;
    }
  } catch {
    // registry is optional — org schema above always ships
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      {registrySchemas.map((schema: any, i: number) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="bg-zinc-950" style={{ backgroundColor: '#09090b' }}>
      <head>
        {/* Spline CDN preconnect — eliminates cold-connect delay for the robot */}
        <link rel="preconnect" href="https://prod.spline.design" crossOrigin="" />
        <link rel="dns-prefetch" href="https://prod.spline.design" />
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="" />
        {/* @ts-expect-error async server component */}
        <SiteSchemas />
      </head>
      <body className="antialiased bg-[#050505] text-white">
        <NavigationProgress />
        <AuthProvider>{children}</AuthProvider>
        <CookieConsent />
        {/* GA4 */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-W1C3XBTET3" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-W1C3XBTET3');
        `}</Script>
      </body>
    </html>
  )
}
