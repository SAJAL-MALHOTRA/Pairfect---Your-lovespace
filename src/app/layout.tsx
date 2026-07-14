import type { Metadata } from "next";
import { Outfit, Nunito } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const nunito = Nunito({ 
  subsets: ["latin"], 
  variable: "--font-nunito", 
  display: "swap" 
});

export const metadata: Metadata = {
  title: "Pairfect — Private Relationship Companion",
  description: "A private, bold space to share check-ins, moods, and scrapbook memories with your partner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
