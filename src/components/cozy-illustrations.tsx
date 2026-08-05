import React, { useId } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { parseAvatarConfig, ChibiAvatar } from "@/components/chibi-avatar";

export type CozyIllustrationProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

const a11y = (title?: string) =>
  title ? { role: "img", "aria-hidden": undefined } : { "aria-hidden": true };

// Decorative Elements (kept from V1 for safety)
export function LoveLetterEnvelope({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}
    <defs>
      <linearGradient id={`${id}-paper`} x1="45" y1="52" x2="194" y2="190"><stop stopColor="#fffafb"/><stop offset="1" stopColor="#fbcfe8"/></linearGradient>
      <linearGradient id={`${id}-flap`} x1="70" y1="85" x2="166" y2="166"><stop stopColor="#f9a8d4"/><stop offset="1" stopColor="#f472b6"/></linearGradient>
      <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#9d4f74" floodOpacity=".2"/></filter>
    </defs>
    <ellipse cx="120" cy="190" rx="76" ry="11" fill="#ddbfc8" opacity=".25"/>
    <g filter={`url(#${id}-shadow)`}>
      <rect x="43" y="73" width="154" height="112" rx="18" fill={`url(#${id}-paper)`} stroke="#e86cab" strokeWidth="3"/>
      <path d="M46 82 120 139 194 82" fill={`url(#${id}-flap)`} stroke="#e86cab" strokeWidth="3" strokeLinejoin="round"/>
      <path d="m46 177 55-48c11-9 27-9 38 0l55 48" fill="#fce7f3" stroke="#e86cab" strokeWidth="3" strokeLinejoin="round"/>
      <path d="m46 177 61-53c8-7 18-7 26 0l61 53" fill="none" stroke="#f9a8d4" strokeWidth="2"/>
      <circle cx="120" cy="139" r="23" fill="#fff5f7" stroke="#d85c99" strokeWidth="2"/>
      <path d="M120 153c-3-5-15-11-15-21 0-10 12-13 15-5 4-8 16-5 16 5 0 10-13 17-16 21Z" fill="#f472b6"/>
    </g>
    <g fill="#f7c35f"><path d="m38 67 2.7 7.2L48 77l-7.3 2.8L38 87l-2.7-7.2L28 77l7.3-2.8Z"/><path d="m203 120 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>
    <g fill="none" stroke="#60a5fa" strokeLinecap="round"><path d="m188 52 7-7m-2 13 9-1"/><path d="m54 202-5 5m13-3 1 7"/></g>
  </svg>;
}

export function OpenScrapbook({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}
    <defs><filter id={`${id}-s`} x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dy="7" stdDeviation="6" floodColor="#6e5260" floodOpacity=".18"/></filter><linearGradient id={`${id}-p`} x1="42" y1="52" x2="184" y2="199"><stop stopColor="#fff"/><stop offset="1" stopColor="#f8f4f0"/></linearGradient></defs>
    <ellipse cx="120" cy="197" rx="91" ry="12" fill="#cbb8b1" opacity=".22"/>
    <g filter={`url(#${id}-s)`} strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 67C97 51 63 50 35 63v124c31-12 60-10 85 7Z" fill={`url(#${id}-p)`} stroke="#d9b9c5" strokeWidth="3"/>
      <path d="M120 67c23-16 57-17 85-4v124c-31-12-60-10-85 7Z" fill={`url(#${id}-p)`} stroke="#d9b9c5" strokeWidth="3"/>
      <path d="M120 68v124" stroke="#c99dac" strokeWidth="3"/>
      <g transform="rotate(-4 76 110)"><rect x="52" y="81" width="52" height="68" rx="4" fill="#fff" stroke="#efb0cf" strokeWidth="2"/><rect x="58" y="88" width="40" height="43" rx="3" fill="#bfdbfe"/><circle cx="72" cy="105" r="9" fill="#f9a8d4"/><path d="m59 128 15-17 11 10 13-15v25H58Z" fill="#60a5fa" opacity=".65"/><path d="M65 76h29v12H65z" fill="#fde68a" opacity=".8"/></g>
      <g transform="rotate(5 165 118)"><rect x="139" y="88" width="54" height="69" rx="4" fill="#fff" stroke="#91bdf7" strokeWidth="2"/><rect x="145" y="95" width="42" height="43" rx="3" fill="#fce7f3"/><path d="M153 126c9-24 18-24 27 0" fill="none" stroke="#f472b6" strokeWidth="5"/><circle cx="157" cy="107" r="5" fill="#f7c35f"/><path d="M151 83h31v12h-31z" fill="#bfdbfe" opacity=".85"/></g>
    </g>
    <g fill="none" stroke="#d59b72" strokeWidth="2" strokeLinecap="round"><path d="M44 164c14-3 20 3 24 18m-13-16c-7 2-10 6-11 12m17-9c7 0 11 3 14 8"/><path d="M196 164c-14-3-20 3-24 18m13-16c7 2 10 6 11 12m-17-9c-7 0-11 3-14 8"/></g>
  </svg>;
}

export function PhotoboothFilmStrip({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><linearGradient id={`${id}-g`} x1="80" y1="28" x2="166" y2="217"><stop stopColor="#3b4051"/><stop offset="1" stopColor="#191b27"/></linearGradient><filter id={`${id}-s`}><feDropShadow dy="7" stdDeviation="6" floodOpacity=".22"/></filter></defs>
    <g transform="rotate(-4 120 120)" filter={`url(#${id}-s)`}><rect x="76" y="18" width="88" height="204" rx="15" fill={`url(#${id}-g)`}/><g fill="#f8f4f0"><circle cx="88" cy="31" r="3"/><circle cx="152" cy="31" r="3"/><circle cx="88" cy="209" r="3"/><circle cx="152" cy="209" r="3"/></g>
      <g><rect x="88" y="41" width="64" height="48" rx="8" fill="#fce7f3"/><circle cx="109" cy="62" r="12" fill="#f9a8d4"/><circle cx="133" cy="62" r="12" fill="#93c5fd"/><path d="M101 78c8-9 31-9 40 0" fill="#fff" opacity=".65"/></g>
      <g><rect x="88" y="96" width="64" height="48" rx="8" fill="#dbeafe"/><circle cx="120" cy="117" r="17" fill="#fff" opacity=".75"/><path d="M111 118c5 5 13 5 18 0" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round"/><circle cx="113" cy="112" r="2" fill="#374151"/><circle cx="127" cy="112" r="2" fill="#374151"/><path d="m144 101 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#f7c35f"/></g>
      <g><rect x="88" y="151" width="64" height="48" rx="8" fill="#fff3d1"/><path d="M120 187c-3-5-15-11-15-21 0-9 11-12 15-4 4-8 15-5 15 4 0 10-12 16-15 21Z" fill="#f472b6"/><circle cx="98" cy="160" r="5" fill="#60a5fa"/></g>
    </g>
  </svg>;
}

// Global shared crisp drop shadow filter
const PaperFilter = ({ id }: { id: string }) => (
  <defs>
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#3D2432" floodOpacity="0.08" />
    </filter>
  </defs>
);

// 1. Profile / Us: The primary Pairfect Portrait of the couple
export function PairfectPortrait({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Pairfect Portrait")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />
      
      {/* Nested customizable chibi avatars */}
      <ChibiAvatar config={configA} pose="standing" x="22" y="72" width="120" height="120" noBackground={true} />
      <ChibiAvatar config={configB} pose="standing" x="122" y="72" width="120" height="120" noBackground={true} />
      
      {/* Floating Heart between them */}
      <path d="M 135 106 C 127 94, 115 104, 135 120 C 155 104, 143 94, 135 106 Z" fill="#C98892" />
      
      {/* Decorative botanical details in corners */}
      <path d="M 25 220 Q 35 210 40 225 M 35 210 Q 45 200 48 212" stroke="#A6B3A8" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="48" cy="212" r="2.5" fill="#DDBFBF" />
      <circle cx="40" cy="225" r="2" fill="#DDBFBF" />
    </svg>
  );
}

// 2. Dashboard: Couple sharing a warm, quiet coffee date on a window sill
export function DashboardWelcoming({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Welcome to Pairfect")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />

      {/* Window Sill Line */}
      <line x1="45" y1="205" x2="225" y2="205" stroke="#E2D4C3" strokeWidth="3" strokeLinecap="round" />
      
      {/* Cozy Mugs sitting on the window sill */}
      <g transform="translate(122, 172)">
        <path d="M 10 16 H 26 V 32 Q 26 40 18 40 Q 10 40 10 32 Z" fill="#E0B8B8" stroke="#CD8D8D" strokeWidth="1.5" />
        <path d="M 26 20 Q 32 20 32 26 Q 32 32 26 32" stroke="#CD8D8D" strokeWidth="1.5" fill="none" />
        <path d="M 32 16 H 48 V 32 Q 48 40 40 40 Q 32 40 32 32 Z" fill="#A8BDB2" stroke="#8CA699" strokeWidth="1.5" />
        <path d="M 32 20 Q 26 20 26 26 Q 26 32 32 32" stroke="#8CA699" strokeWidth="1.5" fill="none" />
        {/* Steam rising */}
        <path d="M 16 10 Q 18 5 15 0" stroke="#CD8D8D" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round" />
        <path d="M 42 10 Q 40 5 43 0" stroke="#8CA699" strokeWidth="1" fill="none" opacity="0.6" strokeLinecap="round" />
      </g>

      {/* Custom characters sitting together */}
      <ChibiAvatar config={configA} pose="drinking-coffee" x="25" y="75" width="115" height="115" noBackground={true} />
      <ChibiAvatar config={configB} pose="drinking-coffee" x="130" y="75" width="115" height="115" noBackground={true} />
    </svg>
  );
}

// 3. Love Letters: Couple sitting back-to-back, sending handwritten letters
export function WritingLetters({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Writing Letters")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />

      {/* Soft ground line */}
      <path d="M 40 215 C 80 210, 200 210, 240 215" stroke="#E6DFD3" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Nested custom characters */}
      <ChibiAvatar config={configA} pose="writing" x="20" y="85" width="110" height="110" noBackground={true} />
      <ChibiAvatar config={configB} pose="standing" x="135" y="85" width="110" height="110" noBackground={true} />
      
      {/* Envelope in lap A */}
      <path d="M 72 165 H 92 V 177 H 72 Z" fill="#FAF6EE" stroke="#CD8D8D" strokeWidth="1" />
      {/* Notebook sheet in B */}
      <path d="M 180 162 H 200 V 178 H 180 Z" fill="#FAF6EE" stroke="#8CA699" strokeWidth="1" />
    </svg>
  );
}

// 4. Journal: One partner writing in a journal while the other watches with a warm smile
export function JournalingTogether({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Journaling Together")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />

      {/* Soft floor shadow */}
      <ellipse cx="140" cy="210" rx="90" ry="10" fill="#E2D4C3" opacity="0.4" />

      {/* Nested custom characters */}
      <ChibiAvatar config={configA} pose="standing" x="25" y="80" width="115" height="115" noBackground={true} />
      <ChibiAvatar config={configB} pose="writing" x="125" y="80" width="115" height="115" noBackground={true} />
      
      {/* Open journal in lap B */}
      <path d="M 172 172 C 178 168, 184 168, 190 172 L 190 190 C 184 186, 178 186, 172 190 Z" fill="#FAF6EE" stroke="#A88B73" strokeWidth="1" />
    </svg>
  );
}

// 5. Memories: Couple looking at polaroid snapshots
export function LookingAtPhotos({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Looking at Photos")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />

      {/* Nested custom characters */}
      <ChibiAvatar config={configA} pose="standing" x="20" y="80" width="115" height="115" noBackground={true} />
      <ChibiAvatar config={configB} pose="standing" x="130" y="80" width="115" height="115" noBackground={true} />

      {/* Polaroid held in center */}
      <g transform="translate(112, 160) rotate(-4)">
        <rect x="0" y="0" width="46" height="54" rx="3" fill="#FFF" stroke="#E6DFD3" strokeWidth="1.5" />
        <rect x="4" y="4" width="38" height="36" fill="#FDF3F5" />
        <path d="M 23 16 C 18 10, 10 16, 23 28 C 36 16, 28 10, 23 16 Z" fill="#CD8D8D" />
      </g>
    </svg>
  );
}

// 6. Timeline: Evolving relationship timeline illustration showing walking together
export function TimelineStory({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Timeline Journey")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />

      {/* Soft winding path */}
      <path d="M 30 220 Q 140 200 250 220" stroke="#E2D4C3" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Nested custom characters walking path */}
      <ChibiAvatar config={configA} pose="standing" x="35" y="75" width="115" height="115" noBackground={true} />
      <ChibiAvatar config={configB} pose="hugging" x="110" y="75" width="115" height="115" noBackground={true} />
    </svg>
  );
}

// 7. Playroom: Couple sharing single headphones, gaming or listening together
export function PlayfulMoments({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Playroom Moments")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />

      {/* Nested custom characters */}
      <ChibiAvatar config={configA} pose="standing" x="20" y="80" width="115" height="115" noBackground={true} />
      <ChibiAvatar config={configB} pose="standing" x="130" y="80" width="115" height="115" noBackground={true} />

      {/* Headphone band connecting them */}
      <path d="M 98 126 C 100 110, 175 110, 177 126" fill="none" stroke="#5C4D3C" strokeWidth="2.5" />
      <rect x="94" y="124" width="6" height="12" rx="2" fill="#5C4D3C" />
      <rect x="175" y="124" width="6" height="12" rx="2" fill="#5C4D3C" />
    </svg>
  );
}

// 8. Gratitude Jar Ritual: Signature Visual of drop-note ritual
export function GratitudeJarRitual({ className = "h-48 w-48", ...props }: CozyIllustrationProps) {
  const id = useId();
  const { profile, partner } = useAuth();
  const configA = parseAvatarConfig(profile?.avatar_url);
  const configB = parseAvatarConfig(partner?.avatar_url);

  return (
    <svg viewBox="0 0 280 280" className={className} {...a11y("Gratitude Jar Ritual")} {...props}>
      <PaperFilter id={`${id}-paper`} />
      <rect x="15" y="15" width="250" height="250" rx="36" fill="#FAF6EE" stroke="#E6DFD3" strokeWidth="2" filter={`url(#${id}-paper)`} />

      {/* The Glass Jar in the center */}
      <g transform="translate(112, 130)">
        <ellipse cx="28" cy="72" rx="26" ry="6" fill="#E2D4C3" opacity="0.7" />
        <path d="M 12 12 Q 4 12 4 20 L 4 64 Q 4 72 12 72 H 44 Q 52 72 52 64 L 52 20 Q 52 12 44 12 Z" fill="rgba(255, 255, 255, 0.2)" stroke="#A88B73" strokeWidth="1.5" />
        <rect x="14" y="4" width="28" height="8" rx="2" fill="#8C6A48" stroke="#60472E" strokeWidth="1" />
        <rect x="14" y="55" width="8" height="8" rx="1.5" fill="#E0B8B8" opacity="0.8" transform="rotate(15 14 55)" />
        <rect x="26" y="58" width="8" height="8" rx="1.5" fill="#A8BDB2" opacity="0.8" transform="rotate(-10 26 58)" />
        <rect x="34" y="52" width="8" height="8" rx="1.5" fill="#D2C4D8" opacity="0.8" transform="rotate(25 34 52)" />
      </g>

      {/* Nested custom characters */}
      <ChibiAvatar config={configA} pose="writing" x="10" y="80" width="115" height="115" noBackground={true} />
      <ChibiAvatar config={configB} pose="standing" x="145" y="80" width="115" height="115" noBackground={true} />
      
      {/* Paper slip flying from hand A */}
      <rect x="94" y="145" width="10" height="10" rx="2" fill="#D2C4D8" stroke="#8A6EA8" strokeWidth="1" transform="rotate(-15 94 145)" />
    </svg>
  );
}

export const cozyCouplesIllustrations = {
  LoveLetterEnvelope,
  OpenScrapbook,
  PhotoboothFilmStrip,
  
  // Custom Storybook Illustrations
  PairfectPortrait,
  DashboardWelcoming,
  WritingLetters,
  JournalingTogether,
  LookingAtPhotos,
  TimelineStory,
  PlayfulMoments,
  GratitudeJarRitual,
} as const;
