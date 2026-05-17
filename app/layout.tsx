import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { VoiceAgentProvider } from "@/contexts/VoiceAgentContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ScrollToTop } from "@/components/ScrollToTop";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Auspexi | Generative Engine Optimization",
  description: "The enterprise standard for Generative Engine Optimization (GEO). Protecting brand reputation and securing Share of Voice across ChatGPT, Gemini, and Claude through proprietary latent space mapping.",
  openGraph: {
    title: "Auspexi | Generative Engine Optimization",
    description: "Dominate the AI Search Economy. Auspexi protects and amplifies your brand across ChatGPT, Gemini, and Claude.",
    images: ["/auspexi-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auspexi | Generative Engine Optimization",
    description: "Dominate the AI Search Economy. Auspexi protects and amplifies your brand across ChatGPT, Gemini, and Claude.",
    images: ["/auspexi-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${plusJakartaSans.variable} ${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased bg-zinc-950 text-zinc-50`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <VoiceAgentProvider>
              <ScrollToTop />
              {children}
            </VoiceAgentProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
