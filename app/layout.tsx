import type { Metadata } from "next";
import "./globals.css";
// import { AuthProvider } from "@/contexts/AuthContext";
// import { VoiceAgentProvider } from "@/contexts/VoiceAgentContext";

export const metadata: Metadata = {
  title: "Auspexi | GEO Analytics",
  description: "Charting the 768-D Latent Space for brand reputation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased dark">
        {/* <AuthProvider>
          <VoiceAgentProvider> */}
            {children}
          {/* </VoiceAgentProvider>
        </AuthProvider> */}
      </body>
    </html>
  );
}
