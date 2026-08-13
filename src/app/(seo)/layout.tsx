import type { Metadata } from "next";
import Navigation from "@/components/navigation";

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};

export default function SEOLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Navigation />
      <main className="max-w-3xl mx-auto px-5 py-12 pb-32 md:pb-16">
        {children}
      </main>
    </div>
  );
}
