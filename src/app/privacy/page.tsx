import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, EyeOff, Heart, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Pairfect",
  description: "Pairfect Privacy Policy. A transparent, privacy-first commitment to how we protect your couple space and personal memories.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] transition-colors duration-300 paper-grain py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Back Link & Brand Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-mid)] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--ink-mid)] hover:text-[var(--ink-dark)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center space-x-2">
            <span className="font-display italic text-xl font-black text-[var(--ink-dark)]">
              pairfect
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--seal-red)]" />
          </div>
        </div>

        {/* Hero Title Card */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-8 sm:p-12 rounded-3xl space-y-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--rose)] via-[var(--seal-red)] to-[var(--burgundy)]" />
          
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--seal-red)]/10 text-[var(--seal-red)] font-mono text-[9px] font-bold uppercase tracking-widest">
              <Shield className="w-3.5 h-3.5" /> PRIVACY FIRST COMMITMENT
            </span>
            <h1 className="text-3xl sm:text-4xl font-display italic font-black text-[var(--ink-dark)] tracking-tight">
              Pairfect Privacy Policy
            </h1>
            <p className="font-quote italic text-base text-[var(--ink-mid)]">
              "Pairfect exists to give couples a quiet, private place to preserve their memories. Your relationship is personal, and we believe your data should be treated the exact same way."
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-mid)] text-xs font-mono text-[var(--ink-mid)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No Advertising</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No Data Selling</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>No Public Feeds</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>AES-256 Encryption</span>
            </div>
          </div>
        </div>

        {/* Main Document Body */}
        <div className="bg-[var(--card-bg)] border border-[var(--border-mid)] p-8 sm:p-12 rounded-3xl space-y-10 text-[var(--ink-dark)] leading-relaxed font-sans shadow-sm">
          
          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              Our Privacy Philosophy
            </h2>
            <p className="text-sm text-[var(--ink-mid)] leading-relaxed">
              Pairfect is a dedicated private web platform designed exclusively for two partners. Pairfect is <strong>not a social media network</strong>. We do not have public profiles, follower counts, likes, public comment sections, or discovery feeds. Everything you create, write, or record inside Pairfect is built to be accessible only by you and your invited partner.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              1. Information We Collect
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              We collect only the information necessary to provide you and your partner with a seamless, private companion experience:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-[var(--ink-mid)] font-sans pl-2">
              <li><strong>Account Information:</strong> Your email address, encrypted password hash (managed by Supabase Auth), and display name.</li>
              <li><strong>Couple Space &amp; Pair Association:</strong> Unique pair IDs and invite codes that link you strictly to your partner.</li>
              <li><strong>Content You Create:</strong> Love letters, gratitude notes, daily mood check-ins, scrapbook memories, photobooth keepsakes, and dispute arguments. Sensitive content like Love Letters, Gratitude Notes, and Dispute Arguments are encrypted with AES-256-CBC before storage.</li>
              <li><strong>Technical &amp; Device Information:</strong> Standard browser type, IP address, operating system, and log metadata required for system stability and security.</li>
            </ul>
          </section>

          {/* 2. Why We Collect It */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              2. Why We Collect It
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              We use your information exclusively for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-[var(--ink-mid)] pl-2">
              <li>Authenticating your identity and preventing unauthorized access to your pair room.</li>
              <li>Displaying your shared memories, mood streaks, and love letters to your partner.</li>
              <li>Delivering synchronized features (such as Watch Together YouTube rooms or co-op riddle guessing).</li>
              <li>Sending partner notifications when your partner leaves a letter, gratitude note, or check-in.</li>
              <li>Ensuring platform integrity, security, and bug fixes.</li>
            </ul>
          </section>

          {/* 3. How Data Is Stored */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              3. How Data Is Stored
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              Your data is stored in production database infrastructure powered by <strong>Supabase (PostgreSQL)</strong> and <strong>Supabase Storage</strong>. Data is partitioned strictly by pair identifiers.
            </p>
          </section>

          {/* 4. Authentication */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              4. Authentication &amp; Pair Isolation
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              Authentication is handled through Supabase Authentication. Passwords are never stored in plain text; they are hashed using industry-standard bcrypt hashing. Pair spaces are isolated so that exactly two authenticated partners share a pair room.
            </p>
          </section>

          {/* 5. Security Measures */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              5. Security Measures &amp; Encryption
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              We enforce multi-layered security protections:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-[var(--ink-mid)] pl-2">
              <li><strong>Encryption in Transit:</strong> All HTTP traffic between your browser and our servers is encrypted using modern TLS 1.3 / HTTPS.</li>
              <li><strong>Encryption at Rest:</strong> Sensitive content (including Love Letters, Gratitude Jar notes, and Vibe Dispute arguments) is encrypted on the server using <strong>AES-256-CBC encryption</strong> before being written to PostgreSQL.</li>
              <li><strong>Row Level Security (RLS):</strong> Database tables enforce Row Level Security policies, restricting read/write access strictly to authenticated pair members.</li>
              <li><strong>Private Storage Buckets:</strong> Shared memory files are stored in access-restricted storage buckets.</li>
            </ul>
          </section>

          {/* 6. Who Can Access User Data */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              6. Who Can Access User Data
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              Your memories, letters, and mood logs are visible <strong>only to you and your invited partner</strong>. 
            </p>
            <p className="text-xs font-mono text-[var(--seal-red)] bg-[var(--paper-warm)] p-3.5 rounded-xl border border-[var(--border-warm)]">
              We do not sell your personal data. We do not share your private letters or photos with third-party advertisers or data brokers under any circumstances.
            </p>
          </section>

          {/* 7. Third-Party Services */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              7. Third-Party Services
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              To provide specific app features, we integrate with trusted third-party service providers:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-[var(--ink-mid)] pl-2">
              <li><strong>Supabase:</strong> For authentication, PostgreSQL database, storage, and Realtime WebSocket subscriptions.</li>
              <li><strong>YouTube iFrame API:</strong> Powers the Watch Together synchronized player feature. YouTube's terms and privacy policies apply when interacting with embedded video streams.</li>
              <li><strong>Groq AI:</strong> Powers the playful AI Vibe Judge arbitration feature. Dispute arguments are sent securely to generate verdicts.</li>
              <li><strong>GIPHY API:</strong> Powers sticker searching inside the webcam photobooth.</li>
            </ul>
          </section>

          {/* 8. Cookies */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              8. Cookies &amp; Local Storage
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              Pairfect uses strictly necessary cookies and browser local storage solely to maintain your login session, active theme preference (dark/light), and push notification banner choices. We do <strong>not</strong> use advertising cookies or cross-site tracking scripts.
            </p>
          </section>

          {/* 9. User Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              9. Your Rights &amp; Data Control
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              You maintain full ownership of your memories and relationship data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-[var(--ink-mid)] pl-2">
              <li><strong>Right of Access &amp; Correction:</strong> You can view and update your profile details at any time from your settings panel.</li>
              <li><strong>Right to Unlink &amp; Reset:</strong> You can unlink your pair space or leave a pair room directly in Settings.</li>
              <li><strong>Right of Deletion:</strong> You may request full deletion of your account and associated private data by contacting us.</li>
            </ul>
          </section>

          {/* 10. Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              10. Children's Privacy
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              Pairfect is intended for individuals aged <strong>13 and older</strong> (or the applicable legal age of digital consent in your jurisdiction). We do not knowingly collect or solicit personal information from children under 13.
            </p>
          </section>

          {/* 11. International Users */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              11. International Users
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              If you access Pairfect from outside the United States, please be aware that your information may be transferred to and processed in secure cloud infrastructure servers located in the United States and global edge nodes.
            </p>
          </section>

          {/* 12. Changes to This Privacy Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              12. Changes to This Privacy Policy
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              We may update this Privacy Policy periodically to reflect improvements in our security infrastructure or legal requirements. When updates occur, we will refresh the "Last Updated" date at the bottom of this page.
            </p>
          </section>

          {/* 13. Contact Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-heading font-bold italic text-[var(--ink-dark)] border-b border-[var(--border-mid)] pb-2">
              13. How to Contact Us
            </h2>
            <p className="text-sm text-[var(--ink-mid)]">
              If you have any questions, privacy concerns, or requests regarding your personal data, please contact our privacy team:
            </p>
            <div className="p-4 rounded-2xl bg-[var(--paper-warm)] border border-[var(--border-warm)] font-mono text-xs text-[var(--ink-dark)] space-y-1">
              <p><strong>Email:</strong> pairfect.site@yahoo.com</p>
              <p><strong>Subject:</strong> Privacy Inquiry</p>
            </div>
          </section>

          {/* Footer Metadata */}
          <div className="pt-8 border-t border-[var(--border-mid)] text-xs font-mono text-[var(--ink-mid)] flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <p><strong>Effective Date:</strong> July 23, 2026</p>
              <p><strong>Last Updated:</strong> July 23, 2026</p>
            </div>
            <div className="sm:text-right">
              <p>Copyright &copy; 2026 Pairfect. All rights reserved.</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
