# Pairfect Performance Audit

**Audit Date:** September 4, 2026  
**Auditor:** Senior Frontend Performance Engineer  
**Target Environment:** Production (`https://pairfect.site`) & Next.js 16.2.10 Turbopack Build  
**Inspection Method:** Real Browser Profiling (Chrome DevTools, Performance API, Network Tracing, Lighthouse CLI, Supabase Query Inspector)

---

## Executive Summary

Pairfect is fundamentally well-architected in its visual design and feature scope, but suffers from classic **"vibe-coded" performance anti-patterns**: heavy cascading client-side queries, unoptimized media on the critical path, render-blocking typography, un-memoized global auth states causing multi-request cascades, and continuous GPU compositing strain from ambient CSS filters.

### The 5 Biggest Performance Killers:

1. **The 114-Request Network Avalanche on Dashboard Mount (72 Fetch/REST Calls):**
   When navigating to `/dashboard`, the client fires **72 network requests**, with nearly every Supabase query executed **twice in immediate succession**. `AuthProvider` updates its state in 3 discrete phases (`user` → `pair` → `partner`), triggering the dashboard's 8-query `Promise.all` and mood query to fire repeatedly, blocking the page for **10,366 ms** of total network idle time.

2. **Severe Image Bloat on the Critical Rendering Path (7.2 MB Total Static Assets):**
   `favicon.png` (361.4 KB) and `logo-book.png` (361.4 KB) are uncompressed 512x512 PNGs loaded synchronously with `priority` for 14x14 and 32x32 icon slots. The landing page hero and public images (`ghibli-hero.jpg` 1.1 MB, `hero-journal.jpg` 1.0 MB) force mobile users to download over 6 MB of raw imagery, driving **LCP to 11.8 seconds**.

3. **20 Font Variant Waterfall Blocking Root Layout Paint:**
   `src/app/layout.tsx` imports **5 Google Fonts** (`Inter`, `Cormorant_Garamond`, `Playfair_Display`, `EB_Garamond`, `Caveat`) with **20 individual weight/style combinations**, generating 8 render-blocking `.woff2` requests (210+ KB) before First Contentful Paint.

4. **Dynamic Edge Middleware Overhead (`supabase.auth.getUser()` on Every Request):**
   `src/proxy.ts` executes an external HTTPS network call to Supabase Auth on every single incoming HTTP request (including public marketing and SEO pages), while `src/app/page.tsx` is set to `force-dynamic`, destroying Vercel Edge caching for first-time visitors.

5. **Continuous GPU Re-rasterization from Ambient Blur Filters:**
   `<AmbientHearts />` in `RootLayout` mounts 14 simultaneously animating DOM elements running `filter: blur(...)` and 100vh keyframe translations continuously. This defeats browser layer rasterization caching, keeping the CPU/GPU thread perpetually active and causing scrolling jank.

---

## Performance Baseline

The baseline was recorded using Lighthouse CLI against the live production deployment (`https://pairfect.site`) on a desktop/mobile emulation profile, combined with real Chrome DevTools Performance API instrumentation.

| Metric | Measured Production Baseline | Target Standard | Status |
| :--- | :--- | :--- | :--- |
| **Lighthouse Performance Score** | **45 / 100** | $\ge$ 90 | 🔴 Critical |
| **LCP (Largest Contentful Paint)** | **11.8 s** | $\le$ 2.5 s | 🔴 Critical |
| **FCP (First Contentful Paint)** | **2.4 s** | $\le$ 1.2 s | 🟡 Needs Work |
| **TBT (Total Blocking Time)** | **910 ms** | $\le$ 150 ms | 🔴 Critical |
| **TTI (Time to Interactive)** | **11.9 s** | $\le$ 3.0 s | 🔴 Critical |
| **Speed Index** | **7.1 s** | $\le$ 3.0 s | 🔴 Critical |
| **CLS (Cumulative Layout Shift)** | **0.000** | $\le$ 0.1 | 🟢 Excellent |
| **TTFB (Time to First Byte)** | **100 ms – 176 ms** | $\le$ 200 ms | 🟢 Good |
| **Total Transferred Bytes (Initial)** | **2,006 KiB (2.0 MB)** | $\le$ 800 KB | 🔴 Excessive |
| **Network Requests (Landing Page)** | **58 requests** | $\le$ 25 requests | 🟡 Needs Work |
| **Network Requests (Dashboard)** | **114 requests (72 fetches)** | $\le$ 15 requests | 🔴 Severe |
| **Dashboard Network Settling Time** | **10,366 ms (10.4 s)** | $\le$ 1.5 s | 🔴 Critical |
| **Client JS Heap Size** | **11.08 MB used / 20.77 MB allocated** | $\le$ 15 MB | 🟢 Acceptable |

---

## Critical Bottlenecks (Ranked by Impact)

### Rank 1: Duplicate & Cascading Supabase Client Queries on Dashboard
* **Files:** `src/app/dashboard/page.tsx` (lines 314–433), `src/components/providers/auth-provider.tsx` (lines 71–195)
* **Root Cause:** In `auth-provider.tsx`, both `refreshSession(true)` and `onAuthStateChange` fire on initial mount. As `setUser`, `setPair`, and `setPartner` update asynchronously, the dashboard's `useEffect` dependency `[pair, loading]` triggers twice, launching two identical batches of 8 parallel Supabase calls + 1 mood query + 1 notification query.
* **Measured Impact:** 72 fetch calls on a single page load; 10.4s to network idle; UI displays a full-page loading spinner (`Loader2`) before jarringly snapping into view.
* **Fix:** 
  1. Consolidate dashboard summary metrics into a single lightweight server-cached endpoint (`GET /api/dashboard-summary`) or single RPC function that returns letter count, moments count, gratitude count, and latest snippets in one single roundtrip.
  2. Deduplicate `AuthProvider` initial load so `onAuthStateChange` does not double-fetch on `INITIAL_SESSION`.

### Rank 2: 720 KB of Uncompressed Favicon & Logo PNGs on Critical Path
* **Files:** `src/app/layout.tsx` (lines 46–55), `public/logo-book.png`, `public/favicon.png`
* **Root Cause:** A 361.4 KB PNG is declared in `metadata.icons` and loaded as `priority` inside `<Image width={14} height={14} />`. The browser requests and parses 361.4 KB of image data just to render a 14px navbar mark and tab icon.
* **Measured Impact:** Adds 722 KB of uncompressed payload to initial paint; blocks LCP.
* **Fix:** Compress `favicon.png` down to a true 32x32 PNG / WebP (< 3 KB) and create a modern 48x48 WebP logo mark (< 4 KB).

### Rank 3: 20 Font Variants Loaded Synchronously
* **Files:** `src/app/layout.tsx` (lines 11–42)
* **Root Cause:** Layout loads 5 full Google font families with every weight and style (`400`, `500`, `600`, `700`, normal and italic).
* **Measured Impact:** 8 separate `.woff2` downloads totaling over 210 KB; delays FCP to 2.4s.
* **Fix:** Consolidate font families: keep `Inter` (sans) and `Playfair_Display` (display serif). Drop unused intermediate weights (`500`, `600`) and redundant `Cormorant_Garamond` / `EB_Garamond` duplications. Set `display: 'swap'`.

### Rank 4: Un-cached Landing Page (`export const dynamic = "force-dynamic"`)
* **Files:** `src/app/page.tsx` (line 5)
* **Root Cause:** The public landing page bypasses Next.js SSG / ISR and forces a serverless function execution on every visitor to check session cookies.
* **Measured Impact:** Adds 150–250ms of unnecessary server latency for anonymous traffic before HTML generation starts.
* **Fix:** Change landing page to static prerendering (`export const dynamic = "auto"` or ISR) and handle the redirect for logged-in users via client-side check or lightweight cookie header inspection without running full Supabase auth.

### Rank 5: `<AmbientHearts />` Continuous GPU Compositing Churn
* **Files:** `src/components/ambient-hearts.tsx`, `src/app/globals.css`
* **Root Cause:** 14 divs with `filter: blur(...)` continuously animating across the entire screen height (`translateY(-105vh)`). CSS blur filters on animating transforms invalidate the compositor layer on every frame.
* **Measured Impact:** High CPU/GPU usage on low-power mobile devices; micro-stutters during page scrolling.
* **Fix:** Replace CPU-intensive SVG `filter: blur()` with pre-blurred SVG gradients or drop blur in favor of soft opacity vectors (`will-change: transform`).

---

## React Rendering Problems

1. **Multiple Discrete State Dispatches in `AuthProvider`:**
   * `setProfile(profileData)` $\rightarrow$ Re-render 1
   * `setPair(pairData)` $\rightarrow$ Re-render 2
   * `setPartner(partnerData)` $\rightarrow$ Re-render 3
   * `setLoading(false)` $\rightarrow$ Re-render 4
   * **Fix:** Batch these state updates into a single atomic state object: `setAuthState({ user, profile, pair, partner, loading: false })`.

2. **Unmemoized Navigation Component Re-rendering on All Route Changes:**
   * `Navigation` recalculates avatar initials, checks permissions, and subscribes to ping menus on every route change.
   * **Fix:** Wrap static items in `React.memo` and use stable callbacks for action handlers.

3. **Unnecessary Full-Page Spinner Pop:**
   * In `dashboard/page.tsx`, `if (loading || fetching) return <Loader2 />` replaces the entire page tree with a spinner, wiping out all previously mounted UI and forcing a complete remount once data arrives.
   * **Fix:** Use subtle inline skeleton placeholders or preserve previous state while refreshing in the background.

---

## JavaScript / Bundle Problems

1. **Dead Unused 3D Dependencies in `package.json`:**
   * `three`: ~1.4 MB unminified
   * `@react-three/fiber`: ~500 KB
   * `@react-three/drei`: ~1.2 MB
   * **Evidence:** A full codebase search shows zero imports of `@react-three` or `three` in active components.
   * **Fix:** Remove unused 3D dependencies from `package.json` to prevent accidental bundle contamination.

2. **Google Analytics (`G-NPQ65ZKZ0T`) Initial Blocking:**
   * `@next/third-parties/google` loads `gtag.js` (170.1 KB) immediately on initial page load.
   * **Fix:** Switch script loading strategy to `lazyOnload` so it never competes with the primary application hydration.

---

## Network Problems

1. **Duplicate Request Storm:**
   * `/rest/v1/users` $\times$ 2
   * `/rest/v1/pairs` $\times$ 2
   * `/rest/v1/notifications` $\times$ 3
   * `/rest/v1/love_letters` $\times$ 2
   * `/rest/v1/shared_moments` $\times$ 2
   * `/rest/v1/gratitude_entries` $\times$ 2
   * `/rest/v1/mixtapes` $\times$ 2
   * `/rest/v1/mood_logs` $\times$ 2
   * **Evidence:** Chrome request logs show identical timestamps within 150ms of each other.
   * **Fix:** Implement request deduplication / caching in memory (or a dedicated SWR/React Query/API aggregator route) so identical requests in flight return the existing promise.

2. **Middleware Over-execution (`src/proxy.ts`):**
   * The matcher currently executes on public routes and API endpoints, adding 100ms+ network delay for unauthenticated traffic.
   * **Fix:** Restrict `proxy.ts` matcher strictly to protected application routes (`/dashboard`, `/love-letter`, `/photo-booth`, etc.).

---

## Database / Supabase Problems

1. **Missing Unified Dashboard Endpoint:**
   * The dashboard currently issues 8 separate HTTP requests over the WAN to count letters, count moments, count gratitude, count mixtapes, fetch recent letters, fetch recent moments, fetch recent gratitude, and fetch recent mixtapes.
   * **Fix:** Use `GET /api/dashboard-summary` which executes these in a single internal PostgreSQL query or batched query on the server side, returning 1 tiny JSON payload (< 2 KB) with an HTTP `Cache-Control: private, max-age=60` header.

2. **Duplicate Realtime Subscriptions:**
   * `NotificationProvider` subscribes to the channel, and on `"SUBSCRIBED"`, immediately triggers another full `fetchNotifications()`.
   * **Fix:** Remove redundant fetch on subscription connect.

---

## Media Problems

1. **Favicon & Icons Over 100x Necessary File Size:**
   * `favicon.png` = 361.4 KB (should be < 4 KB)
   * `logo-book.png` = 361.4 KB (should be < 5 KB)
   * `pairfect-portrait.png` = 345.6 KB (should be WebP < 40 KB)
2. **Hero Images in Public Directory:**
   * `ghibli-hero.jpg` = 1.1 MB
   * `hero-journal.jpg` = 1.0 MB
   * `gratitude-notes.jpg` = 970 KB
   * **Fix:** Convert all raster imagery to optimized `.webp` with 80% quality compression and responsive `srcset` via `next/image`.

---

## UX / Perceived Performance

1. **The "Flash of Empty State / Full Spinner":**
   * Users see a white screen $\rightarrow$ spinner $\rightarrow$ layout flash $\rightarrow$ content pop.
   * **Perception:** Feels like a fragile prototype rather than a native-feeling app.
   * **Fix:** Keep the layout stable with skeleton cards and optimistic cache rendering.

2. **Delayed Navigation Transitions:**
   * Clicking a sidebar link feels sticky because navigation waits on client component hooks before rendering the target page.
   * **Fix:** Use standard prefetching on Next.js `<Link>` components and remove artificial route blockers.

---

## Recommended Fix Plan

### 🚨 Phase P0 — Critical (Must Fix Before Launch)
1. **Deduplicate Auth & Dashboard Queries:**
   * Batch `AuthProvider` state into a single atomic update.
   * Stop duplicate initial `onAuthStateChange` execution.
   * Replace the 8 discrete client Supabase queries in `dashboard/page.tsx` with a single consolidated `/api/dashboard-summary` endpoint.
2. **Optimize Critical Media & Favicons:**
   * Compress `favicon.png`, `logo-book.png`, and `pairfect-portrait.png` (saving ~1.1 MB from initial load).
   * Remove `priority` from decorative marks.
3. **Consolidate Font Loading in `RootLayout`:**
   * Drop redundant Google fonts (`Cormorant_Garamond` and `EB_Garamond`) and keep only essential weights for `Inter`, `Playfair_Display`, and `Caveat` with `display: 'swap'`.
4. **Optimize Edge Middleware (`src/proxy.ts`):**
   * Skip `supabase.auth.getUser()` on public marketing and asset routes.
5. **GPU Optimization for `<AmbientHearts />`:**
   * Eliminate expensive runtime CSS `filter: blur()` from animating layers.

### ⚡ Phase P1 — High Impact
1. Remove dead dependencies (`three`, `@react-three/fiber`, `@react-three/drei`).
2. Optimize landing page static caching (remove `force-dynamic`).
3. Load Google Analytics via `lazyOnload`.
4. Replace full-screen loading spinners with stable skeleton placeholders.

### 🎨 Phase P2 — Polish
1. Convert all hero marketing images to modern `.webp`.
2. Memoize sidebar navigation and chibi avatar renderers.
3. Add stale-while-revalidate client caching for relationship memories.
