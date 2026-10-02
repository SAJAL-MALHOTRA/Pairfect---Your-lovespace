import type { Metadata } from "next";

export const metadata: Metadata = {
  referrer: "no-referrer",
};

// Inline script runs synchronously before React hydration and before
// any deferred analytics (GA4) script can capture location.href.
// It reads #k= out of the fragment, stashes it in sessionStorage under
// "e2ee_pending_fragment", then strips the hash from the address bar.
// The client component reads sessionStorage as a fallback if the hash
// is already gone by the time useEffect fires.
const FRAGMENT_GUARD_SCRIPT = `(function(){
  try {
    var h = window.location.hash;
    var m = h && h.match(/[#&]k=([A-Za-z0-9_-]+)/);
    if (m && m[1]) {
      sessionStorage.setItem('e2ee_pending_fragment', m[1]);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  } catch(e) {}
})();`;

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: FRAGMENT_GUARD_SCRIPT }} />
      {children}
    </>
  );
}
