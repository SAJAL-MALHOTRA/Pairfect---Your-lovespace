import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPageBySlug, getAllSlugs } from "@/lib/seo/registry";
import SEOPageRenderer from "@/components/seo/page-renderer";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSlugs().filter((s) => !s.startsWith("glossary/"));
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.seo.title,
    description: page.seo.metaDescription,
    alternates: { canonical: page.seo.canonicalUrl },
    openGraph: {
      title: page.seo.ogTitle,
      description: page.seo.ogDescription,
      url: page.seo.canonicalUrl,
      siteName: "Pairfect",
      type: "article",
    },
    robots: page.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function SEOPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();

  return <SEOPageRenderer page={page} />;
}
