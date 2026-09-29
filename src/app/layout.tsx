import type { Metadata } from "next";
import { Inter, Playfair_Display, Lora } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import AmbientHearts from "@/components/ambient-hearts";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-handwriting",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
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
      data-theme="light"
      style={{ colorScheme: "light" }}
      className={`${inter.variable} ${playfair.variable} ${lora.variable} h-full antialiased`}
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
