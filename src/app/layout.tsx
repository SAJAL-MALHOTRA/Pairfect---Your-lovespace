import type { Metadata } from "next";
import { Outfit, Fraunces, Nunito } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fraunces = Fraunces({ 
  subsets: ["latin"], 
  variable: "--font-fraunces", 
  display: "swap" 
});

const nunito = Nunito({ 
  subsets: ["latin"], 
  variable: "--font-nunito", 
  display: "swap" 
});

export const metadata: Metadata = {
  title: "Pairfect — Private Relationship Companion",
  description: "A cozy private space to share check-ins, moods, and music trends with your partner.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${fraunces.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
