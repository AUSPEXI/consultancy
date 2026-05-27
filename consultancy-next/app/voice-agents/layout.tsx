import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Citacious Voice AI | Real-Time GEO Strategy Assistant | Auspexi',
  description: 'Meet Citacious — your real-time AI voice assistant powered by Gemini Live. Get instant answers on brand AI visibility, GEO strategy, and live metrics with sub-500ms response times.',
  metadataBase: new URL('https://auspexi.com'),
  alternates: { canonical: 'https://auspexi.com/voice-agents' },
  openGraph: {
    title: 'Citacious Voice AI | Real-Time GEO Strategy Assistant | Auspexi',
    description: 'Real-time AI voice assistant for GEO strategy, powered by Gemini Live. Ask anything about brand AI visibility and get instant answers.',
    url: 'https://auspexi.com/voice-agents',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'Citacious Voice AI — Auspexi' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Citacious Voice AI | Real-Time GEO Strategy Assistant | Auspexi',
    description: 'Real-time AI voice assistant for GEO strategy, powered by Gemini Live.',
    images: ['/geo-infographic.png'],
  },
};

export default function VoiceAgentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
