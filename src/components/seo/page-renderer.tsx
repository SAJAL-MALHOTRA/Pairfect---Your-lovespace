"use client";

import type { SEOPage } from "@/lib/seo/types";
import Link from "next/link";
import { Sparkles, ChevronRight, ArrowRight } from "lucide-react";

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^- (.*?)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-5 space-y-1.5 my-3">${match}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}

export default function SEOPageRenderer({ page }: { page: SEOPage }) {
  const breadcrumbs = page.slug.includes("/")
    ? [
        { label: "Pairfect", href: "/" },
        { label: "Glossary", href: "#" },
        { label: page.h1, href: `/${page.slug}` },
      ]
    : [
        { label: "Pairfect", href: "/" },
        { label: page.h1, href: `/${page.slug}` },
      ];

  return (
    <article className="space-y-8">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[var(--ink-light)]">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            {i < breadcrumbs.length - 1 ? (
              <Link href={crumb.href} className="hover:text-[var(--seal-red)] transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-[var(--ink-mid)]">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono uppercase tracking-widest bg-[var(--seal-red)]/10 text-[var(--seal-red)] border border-[var(--seal-red)]/15">
          <Sparkles className="w-3 h-3" />
          {page.playbook}
        </span>
      </div>

      {/* H1 */}
      <h1 className="font-display italic font-black text-3xl md:text-4xl text-[var(--ink-dark)] leading-tight">
        {page.h1}
      </h1>

      {/* Introduction */}
      <div
        className="text-sm text-[var(--ink-mid)] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(page.introduction)}</p>` }}
      />

      {/* Sections */}
      {page.sections.map((section, i) => (
        <section key={i} className="space-y-3">
          <h2 className="font-display italic font-bold text-xl text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
            {section.heading}
          </h2>
          <div
            className="text-sm text-[var(--ink-mid)] leading-relaxed prose-sm"
            dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(section.body)}</p>` }}
          />
        </section>
      ))}

      {/* FAQs */}
      {page.faqs.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display italic font-bold text-xl text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {page.faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-[var(--border-mid)] overflow-hidden">
                <summary className="cursor-pointer px-5 py-3.5 text-sm font-medium text-[var(--ink-dark)] hover:bg-[var(--bg-secondary)] transition-colors list-none flex items-center justify-between">
                  <span>{faq.question}</span>
                  <ChevronRight className="w-4 h-4 text-[var(--ink-light)] group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-4 text-sm text-[var(--ink-mid)] leading-relaxed border-t border-[var(--border-mid)]">
                  <div
                    className="pt-3"
                    dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(faq.answer)}</p>` }}
                  />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="rounded-2xl p-6 text-center space-y-3" style={{
        background: "linear-gradient(135deg, rgba(232,82,125,0.06) 0%, rgba(255,107,149,0.04) 100%)",
        border: "1px solid rgba(232,82,125,0.12)",
      }}>
        <p className="text-sm text-[var(--ink-mid)] leading-relaxed">{page.callToAction}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest bg-[var(--seal-red)] text-white hover:opacity-90 transition-opacity"
        >
          Try Pairfect <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Internal Links */}
      {page.internalLinks.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display italic font-bold text-lg text-[var(--ink-dark)]">
            Related Reading
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {page.internalLinks.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[var(--border-mid)] text-xs text-[var(--ink-mid)] hover:text-[var(--seal-red)] hover:border-[var(--seal-red)]/30 transition-all group"
              >
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span>{link.anchorText}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": page.schemaType === "DefinedTerm" ? "DefinedTerm" : "Article",
            headline: page.h1,
            description: page.seo.metaDescription,
            url: page.seo.canonicalUrl,
            publisher: {
              "@type": "Organization",
              name: "Pairfect",
              url: "https://www.pairfect.site",
            },
            ...(page.faqs.length > 0
              ? {
                  mainEntity: page.faqs.map((faq) => ({
                    "@type": "Question",
                    name: faq.question,
                    acceptedAnswer: {
                      "@type": "Answer",
                      text: faq.answer,
                    },
                  })),
                }
              : {}),
          }),
        }}
      />
    </article>
  );
}
