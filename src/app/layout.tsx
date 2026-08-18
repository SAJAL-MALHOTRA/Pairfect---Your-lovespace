import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, Playfair_Display, EB_Garamond, Caveat } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import AmbientHearts from "@/components/ambient-hearts";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"]
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700", "900"],
  style: ["normal", "italic"]
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-quote",
  weight: ["400", "700"],
  style: ["normal", "italic"]
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-handwriting",
  weight: ["400", "700"]
});

export const metadata: Metadata = {
  title: "Pairfect — Private Relationship Sanctuary",
  description: "A private digital sanctuary & living archive for two.",
  icons: {
    icon: [
      { url: "/logo-book.png", type: "image/png" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: ["/logo-book.png"],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${playfair.variable} ${ebGaramond.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider>
          <AmbientHearts />
          <AuthProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
