import type { Metadata } from "next";
import { Outfit, Lora, Silkscreen, Caveat } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import AmbientHearts from "@/components/ambient-hearts";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-handwriting",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pixel",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pairfect - Private Relationship Sanctuary",
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
      data-theme="light"
      style={{ colorScheme: "light" }}
      className={`${outfit.variable} ${silkscreen.variable} ${lora.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider>
          <AmbientHearts />
          <AuthProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-NPQ65ZKZ0T" />
      </body>
    </html>
  );
}
