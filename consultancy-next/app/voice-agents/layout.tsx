import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aura Voice AI | Real-Time GEO Brand Guide | L8EntSpace',
  description: 'Meet Aura — L8EntSpace\'s real-time AI voice brand guide, powered by Gemini Live. Ask anything about GEO, pricing, or L8EntSpace features and get instant intelligent answers.',
  metadataBase: new URL('https://l8entspace.com'),
  alternates: { canonical: 'https://l8entspace.com/voice-agents' },
  openGraph: {
    title: 'Citacious Voice AI | Real-Time GEO Strategy Assistant | L8EntSpace',
    description: 'Real-time AI voice assistant for GEO strategy, powered by Gemini Live. Ask anything about brand AI visibility and get instant answers.',
    url: 'https://l8entspace.com/voice-agents',
    type: 'website',
    images: [{ url: '/geo-infographic.png', width: 1200, height: 630, alt: 'Citacious Voice AI — L8EntSpace' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Citacious Voice AI | Real-Time GEO Strategy Assistant | L8EntSpace',
    description: 'Real-time AI voice assistant for GEO strategy, powered by Gemini Live.',
    images: ['/geo-infographic.png'],
  },
};

export default function VoiceAgentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
