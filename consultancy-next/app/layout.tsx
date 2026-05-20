import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Auspexi',
  description: 'Generative Engine Optimization (GEO) Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-50 font-sans">{children}</body>
    </html>
  )
}
