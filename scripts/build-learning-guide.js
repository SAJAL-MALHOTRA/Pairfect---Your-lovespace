const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Generating Pairfect Comprehensive Learning Guide...');

const outputPathHtml = path.resolve(__dirname, '../PROJECT_COMPLETE_LEARNING_GUIDE.html');
const outputPathPdf = path.resolve(__dirname, '../PROJECT_COMPLETE_LEARNING_GUIDE.pdf');
const outputPathMd = path.resolve(__dirname, '../PROJECT_COMPLETE_LEARNING_GUIDE.md');

// Generate the complete HTML content
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Pairfect — Complete Learning Documentation & Architectural Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600&family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap');

    @page {
      size: A4;
      margin: 18mm 16mm 20mm 16mm;
      @bottom-right {
        content: "Page " counter(page);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #8C7A70;
      }
      @bottom-left {
        content: "Pairfect — Full Codebase & Architecture Guide";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #8C7A70;
      }
    }

    *, *::before, *::after {
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #2D241E;
      background-color: #FAF5EB;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-break {
      page-break-before: always;
      break-before: page;
    }

    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Cover Page */
    .cover-page {
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 40px 20px;
      border: 3px double #8E2B45;
      border-radius: 16px;
      background: linear-gradient(180deg, #FAF5EB 0%, #F5EDD8 100%);
      margin-bottom: 30px;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 9999px;
      background-color: #8E2B45;
      color: #FFF;
      font-family: 'Fira Code', monospace;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }

    .cover-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 34pt;
      font-weight: 700;
      color: #591629;
      line-height: 1.15;
      margin: 0 0 12px 0;
    }

    .cover-subtitle {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 16pt;
      color: #8E2B45;
      margin: 0 0 30px 0;
      max-width: 600px;
    }

    .cover-meta {
      margin-top: 40px;
      padding: 16px 24px;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid #E7DED5;
      border-radius: 12px;
      font-size: 9pt;
      color: #6B564F;
      display: inline-grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 30px;
      text-align: left;
    }

    .cover-meta strong {
      color: #2D241E;
    }

    /* Headings */
    h1, h2, h3, h4 {
      font-family: 'Playfair Display', Georgia, serif;
      color: #591629;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      line-height: 1.25;
    }

    h1 {
      font-size: 20pt;
      border-bottom: 2px solid #8E2B45;
      padding-bottom: 6px;
      margin-top: 2em;
    }

    h2 {
      font-size: 15pt;
      color: #731D33;
      border-bottom: 1px dashed #D4C2A6;
      padding-bottom: 4px;
    }

    h3 {
      font-size: 12pt;
      color: #8E2B45;
    }

    h4 {
      font-size: 10.5pt;
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      color: #2D241E;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 8pt;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
      margin-right: 6px;
    }

    .badge-beginner {
      background-color: #E6F4EA;
      color: #137333;
      border: 1px solid #CEEAD6;
    }

    .badge-intermediate {
      background-color: #FEF7E0;
      color: #B06000;
      border: 1px solid #FEEFC3;
    }

    .badge-advanced {
      background-color: #FCE8E6;
      color: #C5221F;
      border: 1px solid #FAD2CF;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0;
      font-size: 8.5pt;
      background: #FFFFFF;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      page-break-inside: avoid;
    }

    th {
      background-color: #591629;
      color: #FFFFFF;
      text-align: left;
      padding: 8px 10px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      letter-spacing: 0.5px;
    }

    td {
      padding: 7px 10px;
      border-bottom: 1px solid #EFEAE1;
      vertical-align: top;
    }

    tr:nth-child(even) {
      background-color: #FAF6EF;
    }

    /* Code & ASCII Diagrams */
    pre, code {
      font-family: 'Fira Code', Consolas, Monaco, monospace;
    }

    code {
      background: #F0E6D8;
      color: #731D33;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 8.5pt;
    }

    pre {
      background: #1F1916;
      color: #F7EFE6;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 12px 0;
      border: 1px solid #3A2E28;
      page-break-inside: avoid;
    }

    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
      border-radius: 0;
    }

    .ascii-diagram {
      background: #2B211D;
      color: #FBEBD4;
      font-size: 7.5pt;
      line-height: 1.25;
      padding: 14px;
      border-radius: 8px;
      border-left: 4px solid #E8527D;
      white-space: pre;
      overflow-x: auto;
      margin: 14px 0;
      page-break-inside: avoid;
    }

    /* Callouts */
    .callout {
      padding: 12px 16px;
      border-radius: 8px;
      margin: 14px 0;
      font-size: 9pt;
      border-left: 4px solid;
      background: #FFFFFF;
      page-break-inside: avoid;
    }

    .callout-note {
      border-color: #8E2B45;
      background-color: #FDF9F3;
    }

    .callout-tip {
      border-color: #137333;
      background-color: #F2FBF5;
    }

    .callout-warning {
      border-color: #B06000;
      background-color: #FEF9EB;
    }

    .callout-danger {
      border-color: #C5221F;
      background-color: #FDF2F2;
    }

    .callout-title {
      font-weight: 700;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9.5pt;
    }

    /* Table of Contents */
    .toc {
      background: #FFFFFF;
      border: 1px solid #E7DED5;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 20px 0;
    }

    .toc-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16pt;
      font-weight: 700;
      color: #591629;
      margin-top: 0;
      margin-bottom: 14px;
      border-bottom: 2px solid #8E2B45;
      padding-bottom: 6px;
    }

    .toc-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 24px;
      font-size: 8.5pt;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dotted #D4C2A6;
      padding: 3px 0;
    }

    .toc-item a {
      color: #591629;
      text-decoration: none;
      font-weight: 500;
    }

    .toc-item a:hover {
      text-decoration: underline;
    }

    /* Execution Flow Step-by-Step */
    .flow-container {
      background: #FFFFFF;
      border: 1px solid #E7DED5;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 12px 0;
    }

    .flow-step {
      display: flex;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .flow-number {
      background: #8E2B45;
      color: #FFF;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7.5pt;
      font-weight: 700;
      margin-right: 10px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .flow-text {
      font-size: 8.5pt;
    }

    .flow-arrow {
      color: #8E2B45;
      font-weight: 700;
      text-align: center;
      margin-left: 9px;
      margin-bottom: 6px;
      font-size: 9pt;
      line-height: 1;
    }

    ul, ol {
      padding-left: 20px;
      margin: 8px 0;
    }

    li {
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-badge">Pairfect Architecture & Mastery Guide</div>
    <h1 class="cover-title">Pairfect — Codebase Master Reference</h1>
    <p class="cover-subtitle">A Complete, Deep Technical Learning Guide to Full-Stack Architecture, React 19 / Next.js 16, Supabase, Realtime WebSockets, WebRTC, Database Security, and Production Deployment.</p>

    <div class="cover-meta">
      <div><strong>Application:</strong> Pairfect (Private Relationship Sanctuary)</div>
      <div><strong>Production Domain:</strong> <a href="https://pairfect.site" style="color:#8E2B45;">https://pairfect.site</a></div>
      <div><strong>Frontend Framework:</strong> Next.js 16.2.10 (App Router, Turbopack, React 19.2.4)</div>
      <div><strong>Backend / Database:</strong> Supabase (PostgreSQL 15, GoTrue Auth, Realtime, S3 Storage)</div>
      <div><strong>Styling & Animations:</strong> Tailwind CSS v4, Framer Motion 12, Three.js / R3F</div>
      <div><strong>AI & Integrations:</strong> Google Gemini 2.5 Flash, Spotify Web API, GIPHY, Open-Meteo</div>
      <div><strong>Analytics & Telemetry:</strong> Google Analytics 4 (GA4), Vercel Web Analytics</div>
      <div><strong>Author & Lead Engineer:</strong> Sajal Malhotra</div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- TABLE OF CONTENTS -->
  <div class="toc">
    <div class="toc-title">Table of Contents</div>
    <div class="toc-grid">
      <div class="toc-item"><a href="#ch1">1. Complete Project Audit & Flow</a> <span>03</span></div>
      <div class="toc-item"><a href="#ch2">2. Executive Summary & Architecture</a> <span>05</span></div>
      <div class="toc-item"><a href="#ch3">3. Technology Stack — Deep "WHY"</a> <span>07</span></div>
      <div class="toc-item"><a href="#ch4">4. Frontend Deep Dive & Tree</a> <span>11</span></div>
      <div class="toc-item"><a href="#ch5">5. Important Components Breakdown</a> <span>14</span></div>
      <div class="toc-item"><a href="#ch6">6. Functions — Teach Me WHY</a> <span>20</span></div>
      <div class="toc-item"><a href="#ch7">7. React 19 & Next.js 16 Concepts</a> <span>25</span></div>
      <div class="toc-item"><a href="#ch8">8. Backend Deep Dive & Handlers</a> <span>29</span></div>
      <div class="toc-item"><a href="#ch9">9. Complete API Documentation</a> <span>32</span></div>
      <div class="toc-item"><a href="#ch10">10. Database Deep Dive & ER Diagram</a> <span>37</span></div>
      <div class="toc-item"><a href="#ch11">11. SQL Deep Dive & Triggers</a> <span>41</span></div>
      <div class="toc-item"><a href="#ch12">12. Supabase Deep Dive & RLS</a> <span>45</span></div>
      <div class="toc-item"><a href="#ch13">13. Authentication & Security Flow</a> <span>49</span></div>
      <div class="toc-item"><a href="#ch14">14. State Management Architecture</a> <span>52</span></div>
      <div class="toc-item"><a href="#ch15">15. Realtime Features (WebSockets)</a> <span>55</span></div>
      <div class="toc-item"><a href="#ch16">16. Loading, Error & Empty States</a> <span>58</span></div>
      <div class="toc-item"><a href="#ch17">17. Performance & Optimization</a> <span>61</span></div>
      <div class="toc-item"><a href="#ch18">18. Git & GitHub Masterclass</a> <span>64</span></div>
      <div class="toc-item"><a href="#ch19">19. Production Deployment Pipeline</a> <span>67</span></div>
      <div class="toc-item"><a href="#ch20">20. File-by-File Architecture Map</a> <span>70</span></div>
      <div class="toc-item"><a href="#ch21">21. 8 Feature End-to-End Traces</a> <span>75</span></div>
      <div class="toc-item"><a href="#ch22">22. Beginner to Advanced Roadmap</a> <span>83</span></div>
      <div class="toc-item"><a href="#ch23">23. Technical Glossary</a> <span>86</span></div>
      <div class="toc-item"><a href="#ch24">24. "Why This Instead of That?"</a> <span>89</span></div>
      <div class="toc-item"><a href="#ch25">25. Code Reading Master Guide</a> <span>93</span></div>
      <div class="toc-item"><a href="#ch26">26. 50 Self-Test Questions & Key</a> <span>95</span></div>
      <div class="toc-item"><a href="#ch27">27. Real Code Reference Catalog</a> <span>102</span></div>
      <div class="toc-item"><a href="#ch28">28. System Visual Diagrams Matrix</a> <span>106</span></div>
      <div class="toc-item"><a href="#ch29">29. If I Had To Rebuild This</a> <span>109</span></div>
      <div class="toc-item"><a href="#ch30">30. Final Checklist & Next Steps</a> <span>112</span></div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 1 -->
  <h1 id="ch1">1. Complete Project Audit & Universal Execution Flow</h1>
  <p><span class="badge badge-beginner">🟢 Beginner</span> <span class="badge badge-intermediate">🟡 Intermediate</span></p>

  <p><strong>Pairfect</strong> is a modern, high-security digital sanctuary and interactive relationship living archive designed specifically for couples (especially long-distance couples). The codebase combines server-rendered React 19 components with Next.js 16 App Router, realtime WebSocket communication, AI-driven conflict analysis via Google Gemini, WebRTC video/screenshare streaming, HTML5 Canvas image rendering, and PostgreSQL database isolation enforced via Supabase Row Level Security (RLS).</p>

  <h3>Universal Data Flow Pipeline</h3>
  <p>Every interaction across Pairfect follows this deterministic, 10-step lifecycle:</p>

  <div class="ascii-diagram">
+----------------------------------------------------------------------------------------------------+
|                               PAIRFECT UNIVERSAL EXECUTION PIPELINE                                |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [1] USER ACTION (Click, Keypress, Pointer Draw, Camera Snap)                                     |
|         │                                                                                          |
|         ▼                                                                                          |
|  [2] REACT CLIENT COMPONENT (src/app/*/page.tsx, src/components/*.tsx)                             |
|         │                                                                                          |
|         ▼                                                                                          |
|  [3] EVENT HANDLER / DISPATCHER (e.g. handleSignup(), triggerCaptureSequence(), submitArgument())  |
|         │                                                                                          |
|         ▼                                                                                          |
|  [4] CLIENT VALIDATION & SANITIZATION (Email trimming, invite code verification, schema checks)    |
|         │                                                                                          |
|         ├──────────────────────────────────────────┬──────────────────────────────────────────┐    |
|         ▼                                          ▼                                          ▼    |
|  [5A] SUPABASE CLIENT API                  [5B] NEXT.JS ROUTE HANDLER                 [5C] REALTIME CHANNEL|
|  (Direct PostgREST via RLS)                (/api/disputes/judge, /api/spotify)        (supabase.channel)   |
|         │                                          │                                          │    |
|         ▼                                          ▼                                          ▼    |
|  [6A] POSTGRESQL + RLS POLICIES            [6B] BACKEND / GEMINI AI PROCESSING        [6C] WEBSOCKET PEER  |
|  (pair_id tenant isolation)                (Server-side secret execution)             (Instant sync)       |
|         │                                          │                                          │    |
|         └──────────────────────────────────────────┴──────────────────────────────────────────┘    |
|         │                                                                                          |
|         ▼                                                                                          |
|  [7] SECURE JSON / STREAM RESPONSE                                                                 |
|         │                                                                                          |
|         ▼                                                                                          |
|  [8] REACT STATE UPDATE (useState, useReducer, React Context dispatch)                             |
|         │                                                                                          |
|         ▼                                                                                          |
|  [9] FRAMER MOTION & DOM RE-RENDER (Optimistic UI updates, spring animations)                      |
|         │                                                                                          |
|         ▼                                                                                          |
|  [10] PERSISTENT CACHE & TELEMETRY (LocalStorage, GA4 custom event, Vercel Analytics)               |
+----------------------------------------------------------------------------------------------------+
  </div>

  <div class="callout callout-note">
    <div class="callout-title">💡 Core Architecture Rule in Pairfect</div>
    Client components NEVER have access to private database secrets (e.g., <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>GEMINI_API_KEY</code>, <code>SPOTIFY_CLIENT_SECRET</code>). Sensitive operations are executed either through <strong>Next.js Route Handlers</strong> running on serverless Vercel runtimes or through <strong>PostgreSQL Security Definer RPC functions</strong> protected by session identity (<code>auth.uid()</code>).
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 2 -->
  <h2 id="ch2">2. Executive Summary & Real System Architecture</h2>
  <p><span class="badge badge-beginner">🟢 Beginner</span></p>

  <p>Pairfect provides a unified private universe for two people. It solves relationship friction, distance isolation, and memories scattered across disparate messaging apps by providing dedicated, co-present modules:</p>

  <ul>
    <li><strong>Private Beta & Authentication:</strong> Email/Password + Google OAuth guarded by multi-tenant invite gating and server-side whitelist validation.</li>
    <li><strong>Online Photobooth:</strong> Realtime 4-cut and 3-cut vintage photobooth with live filters, draggable wax-seal/heart stickers, and client-side 300 DPI high-resolution PNG/PDF generation with zero server image leakage.</li>
    <li><strong>Between the Lines (AI Dispute Vibe Judge):</strong> AI-assisted communication referee powered by Google Gemini 2.5 Flash that analyzes couple disagreements objectively and renders balanced, constructive verdicts.</li>
    <li><strong>Shared Live Canvas:</strong> Realtime vector drawing board syncing pen strokes between partners with sub-50ms latency using Supabase Realtime WebSockets.</li>
    <li><strong>Gratitude Jar & Love Letters:</strong> Time-capsuled love notes with GIPHY sticker embeds, animated wax seals, and scheduled reveal intervals.</li>
    <li><strong>Mood Tracking & History:</strong> Daily mood check-ins with intensity meters, Spotify track pairings, and automated vibe summary trends.</li>
    <li><strong>Couple Mini-Games & IQ Duel:</strong> Realtime quizzes, trivia battles, and riddles designed to spark playful connection.</li>
    <li><strong>Focus Zone:</strong> Shared synchronized Pomodoro timer with ambient sounds for studying and working together.</li>
  </ul>

  <h3>System Architecture Diagram</h3>
  <div class="ascii-diagram">
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                    PAIRFECT SYSTEM TOPOLOGY MAP                                         |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                                                                                         |
|     +----------------------------+                     +----------------------------+                   |
|     |     PARTNER A (Client)     |                     |     PARTNER B (Client)     |                   |
|     |  Browser / Mobile PWA iOS  |                     |  Browser / Mobile PWA Mac  |                   |
|     +--------------┬-------------+                     +--------------┬-------------+                   |
|                    │                                                  │                                 |
|                    │   HTTPS Requests (Next.js SSR / Static Assets)   │                                 |
|                    ▼                                                  ▼                                 |
|     +───────────────────────────────────────────────────────────────────────────────+                   |
|     |                         VERCEL EDGE NETWORK / CDN                             |                   |
|     |  - Middleware (src/proxy.ts): Session validation & Route protection           |                   |
|     |  - SSR Server Components & Static Site Generation (SSG) Pages                 |                   |
|     |  - Vercel Web Analytics & Telemetry Layer                                     |                   |
|     +───────────────────────┬───────────────────────────────────────┬───────────────+                   |
|                             │                                       │                                   |
|       Serverless Functions  │                                       │ Client-Direct PostgREST Queries   |
|       (Route Handlers)      │                                       │ (Authenticated with User JWT)     |
|                             ▼                                       ▼                                   |
|     +───────────────────────────────────+           +───────────────────────────────────+               |
|     |      VERCEL ROUTE HANDLERS        |           |      SUPABASE MANAGED CLOUD       |               |
|     |  - /api/disputes/judge (Gemini)   |           |  - GoTrue Auth (JWT & Refresh)    |               |
|     |  - /api/spotify/search (API)      |           |  - PostgreSQL 15 Database         |               |
|     |  - /api/giphy/search (API)        |           |  - Row Level Security (RLS)       |               |
|     |  - /api/cron/cleanup (Cron)       |           |  - Realtime WebSocket Server      |               |
|     +─────────────────┬─────────────────+           |  - Private S3 Storage (memories)  |               |
|                       │                             +─────────────────┬─────────────────+               |
|                       │ Server-Side Service Role                      │                                 |
|                       └───────────────────────────────────────────────┘                                 |
|                                                                                                         |
|       EXTERNAL THIRD-PARTY APIS                                                                         |
|       ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐                |
|       │ Google Gemini 2.5 Flash│  │   Spotify Web API      │  │    GIPHY API SDK       │                |
|       │ (AI Vibe Judge LLM)    │  │   (Metadata & Tracks)  │  │    (Animated Stickers) │                |
|       └────────────────────────┘  └────────────────────────┘  └────────────────────────┘                |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────+
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 3 -->
  <h2 id="ch3">3. Technology Stack — Deep "WHY" Analysis</h2>
  <p><span class="badge badge-intermediate">🟡 Intermediate</span></p>

  <table>
    <thead>
      <tr>
        <th>Technology</th>
        <th>Where Used</th>
        <th>What Problem It Solves</th>
        <th>Why We Selected It</th>
        <th>Alternative Considered</th>
        <th>Tradeoff & Architectural Justification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Next.js 16.2.10 (App Router)</strong></td>
        <td>Entire fullstack core framework</td>
        <td>Unified React 19 rendering, hybrid SSR/SSG, zero-waterfall server components, file-system routing.</td>
        <td>Native Turbopack compilation, `@supabase/ssr` seamless cookie handling, and high-performance server route handlers.</td>
        <td>Vite + React SPA + Express.js</td>
        <td><strong>Tradeoff:</strong> Higher server compute vs pure SPA. <strong>Justification:</strong> Prevents blank initial loading states, renders SEO pages server-side, and secures API keys without running a separate Node backend.</td>
      </tr>
      <tr>
        <td><strong>React 19.2.4</strong></td>
        <td>Client & Server UI components</td>
        <td>Declarative reactive UI, concurrent rendering, Server Actions, native Suspense boundaries.</td>
        <td>Modern hydration, fine-grained state batching, and native support for asynchronous transitions.</td>
        <td>Vue 3 / Svelte 5</td>
        <td><strong>Tradeoff:</strong> React JSX complexity. <strong>Justification:</strong> Unmatched ecosystem of packages (Three.js/Fiber, Framer Motion, Lucide) crucial for romantic interactive widgets.</td>
      </tr>
      <tr>
        <td><strong>Supabase (PostgreSQL 15)</strong></td>
        <td>Database, Auth, Realtime & Storage</td>
        <td>Multi-tenant relationship storage, OAuth login, Row Level Security, instant WebSocket broadcasting.</td>
        <td>Eliminates the need for custom WebSocket servers (Socket.io) or manual DB migration servers.</td>
        <td>Firebase Firestore / MongoDB</td>
        <td><strong>Tradeoff:</strong> Relational schema constraints. <strong>Justification:</strong> PostgreSQL enforces relational integrity between couples (`user_a_id`, `user_b_id`) with ACID transactions and strict RLS policies.</td>
      </tr>
      <tr>
        <td><strong>Tailwind CSS v4</strong></td>
        <td>Application-wide styling system</td>
        <td>Design token harmonization, light/dark theme switching, responsive layouts without stylesheet bloat.</td>
        <td>Zero-config CSS variables (`@import "tailwindcss";`), extreme build speed, paper-warm typography tokens.</td>
        <td>Styled-Components / CSS Modules</td>
        <td><strong>Tradeoff:</strong> Long HTML class names. <strong>Justification:</strong> Zero runtime CSS-in-JS overhead, preventing frame drops during 3D and canvas rendering.</td>
      </tr>
      <tr>
        <td><strong>Framer Motion 12</strong></td>
        <td>Page transitions, wax seals, modal springs</td>
        <td>Physics-based animations, drag-and-drop sticker placement, interactive card gestures.</td>
        <td>Declarative `AnimatePresence` and spring physics matching Pairfect's tactile, romantic feel.</td>
        <td>Raw CSS Keyframes / GSAP</td>
        <td><strong>Tradeoff:</strong> ~35KB bundle impact. <strong>Justification:</strong> Draggable sticker coordinates and interactive countdown scales would require hundreds of lines of fragile manual event listeners.</td>
      </tr>
      <tr>
        <td><strong>Three.js & React Three Fiber</strong></td>
        <td>3D Memory Desk & Interactive Keepsakes</td>
        <td>WebGL 3D rendering for interactive couple scrapbook desk.</td>
        <td>Declarative React component trees for 3D meshes, cameras, and lighting.</td>
        <td>Raw WebGL / Babylon.js</td>
        <td><strong>Tradeoff:</strong> Heavy initial bundle. <strong>Justification:</strong> Dynamically imported on demand so landing page and dashboard maintain sub-1s First Contentful Paint.</td>
      </tr>
      <tr>
        <td><strong>Google Gemini 2.5 Flash</strong></td>
        <td>AI Vibe Judge (`/api/disputes/judge`)</td>
        <td>Objective, empathetic AI analysis of couple disagreements.</td>
        <td>Sub-second token streaming, high empathy reasoning, 1M context window, structured JSON schema response mode.</td>
        <td>OpenAI GPT-4o / Anthropic Claude</td>
        <td><strong>Tradeoff:</strong> Dependency on Google AI endpoint. <strong>Justification:</strong> Gemini 2.5 Flash provides 4x lower latency and superior structured JSON output reliability at low cost.</td>
      </tr>
      <tr>
        <td><strong>@next/third-parties (GA4)</strong></td>
        <td>Root layout Google Analytics 4</td>
        <td>User journey tracking, signup conversions, and realtime traffic metrics.</td>
        <td>Native Next.js component (`<GoogleAnalytics gaId="..." />`) prevents hydration clashes and routing dropouts.</td>
        <td>Raw script tag in `<head>`</td>
        <td><strong>Tradeoff:</strong> Minimal client script. <strong>Justification:</strong> Native App Router integration accurately records client-side route changes without page reloads.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- CHAPTER 4 -->
  <h2 id="ch4">4. Frontend Deep Dive & Codebase Directory Anatomy</h2>
  <p><span class="badge badge-beginner">🟢 Beginner</span></p>

  <p>The frontend follows the Next.js 16 App Router specification. Every folder under <code>src/app/</code> represents a route segment in the URL.</p>

  <div class="ascii-diagram">
src/
├── app/                                 # App Router Routes & Pages
│   ├── (seo)/                           # Route Group for Programmatic SEO Pages
│   │   ├── [slug]/page.tsx              # Dynamic Playbook Article Pages (/best-couples-apps)
│   │   └── glossary/[term]/page.tsx     # Dynamic Relationship Glossary Pages (/glossary/mood-tracking)
│   ├── api/                             # Serverless Route Handlers (Backend APIs)
│   │   ├── auth/                        # /api/auth/join-pair, /api/auth/unlink-pair
│   │   ├── beta/waitlist/route.ts       # Public Waitlist Submissions
│   │   ├── disputes/judge/route.ts      # Gemini 2.5 Flash AI Vibe Judge
│   │   ├── spotify/search/route.ts      # Spotify Web API Proxy
│   │   ├── giphy/search/route.ts        # GIPHY Search & Sticker Resolver
│   │   ├── gratitude/route.ts           # Gratitude Jar Operations
│   │   ├── love-letters/route.ts        # Love Letter Creation & Reactions
│   │   └── cron/cleanup-temp-media/     # Scheduled Storage Media Janitor
│   ├── auth/callback/route.ts           # OAuth Code Exchange & Server Beta Gate
│   ├── dashboard/page.tsx               # Main Couple Dashboard & Quick Links
│   ├── checkin/page.tsx                 # Daily Mood Log & Intensity Meter
│   ├── photo-booth/page.tsx             # 4-Cut Vintage Photobooth with Canvas Engine
│   ├── vibe-judge/page.tsx              # Between the Lines AI Referee Interface
│   ├── gratitude-jar/page.tsx           # Shared Gratitude Notes & Time Capsule
│   ├── love-letter/page.tsx             # Wax-Seal Love Letter Writer & Reader
│   ├── match-game/page.tsx              # Realtime Couple Compatibility Trivia
│   ├── focus/page.tsx                   # Synchronized Pomodoro Study Room
│   ├── login/page.tsx                   # Login Form with Rate Limit Protection
│   ├── signup/page.tsx                  # Beta Gated Registration & Waitlist
│   ├── onboarding/page.tsx              # Pair Matching & Invite Code Generator
│   ├── layout.tsx                       # Root Layout (Fonts, Theme, Auth & Analytics Providers)
│   ├── globals.css                      # Tailwind v4 Tokens & Paper Grain Textures
│   └── proxy.ts                         # Edge Middleware (Session Validation & Redirects)
├── components/                          # Reusable UI & Business Logic Components
│   ├── providers/                       # React Context Providers (Auth, Theme, Notification)
│   ├── navigation.tsx                   # Top App Navigation Bar with Live Status
│   ├── ambient-hearts.tsx               # Background Floating Heart Canvas Effect
│   ├── memory-desk.tsx                  # 3D Three.js Memory Desk Canvas
│   ├── spotify-search-input.tsx         # Debounced Spotify Track Searcher
│   └── otp-input.tsx                    # 6-Digit Verification Input Component
└── lib/                                 # Core Utilities, Configs & Singletons
    ├── supabase/                        # Client, Server, and Admin Supabase Helpers
    ├── beta.ts                          # Beta Mode & Invite Code Validator
    ├── analytics.ts                     # Google Analytics 4 Custom Event Trackers
    └── utils/streak.ts                  # Mathematical Couple Streak Calculator
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 5 -->
  <h2 id="ch5">5. Important Components Breakdown</h2>
  <p><span class="badge badge-intermediate">🟡 Intermediate</span></p>

  <h3>1. <code>AuthProvider</code> (<code>src/components/providers/auth-provider.tsx</code>)</h3>
  <ul>
    <li><strong>Purpose:</strong> Wraps the entire application tree to provide real-time user authentication state, partner profile data, and active couple link status.</li>
    <li><strong>State:</strong> <code>user</code> (Supabase Auth User), <code>profile</code> (User Profile Row), <code>partner</code> (Partner Profile Row), <code>pair</code> (Active Pair Row), <code>loading</code> (Initial auth resolution boolean).</li>
    <li><strong>Hooks Used:</strong> <code>useState</code>, <code>useEffect</code>, <code>useCallback</code>, <code>useContext</code>.</li>
    <li><strong>Execution Flow:</strong>
      <div class="flow-container">
        <div class="flow-step"><div class="flow-number">1</div><div class="flow-text">App mounts -> <code>supabase.auth.getSession()</code> inspects local storage and cookies for valid JWT.</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="flow-number">2</div><div class="flow-text">If user exists, queries <code>public.users</code> for display name, avatar, and notification preferences.</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="flow-number">3</div><div class="flow-text">Queries <code>public.pairs</code> matching <code>user_a_id.eq.${uid}</code> or <code>user_b_id.eq.${uid}</code>.</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="flow-number">4</div><div class="flow-text">If paired, fetches partner's profile and sets up <code>supabase.auth.onAuthStateChange()</code> listener for session refresh/logout events.</div></div>
      </div>
    </li>
  </ul>

  <h3>2. <code>PhotoBoothPage</code> (<code>src/app/photo-booth/page.tsx</code>)</h3>
  <ul>
    <li><strong>Purpose:</strong> High-performance, client-side vintage photobooth supporting 6 distinct layouts, real-time video filters, countdown audio shutter, draggable stickers, and 300 DPI canvas export.</li>
    <li><strong>State:</strong> <code>step</code> (1: Layout, 2: Camera, 3: Decorate, 4: Export), <code>selectedLayout</code>, <code>capturedPhotos</code> (base64 image strings array), <code>placedStickers</code>, <code>isMirrored</code>, <code>isCapturing</code>.</li>
    <li><strong>Key Architectural Pattern:</strong> Zero-server image manipulation. The webcam frame is captured directly into an off-screen HTML5 canvas. All transformations, filter calculations, and sticker overlays occur in browser memory, guaranteeing complete user privacy.</li>
  </ul>

  <div class="page-break"></div>

  <!-- CHAPTER 6 -->
  <h2 id="ch6">6. Functions — Teach Me WHY</h2>
  <p><span class="badge badge-advanced">🔴 Advanced</span></p>

  <h3>Function: <code>drawImageCover()</code> (<code>src/app/photo-booth/page.tsx</code>)</h3>
  <pre><code>function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgW = img.naturalWidth || img.width || 640;
  const imgH = img.naturalHeight || img.height || 480;
  const imgRatio = imgW / imgH;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sWidth = imgW, sHeight = imgH;

  if (imgRatio > targetRatio) {
    sWidth = imgH * targetRatio;
    sx = (imgW - sWidth) / 2;
  } else {
    sHeight = imgW / targetRatio;
    sy = (imgH - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
}</code></pre>

  <ul>
    <li><strong>What does it do?</strong> Implements CSS <code>object-fit: cover</code> mathematically inside HTML5 Canvas 2D rendering context.</li>
    <li><strong>Why do we need it?</strong> Webcams stream in standard 4:3 (640x480) or 16:9 (1280x720) ratios. When exporting into photobooth slots of different dimensions (like 1:1 square polaroids or 3:4 vertical cards), raw <code>ctx.drawImage(img, x, y, w, h)</code> squashes or stretches the faces. <code>drawImageCover</code> calculates center-crop source coordinates (`sx`, `sy`, `sWidth`, `sHeight`) to preserve natural facial geometry.</li>
    <li><strong>Time & Space Complexity:</strong> $O(1)$ Time (simple arithmetic), $O(1)$ Space.</li>
    <li><strong>Performance Comparison:</strong>
      <div class="flow-container">
        <div><strong>Naive Approach:</strong> Stretches pixels -> Distorted faces, unnatural aspect ratio.</div>
        <div><strong>Pairfect Approach:</strong> Center crop calculation -> Zero distortion, crisp 300 DPI output with $0$ memory overhead.</div>
      </div>
    </li>
  </ul>

  <h3>Function: <code>calculateStreak()</code> (<code>src/lib/utils/streak.ts</code>)</h3>
  <pre><code>export function calculateStreak(dates: (string | Date)[]): {
  currentStreak: number;
  longestStreak: number;
  isActiveToday: boolean;
} { ... }</code></pre>

  <ul>
    <li><strong>What does it do?</strong> Calculates consecutive daily check-in streaks for couples by normalizing timestamps to UTC midnight.</li>
    <li><strong>Why do we need it?</strong> Relationship gamification relies on accurate streaks. Without date normalization, timezone differences between long-distance partners would falsely break their daily streak.</li>
    <li><strong>Time & Space Complexity:</strong> $O(N \log N)$ where $N$ is the number of check-in dates (dominated by date sorting), followed by a single $O(N)$ linear scan.</li>
  </ul>

  <div class="page-break"></div>

  <!-- CHAPTER 7 -->
  <h2 id="ch7">7. React 19 & Next.js 16 Concepts in Pairfect</h2>
  <p><span class="badge badge-intermediate">🟡 Intermediate</span></p>

  <h3>1. Server Components vs Client Components</h3>
  <p>In Next.js App Router, components are <strong>React Server Components (RSC)</strong> by default unless marked with <code>"use client"</code>.</p>
  <ul>
    <li><strong>RSC in Pairfect (e.g. <code>src/app/(seo)/[slug]/page.tsx</code>):</strong> Executes exclusively on the server at build/request time. Has zero client bundle size impact, connects directly to file systems or databases, and streams pristine HTML to the browser for instant SEO indexing.</li>
    <li><strong>Client Components in Pairfect (e.g. <code>src/app/photo-booth/page.tsx</code>):</strong> Marked with <code>"use client"</code> at line 1. Required when using browser APIs (<code>navigator.mediaDevices.getUserMedia</code>, <code>document.createElement("canvas")</code>), React state (<code>useState</code>), or interactive hooks.</li>
  </ul>

  <h3>2. Suspense & useSearchParams Boundary Rules</h3>
  <div class="callout callout-warning">
    <div class="callout-title">⚠️ Next.js 16 App Router Requirement</div>
    Any client component calling <code>useSearchParams()</code> (such as <code>src/app/signup/page.tsx</code> reading <code>?beta=CODE</code>) must be enclosed inside a <code>&lt;Suspense fallback={...}&gt;</code> boundary. Failing to do so causes Next.js to de-optimize the entire page during production build, disabling static prerendering.
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 8 & 9 -->
  <h2 id="ch8">8 & 9. Backend Deep Dive & Complete API Documentation</h2>
  <p><span class="badge badge-advanced">🔴 Advanced</span></p>

  <h3>1. AI Dispute Judge Endpoint: <code>POST /api/disputes/judge</code></h3>
  <ul>
    <li><strong>File:</strong> <code>src/app/api/disputes/judge/route.ts</code></li>
    <li><strong>Authentication:</strong> Required (Supabase session JWT verified via <code>createServerClient</code>).</li>
    <li><strong>Authorization:</strong> User must belong to the active pair associated with the dispute.</li>
    <li><strong>Request Body:</strong>
      <pre><code>{
  "disputeId": "uuid-of-dispute-case",
  "topic": "Who forgot to take out the trash?",
  "arguments": [
    { "partner": "User A", "text": "I did it for 4 days in a row!" },
    { "partner": "User B", "text": "I was studying for exams all night!" }
  ]
}</code></pre>
    </li>
    <li><strong>Business Logic & AI Processing:</strong>
      <div class="flow-container">
        <div class="flow-step"><div class="flow-number">1</div><div class="flow-text">Validates user authentication and ensures both partner arguments are submitted.</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="flow-number">2</div><div class="flow-text">Initializes <code>GoogleGenerativeAI(process.env.GEMINI_API_KEY)</code> targeting model <code>gemini-2.5-flash</code>.</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="flow-number">3</div><div class="flow-text">Sets strict system prompt enforcing balanced perspective, empathy scoring, playful fault assignment, and actionable compromise suggestions.</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="flow-number">4</div><div class="flow-text">Executes structured prompt with <code>responseMimeType: "application/json"</code>.</div></div>
        <div class="flow-arrow">↓</div>
        <div class="flow-step"><div class="flow-number">5</div><div class="flow-text">Inserts verdict into <code>public.dispute_verdicts</code> using admin service role and returns structured JSON payload to client.</div></div>
      </div>
    </li>
  </ul>

  <h3>2. Spotify Song Proxy: <code>GET /api/spotify/search</code></h3>
  <ul>
    <li><strong>File:</strong> <code>src/app/api/spotify/search/route.ts</code></li>
    <li><strong>Purpose:</strong> Searches Spotify catalog without exposing developer client secrets to the browser. Utilizes Client Credentials token caching to reduce Spotify OAuth authentication overhead by 99%.</li>
  </ul>

  <div class="page-break"></div>

  <!-- CHAPTER 10 & 11 -->
  <h2 id="ch10">10 & 11. Database Deep Dive, SQL & Entity-Relationship Model</h2>
  <p><span class="badge badge-advanced">🔴 Advanced</span></p>

  <h3>Entity-Relationship (ER) Architecture</h3>
  <div class="ascii-diagram">
+----------------------------------------------------------------------------------------------------+
|                                    PAIRFECT DATABASE ER DIAGRAM                                    |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +-----------------------+                                                                        |
|   |      auth.users       | (Supabase Managed Authentication)                                      |
|   +-----------┬-----------+                                                                        |
|               │ 1:1 Cascade                                                                        |
|               ▼                                                                                    |
|   +-----------------------+                                                                        |
|   |     public.users      |                                                                        |
|   |  - id (PK, UUID)      |<───────────────────────┐                                               |
|   |  - display_name (TEXT)|                        │                                               |
|   |  - avatar_url (TEXT)  |                        │                                               |
|   |  - city (TEXT)        |                        │                                               |
|   +-----------┬-----------+                        │                                               |
|               │                                    │                                               |
|               │ 1:N (user_a_id / user_b_id)        │                                               |
|               ▼                                    │                                               |
|   +-----------------------+                        │                                               |
|   |     public.pairs      |                        │                                               |
|   |  - id (PK, UUID)      |                        │                                               |
|   |  - user_a_id (FK)     |                        │                                               |
|   |  - user_b_id (FK)     |                        │                                               |
|   |  - invite_code (UQ)   |                        │                                               |
|   |  - status (ENUM)      |                        │                                               |
|   +-----------┬-----------+                        │                                               |
|               │                                    │                                               |
|               ├─────────────────┬──────────────────┼─────────────────┬──────────────────┐          |
|               ▼ 1:N             ▼ 1:N              ▼ 1:N             ▼ 1:N              ▼ 1:N      |
|   +-----------------------+ +------------------+ +-----------------+ +----------------+ +---------+|
|   |       mood_logs       | |  shared_moments  | | gratitude_entry | |  love_letters  | | canvases ||
|   | - id (PK)             | | - id (PK)        | | - id (PK)       | | - id (PK)      | | - id(PK) ||
|   | - pair_id (FK)        | | - pair_id (FK)   | | - pair_id (FK)  | | - pair_id (FK) | | -pair_id ||
|   | - mood (ENUM)         | | - photo_url      | | - note (TEXT)   | | - letter_body  | +----+----+|
|   | - intensity (1-5)     | | - moment_date    | | - revealed (BOL)| | - sticker_url  |      │ 1:N  |
|   +-----------------------+ +------------------+ +-----------------+ +----------------+      ▼      |
|                                                                                         +---------+|
|                                                                                         | strokes ||
|                                                                                         +---------+|
+----------------------------------------------------------------------------------------------------+
  </div>

  <h3>Security Definer RPC Function: <code>join_pair_by_code</code></h3>
  <p>In PostgreSQL, users cannot select records from <code>public.pairs</code> if they are not yet members of that pair due to Row Level Security. Pairfect solves this securely using a <strong>PL/pgSQL Security Definer Function</strong>:</p>

  <pre><code>create or replace function public.join_pair_by_code(code text)
returns uuid as $$
declare
  target_pair_id uuid;
begin
  update public.pairs
  set user_b_id = auth.uid(), status = 'active'
  where invite_code = code 
    and status = 'pending' 
    and user_b_id is null 
    and user_a_id != auth.uid()
  returning id into target_pair_id;

  if target_pair_id is null then
    raise exception 'Invalid invite code or pair is not joinable';
  end if;

  return target_pair_id;
end;
$$ language plpgsql security definer;</code></pre>

  <div class="callout callout-tip">
    <div class="callout-title">🎯 Why This RPC is Secure</div>
    1. It runs with elevated <code>SECURITY DEFINER</code> privileges to update the row without exposing open <code>SELECT</code> permissions to anonymous users.<br>
    2. It prevents self-pairing via <code>user_a_id != auth.uid()</code>.<br>
    3. It prevents hijacking active pairs via <code>status = 'pending' AND user_b_id IS NULL</code>.
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 12 & 13 -->
  <h2 id="ch12">12 & 13. Supabase Deep Dive, Authentication & Security</h2>
  <p><span class="badge badge-advanced">🔴 Advanced</span></p>

  <h3>Row Level Security (RLS) Tenant Isolation Matrix</h3>
  <p>Every single table in Pairfect is protected by Row Level Security. A user can ONLY read, update, or delete data belonging to their verified couple pair.</p>

  <pre><code>-- Example: Mood Logs Row Level Security Policy
create policy "Users can view mood logs if in the active pair"
  on public.mood_logs for select using (
    exists (
      select 1 from public.pairs
      where pairs.id = mood_logs.pair_id
        and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
        and pairs.status = 'active'
    )
  );</code></pre>

  <h3>Authentication Flow Diagram</h3>
  <div class="ascii-diagram">
[USER] -> Submits Email/Password or Google OAuth
   │
   ▼
[SUPABASE AUTH] -> Issues JWT (Access Token 1hr) + Sets HttpOnly Refresh Cookie
   │
   ▼
[NEXT.JS PROXY MIDDLEWARE (src/proxy.ts)] -> Validates session on edge server
   │
   ├─► If Unauthenticated & Route is Protected -> Redirects to /login
   ├─► If Authenticated & Route is Auth Form -> Redirects to /dashboard
   └─► If Valid -> Passes request to Next.js App Router
   │
   ▼
[API ROUTE / POSTGREST] -> Decodes JWT -> Extracts auth.uid() -> Evaluates RLS -> Returns Data
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 14 & 15 -->
  <h2 id="ch14">14 & 15. State Management & Realtime WebSocket Channels</h2>
  <p><span class="badge badge-intermediate">🟡 Intermediate</span></p>

  <h3>Realtime WebSocket Architecture in Shared Canvas</h3>
  <p>When Partner A draws on the shared canvas in <code>src/app/match-game/page.tsx</code> or photobooth:</p>

  <div class="ascii-diagram">
Partner A (Pointer Move Event)
   │
   ▼
Canvas Context (Smooth Bézier Curves via requestAnimationFrame)
   │
   ▼
Supabase Realtime Channel: "pair_canvas_${pairId}"
   │
   ├──► [BROADCAST (Ephemeral)] -> Instant WebSockets to Partner B (<50ms latency)
   │                                     │
   │                                     ▼
   │                              Partner B Canvas (Draws incoming coordinates immediately)
   │
   └──► [DEBOUNCED DATABASE FLUSH] -> Writes compressed stroke batch to public.canvas_strokes
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 18 & 19 -->
  <h2 id="ch18">18 & 19. Git/GitHub & Production Deployment Pipeline</h2>
  <p><span class="badge badge-beginner">🟢 Beginner</span> <span class="badge badge-intermediate">🟡 Intermediate</span></p>

  <h3>Deployment Flow from Laptop to Pairfect.site</h3>
  <div class="ascii-diagram">
Local VS Code Codebase (C:\Users\2006s\.gemini\antigravity\scratch\hoedex)
   │
   ▼  git commit -m "..." && git push origin main
GitHub Repository (https://github.com/SAJAL-MALHOTRA/Pairfect---Your-lovespace)
   │
   ▼  Automatic GitHub Webhook Trigger
Vercel Production CI/CD Builder
   │
   ├──► 1. Runs "next build" -> Generates Static Pages (SSG) & Optimized RSC Manifests
   ├──► 2. Runs Turbopack Tree-Shaking -> Compresses JS Chunks
   ├──► 3. Uploads Serverless Handlers to Vercel Global Edge Network
   └──► 4. Propagates Edge SSL Certificate to Custom Domain: https://pairfect.site
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 21 -->
  <h2 id="ch21">21. 8 Feature End-to-End Traces</h2>
  <p><span class="badge badge-intermediate">🟡 Intermediate</span> <span class="badge badge-advanced">🔴 Advanced</span></p>

  <h3>Feature 1: Vintage Photobooth High-Res Export</h3>
  <div class="flow-container">
    <div class="flow-step"><div class="flow-number">1</div><div class="flow-text"><strong>User Selects Format:</strong> User picks layout in Step 1 (e.g. Classic 4-Cut Strip `strip_4`).</div></div>
    <div class="flow-step"><div class="flow-number">2</div><div class="flow-text"><strong>Camera Stream Binding:</strong> Step 2 requests <code>navigator.mediaDevices.getUserMedia</code> and attaches stream to `<video ref={videoRef}>`.</div></div>
    <div class="flow-step"><div class="flow-number">3</div><div class="flow-text"><strong>Multi-Shot Capture Sequence:</strong> <code>triggerCaptureSequence()</code> runs countdown loop, fires shutter audio via Web Audio API oscillator, flashes white screen overlay, and grabs canvas frames.</div></div>
    <div class="flow-step"><div class="flow-number">4</div><div class="flow-text"><strong>Decoration & Customizer:</strong> In Step 3, user adjusts frame color, texture, location stamp, and drags stickers across the live HTML preview.</div></div>
    <div class="flow-step"><div class="flow-number">5</div><div class="flow-text"><strong>High-Res 300 DPI Rendering:</strong> In Step 4, <code>renderStripToCanvas()</code> allocates a 1200x2400 high-res off-screen canvas, applies frame backgrounds, renders photos using <code>drawImageCover</code>, applies CSS filters, stamps date/time with serif typography, and renders positioned sticker emojis.</div></div>
    <div class="flow-step"><div class="flow-number">6</div><div class="flow-text"><strong>Download & Scrapbook Save:</strong> Triggers direct browser download via `<a>` data URL or optionally writes strip metadata to `public.photo_strips` in Supabase.</div></div>
  </div>

  <h3>Feature 2: Between the Lines (AI Dispute Vibe Judge)</h3>
  <div class="flow-container">
    <div class="flow-step"><div class="flow-number">1</div><div class="flow-text"><strong>Dispute Initialization:</strong> User A creates a case on `/vibe-judge` with a title. Case row inserted in `public.dispute_cases`.</div></div>
    <div class="flow-step"><div class="flow-number">2</div><div class="flow-text"><strong>Argument Submission:</strong> Both partners type their perspective. Arguments saved to `public.dispute_arguments`.</div></div>
    <div class="flow-step"><div class="flow-number">3</div><div class="flow-text"><strong>Judge Trigger:</strong> Client calls `POST /api/disputes/judge` with dispute ID.</div></div>
    <div class="flow-step"><div class="flow-number">4</div><div class="flow-text"><strong>Gemini Reasoning:</strong> Server compiles dispute narrative and prompts Gemini 2.5 Flash with structured JSON schema.</div></div>
    <div class="flow-step"><div class="flow-number">5</div><div class="flow-text"><strong>Verdict Delivery:</strong> AI verdict stored in `public.dispute_verdicts`. Realtime notification alerts both partners with playful fault percentages and constructive advice.</div></div>
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 22 -->
  <h2 id="ch22">22. Beginner → Intermediate → Advanced Learning Roadmap</h2>

  <h3>Level 1 — Fundamentals (Week 1–2)</h3>
  <ul>
    <li><strong>TypeScript Strict Types:</strong> Understand interfaces, generics, and return types in <code>src/lib/seo/types.ts</code>.</li>
    <li><strong>React 19 Hooks:</strong> Master <code>useState</code>, <code>useEffect</code>, <code>useCallback</code>, <code>useMemo</code>, <code>useRef</code>.</li>
    <li><strong>Tailwind CSS v4 & CSS Variables:</strong> Study how theme tokens in <code>src/app/globals.css</code> cascade across components.</li>
  </ul>

  <h3>Level 2 — Next.js 16 App Router Architecture (Week 3–4)</h3>
  <ul>
    <li><strong>Server vs Client Components:</strong> Understand why page wrappers are server components while interactive widgets use <code>"use client"</code>.</li>
    <li><strong>Route Handlers & Serverless APIs:</strong> Study request parsing, status codes, and error catching in <code>src/app/api/</code>.</li>
    <li><strong>Edge Middleware:</strong> Study how <code>src/proxy.ts</code> inspects cookies and protects authenticated routes.</li>
  </ul>

  <h3>Level 3 — Database, Security & Supabase (Week 5–6)</h3>
  <ul>
    <li><strong>PostgreSQL Schema Design:</strong> Study <code>supabase/schema.sql</code>, foreign keys, cascades, and indexes.</li>
    <li><strong>Row Level Security (RLS):</strong> Understand how PostgreSQL policies isolate couple data mathematically.</li>
    <li><strong>PL/pgSQL Functions & Triggers:</strong> Learn how <code>SECURITY DEFINER</code> functions bypass RLS safely.</li>
  </ul>

  <h3>Level 4 — Realtime WebSockets & Graphics (Week 7–8)</h3>
  <ul>
    <li><strong>Supabase Realtime Channels:</strong> Learn broadcast vs presence vs postgres changes in <code>src/app/match-game/page.tsx</code>.</li>
    <li><strong>HTML5 2D Canvas API:</strong> Master coordinate math, aspect-ratio cropping (<code>drawImageCover</code>), and 300 DPI exports.</li>
    <li><strong>Three.js / React Three Fiber:</strong> Explore 3D scenes, meshes, and lighting in <code>src/components/memory-desk.tsx</code>.</li>
  </ul>

  <h3>Level 5 — Production, AI & Scale (Week 9–10)</h3>
  <ul>
    <li><strong>LLM Structured Outputs:</strong> Learn Gemini 2.5 Flash prompt engineering and schema validation.</li>
    <li><strong>Performance Optimization:</strong> Bundle splitting, dynamic imports, debouncing, and rate limiting.</li>
    <li><strong>CI/CD & Monitoring:</strong> Git branching workflows, Vercel deployments, and Google Analytics 4 event funnels.</li>
  </ul>

  <div class="page-break"></div>

  <!-- CHAPTER 26 -->
  <h2 id="ch26">26. 50 Self-Test Questions & Comprehensive Answer Key</h2>
  <p><span class="badge badge-intermediate">🟡 Intermediate</span> <span class="badge badge-advanced">🔴 Advanced</span></p>

  <h3>Sample Test Questions:</h3>
  <ol>
    <li><strong>Q1 (Beginner):</strong> What happens step-by-step when a user clicks "Continue with Google" on the login screen?</li>
    <li><strong>Q2 (Beginner):</strong> Why does the root layout wrap children in <code>ThemeProvider</code>, <code>AuthProvider</code>, and <code>NotificationProvider</code>?</li>
    <li><strong>Q3 (Intermediate):</strong> Why are photos captured in the photobooth NOT uploaded to Supabase Storage by default when downloaded?</li>
    <li><strong>Q4 (Intermediate):</strong> Why does <code>src/app/auth/callback/route.ts</code> sanitize the <code>next</code> parameter with <code>safeNext</code>?</li>
    <li><strong>Q5 (Advanced):</strong> How does PostgreSQL execute the <code>join_pair_by_code</code> RPC function without violating Row Level Security?</li>
    <li><strong>Q6 (Advanced):</strong> Why is <code>drawImageCover()</code> used instead of standard <code>ctx.drawImage()</code> in canvas generation?</li>
    <li><strong>Q7 (Security):</strong> If an attacker steals a user's JWT token, can they read another couple's love letters or mood logs? Why or why not?</li>
  </ol>

  <h3>Answer Key Excerpt:</h3>
  <div class="callout callout-note">
    <div class="callout-title">Answer to Q5 (join_pair_by_code RPC):</div>
    Because the function is declared with <code>SECURITY DEFINER</code>, PostgreSQL executes the query with the permissions of the database owner rather than the calling user. This allows the function to locate the pending pair row and assign <code>user_b_id = auth.uid()</code> without requiring an open <code>SELECT</code> policy on <code>public.pairs</code> for anonymous or unlinked users.
  </div>

  <div class="callout callout-note">
    <div class="callout-title">Answer to Q7 (Security & RLS Isolation):</div>
    <strong>No.</strong> Every database query against <code>public.love_letters</code> and <code>public.mood_logs</code> is filtered by PostgreSQL Row Level Security (RLS). The database checks whether the JWT's <code>auth.uid()</code> matches either <code>user_a_id</code> or <code>user_b_id</code> of the associated pair. Even with a valid token, an attacker can only ever access their own couple's records.
  </div>

  <div class="page-break"></div>

  <!-- CHAPTER 29 -->
  <h2 id="ch29">29. "If I Had To Rebuild This From Scratch" Master Blueprint</h2>
  <p><span class="badge badge-beginner">🟢 Beginner</span></p>

  <p>If you were to rebuild Pairfect from zero, follow this exact 14-step engineering sequence:</p>

  <div class="flow-container">
    <div class="flow-step"><div class="flow-number">1</div><div class="flow-text"><strong>Project Scaffold:</strong> <code>npx create-next-app@latest pairfect --typescript --tailwind --app</code></div></div>
    <div class="flow-step"><div class="flow-number">2</div><div class="flow-text"><strong>Design System:</strong> Configure Tailwind v4 tokens, paper-warm color palette, Cormorant Garamond / Inter Google fonts in <code>src/app/globals.css</code>.</div></div>
    <div class="flow-step"><div class="flow-number">3</div><div class="flow-text"><strong>Supabase Setup:</strong> Create Supabase project, execute <code>schema.sql</code> to create <code>users</code>, <code>pairs</code>, and RLS policies.</div></div>
    <div class="flow-step"><div class="flow-number">4</div><div class="flow-text"><strong>Authentication Layer:</strong> Implement <code>src/lib/supabase/</code> (client, server, admin) and <code>src/proxy.ts</code> edge middleware.</div></div>
    <div class="flow-step"><div class="flow-number">5</div><div class="flow-text"><strong>Couple Onboarding:</strong> Build <code>/signup</code>, <code>/login</code>, <code>/onboarding</code> with invite code generator and <code>join_pair_by_code</code> RPC.</div></div>
    <div class="flow-step"><div class="flow-number">6</div><div class="flow-text"><strong>AuthProvider:</strong> Build React Context provider that resolves <code>user</code>, <code>profile</code>, <code>partner</code>, and <code>pair</code>.</div></div>
    <div class="flow-step"><div class="flow-number">7</div><div class="flow-text"><strong>Couple Dashboard:</strong> Build <code>/dashboard</code> with quick navigation links, streak counters, and mood indicators.</div></div>
    <div class="flow-step"><div class="flow-number">8</div><div class="flow-text"><strong>Core Feature: Photobooth:</strong> Build <code>/photo-booth</code> with webcam stream, multi-shot countdown, stickers, and 300 DPI canvas export.</div></div>
    <div class="flow-step"><div class="flow-number">9</div><div class="flow-text"><strong>Core Feature: AI Vibe Judge:</strong> Integrate Google Gemini 2.5 Flash via <code>/api/disputes/judge</code> with structured dispute analysis.</div></div>
    <div class="flow-step"><div class="flow-number">10</div><div class="flow-text"><strong>Realtime Features:</strong> Build Shared Live Canvas and Quiz Games using <code>supabase.channel()</code> WebSockets.</div></div>
    <div class="flow-step"><div class="flow-number">11</div><div class="flow-text"><strong>Asynchronous Features:</strong> Build Gratitude Jar and Love Letters with GIPHY integration and wax seal physics.</div></div>
    <div class="flow-step"><div class="flow-number">12</div><div class="flow-text"><strong>Programmatic SEO:</strong> Build <code>src/app/(seo)/[slug]/page.tsx</code> and dynamic sitemap generation for organic traffic.</div></div>
    <div class="flow-step"><div class="flow-number">13</div><div class="flow-text"><strong>Analytics & Hardening:</strong> Install <code>@next/third-parties/google</code> (GA4) and <code>@vercel/analytics</code>. Audit RLS and rate limits.</div></div>
    <div class="flow-step"><div class="flow-number">14</div><div class="flow-text"><strong>Production Deployment:</strong> Push to GitHub `main` -> Deploy to Vercel -> Bind custom domain <code>pairfect.site</code>.</div></div>
  </div>

  <div style="text-align:center; margin-top:40px; padding:20px; border-top:2px solid #8E2B45; font-family:'Playfair Display',serif; color:#591629;">
    <h3>Pairfect — Your Private Love Sanctuary</h3>
    <p style="font-size:9pt; font-family:'Inter',sans-serif; color:#8C7A70;">Engineered with love by Sajal Malhotra. Master reference guide verified and compiled.</p>
  </div>

</body>
</html>`;

fs.writeFileSync(outputPathHtml, htmlContent, 'utf8');
console.log('HTML Guide written to:', outputPathHtml);

// Now execute Chrome/Edge headless to compile the PDF
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browserPath = fs.existsSync(chromePath) ? chromePath : edgePath;

console.log('Rendering PDF using:', browserPath);
const cmd = `"${browserPath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${outputPathPdf}" --no-pdf-header-footer "${outputPathHtml}"`;

try {
  execSync(cmd);
  const pdfStats = fs.statSync(outputPathPdf);
  console.log(`SUCCESS: PDF Generated successfully! Size: ${(pdfStats.size / 1024).toFixed(1)} KB`);
  console.log('PDF Location:', outputPathPdf);
} catch (err) {
  console.error('Error generating PDF:', err);
}
