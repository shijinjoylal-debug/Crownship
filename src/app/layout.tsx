import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Crownship | Premium Trading Tools",
  description: "Advanced tools for the modern trader.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="urgency-banner">
            ⚡ FLASH RUN: 40% OFF ALL TOOLS. ENDS IN 04:15:30.
          </div>
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 120px)', paddingTop: '120px' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
