import React, { useId } from "react";

export type CozyIllustrationProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

const a11y = (title?: string) =>
  title ? { role: "img", "aria-hidden": undefined } : { "aria-hidden": true };

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
    <g fill="#f7c35f"><path d="m30 48 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path d="m213 75 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g>
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
    <g transform="translate(161 43)" stroke="#d85c99" strokeWidth="2"><rect x="0" y="7" width="42" height="30" rx="8" fill="#fff"/><path d="m10 7 5-7h13l5 7" fill="#f9a8d4"/><circle cx="21" cy="22" r="9" fill="#bfdbfe"/><circle cx="21" cy="22" r="4" fill="#60a5fa"/></g>
    <g fontFamily="system-ui" fontSize="16"><text x="44" y="79">😊</text><text x="177" y="113">✨</text><text x="46" y="164">💕</text></g>
  </svg>;
}

export function MilestoneCompass({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><radialGradient id={`${id}-g`}><stop stopColor="#fff"/><stop offset=".72" stopColor="#fce7f3"/><stop offset="1" stopColor="#f9a8d4"/></radialGradient><filter id={`${id}-s`}><feDropShadow dy="7" stdDeviation="7" floodColor="#765363" floodOpacity=".2"/></filter></defs>
    <circle cx="120" cy="123" r="82" fill={`url(#${id}-g)`} stroke="#d8a5b9" strokeWidth="4" filter={`url(#${id}-s)`}/><circle cx="120" cy="123" r="66" fill="none" stroke="#60a5fa" strokeWidth="2" strokeDasharray="2 7"/><circle cx="120" cy="123" r="52" fill="#fffafc" stroke="#edb7cf" strokeWidth="2"/>
    <g fill="#566279" fontFamily="serif" fontWeight="700" fontSize="13" textAnchor="middle"><text x="120" y="64">N</text><text x="120" y="190">S</text><text x="182" y="128">E</text><text x="58" y="128">W</text></g>
    <path d="m120 76 13 43-13 8-13-8Z" fill="#60a5fa"/><path d="m120 170-13-43 13-8 13 8Z" fill="#f9a8d4"/>
    <path d="M120 139c-3-4-13-9-13-18 0-8 10-10 13-4 3-6 13-4 13 4 0 9-10 14-13 18Z" fill="#f472b6" stroke="#fff" strokeWidth="2"/>
    <g fill="#f7c35f"><path d="m38 57 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z"/><path d="m200 171 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z"/></g>
    <path d="M182 47a18 18 0 1 0 17 28 22 22 0 0 1-17-28Z" fill="#fde68a" stroke="#e8b753" strokeWidth="2"/><g fill="none" stroke="#c9a9b7" strokeWidth="2"><circle cx="63" cy="198" r="6"/><path d="M79 202a8 8 0 0 1 0-16M94 184a10 10 0 1 0 0 20"/></g>
  </svg>;
}

export function AnniversaryCalendar({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><linearGradient id={`${id}-g`} x1="52" y1="42" x2="185" y2="201"><stop stopColor="#bfdbfe"/><stop offset="1" stopColor="#fbcfe8"/></linearGradient><filter id={`${id}-s`}><feDropShadow dy="8" stdDeviation="7" floodColor="#895b71" floodOpacity=".2"/></filter></defs>
    <rect x="37" y="35" width="166" height="174" rx="29" fill={`url(#${id}-g)`} opacity=".48"/>
    <g filter={`url(#${id}-s)`}><rect x="50" y="49" width="140" height="143" rx="19" fill="#fffdfa"/><path d="M50 70c0-12 8-21 20-21h100c12 0 20 9 20 21v23H50Z" fill="#f472b6"/><g stroke="#fff" strokeWidth="5" strokeLinecap="round"><path d="M80 42v22M160 42v22"/></g>
      <g fill="#768095" fontFamily="system-ui" fontSize="12" textAnchor="middle"><text x="72" y="111">S</text><text x="88" y="111">M</text><text x="104" y="111">T</text><text x="120" y="111">W</text><text x="136" y="111">T</text><text x="152" y="111">F</text><text x="168" y="111">S</text></g>
      <g fill="#40506b" fontFamily="system-ui" fontSize="13" textAnchor="middle"><text x="72" y="133">10</text><text x="88" y="133">11</text><text x="104" y="133">12</text><text x="120" y="133">13</text><text x="136" y="133">14</text><text x="152" y="133">15</text><text x="168" y="133">16</text><text x="72" y="158">17</text><text x="88" y="158">18</text><text x="104" y="158">19</text><text x="120" y="158" fill="#d9468f" fontWeight="700">20</text><text x="136" y="158">21</text><text x="152" y="158">22</text><text x="168" y="158">23</text><text x="72" y="181">24</text><text x="88" y="181">25</text><text x="104" y="181">26</text><text x="120" y="181">27</text><text x="136" y="181">28</text><text x="152" y="181">29</text><text x="168" y="181">30</text></g>
      <path d="M120 170c-7-4-19-11-20-22-1-13 14-18 20-7 6-11 21-6 20 7-1 11-13 18-20 22Z" fill="none" stroke="#f472b6" strokeWidth="3" strokeLinecap="round"/>
    </g>
    <g fill="#f472b6"><path d="M29 115c-2-3-9-6-9-12 0-6 7-8 9-3 3-5 10-3 10 3 0 6-7 9-10 12Z"/><path d="M210 150c-2-3-8-6-8-11 0-6 6-8 8-3 3-5 9-3 9 3 0 5-6 8-9 11Z"/></g><path d="m207 71 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#f7c35f"/>
  </svg>;
}

export function CozyCoupleMugs({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><linearGradient id={`${id}-p`} x1="50" y1="105" x2="109" y2="185"><stop stopColor="#fbcfe8"/><stop offset="1" stopColor="#f472b6"/></linearGradient><linearGradient id={`${id}-b`} x1="125" y1="105" x2="188" y2="186"><stop stopColor="#dbeafe"/><stop offset="1" stopColor="#60a5fa"/></linearGradient><filter id={`${id}-s`}><feDropShadow dy="7" stdDeviation="6" floodColor="#664a55" floodOpacity=".18"/></filter></defs>
    <ellipse cx="120" cy="190" rx="88" ry="13" fill="#c9afa7" opacity=".25"/>
    <g filter={`url(#${id}-s)`}><path d="M42 105h72v54c0 20-13 31-36 31s-36-11-36-31Z" fill={`url(#${id}-p)`} stroke="#d95b98" strokeWidth="3"/><path d="M114 118h10c19 0 20 35 0 35h-10" fill="none" stroke="#d95b98" strokeWidth="8"/>
      <path d="M126 105h72v54c0 20-13 31-36 31s-36-11-36-31Z" fill={`url(#${id}-b)`} stroke="#438bd9" strokeWidth="3"/><path d="M198 118h7c20 0 20 35 0 35h-7" fill="none" stroke="#438bd9" strokeWidth="8"/>
      <ellipse cx="78" cy="106" rx="36" ry="9" fill="#fff7f5" stroke="#d95b98" strokeWidth="3"/><ellipse cx="78" cy="106" rx="29" ry="5" fill="#9b604c"/><ellipse cx="162" cy="106" rx="36" ry="9" fill="#fff" stroke="#438bd9" strokeWidth="3"/><ellipse cx="162" cy="106" rx="29" ry="5" fill="#9b604c"/>
    </g>
    <g fill="none" stroke="#d7a6b8" strokeWidth="4" strokeLinecap="round"><path d="M76 93c-17-22 7-28 7-45 0-11-14-16-20-5-8 14 21 33 57 61"/><path d="M164 93c17-22-7-28-7-45 0-11 14-16 20-5 8 14-21 33-57 61"/></g>
    <g fill="#4b5563"><circle cx="69" cy="143" r="2.5"/><circle cx="86" cy="143" r="2.5"/><path d="M70 153c5 5 11 5 16 0" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"/><circle cx="153" cy="143" r="2.5"/><circle cx="170" cy="143" r="2.5"/><path d="M154 153c5 5 11 5 16 0" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round"/></g>
  </svg>;
}

export function WaxSealStamp({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><linearGradient id={`${id}-wax`} x1="74" y1="100" x2="168" y2="205"><stop stopColor="#fa9ccb"/><stop offset=".55" stopColor="#f472b6"/><stop offset="1" stopColor="#c94282"/></linearGradient><linearGradient id={`${id}-wood`} x1="102" y1="21" x2="141" y2="130"><stop stopColor="#f1c18f"/><stop offset="1" stopColor="#9a5d3d"/></linearGradient><filter id={`${id}-s`}><feDropShadow dy="8" stdDeviation="7" floodOpacity=".23"/></filter></defs>
    <g filter={`url(#${id}-s)`}><path d="M106 116 97 69c-2-12 7-23 19-24l6-1c13-1 23 9 22 22l-5 50Z" fill={`url(#${id}-wood)`} stroke="#825038" strokeWidth="3"/><rect x="93" y="106" width="56" height="24" rx="8" fill="#c98c62" stroke="#825038" strokeWidth="3"/><ellipse cx="121" cy="126" rx="43" ry="13" fill="#7f4c38"/>
      <path d="M120 111c13-8 24 5 37 6 15 2 28 12 25 26-2 10 8 20 0 30-8 9-4 24-17 29-12 5-23 15-36 9-11-5-22 5-33-2-11-6-25-7-29-20-4-12-13-21-7-33 5-11 0-24 11-31 10-7 21-17 34-13Z" fill={`url(#${id}-wax)`} stroke="#c94282" strokeWidth="3"/>
      <circle cx="121" cy="163" r="36" fill="none" stroke="#ffd0e5" strokeWidth="2" opacity=".75"/>
      <path d="M120 185c-2-14 1-28 10-39m-10 24c-10-2-17-7-20-15m24 2c10-1 16-7 19-16m-15 7c-1-10-8-15-15-17-4 9-1 16 8 22m9-6c8 3 14 0 18-7-6-6-13-6-18 0" fill="none" stroke="#fff0f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </g><path d="m55 94 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#f7c35f"/><circle cx="193" cy="187" r="4" fill="#60a5fa"/>
  </svg>;
}

export function HeartBalloonBouquet({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><linearGradient id={`${id}-p`} x1="53" y1="35" x2="116" y2="131"><stop stopColor="#fbcfe8"/><stop offset="1" stopColor="#f472b6"/></linearGradient><linearGradient id={`${id}-b`} x1="129" y1="32" x2="191" y2="129"><stop stopColor="#dbeafe"/><stop offset="1" stopColor="#60a5fa"/></linearGradient><filter id={`${id}-s`}><feDropShadow dy="6" stdDeviation="5" floodColor="#6d5361" floodOpacity=".18"/></filter></defs>
    <g filter={`url(#${id}-s)`}><path d="M84 135C71 118 46 99 46 67c0-35 43-46 58-16 15-30 58-19 58 16 0 32-25 51-58 78Z" fill={`url(#${id}-p)`} stroke="#dd5f9e" strokeWidth="3" transform="translate(-13 -8) scale(.86)"/><path d="M84 135C71 118 46 99 46 67c0-35 43-46 58-16 15-30 58-19 58 16 0 32-25 51-58 78Z" fill={`url(#${id}-b)`} stroke="#4c92df" strokeWidth="3" transform="translate(70 -5) scale(.78)"/><path d="M84 135C71 118 46 99 46 67c0-35 43-46 58-16 15-30 58-19 58 16 0 32-25 51-58 78Z" fill="#ffd9a8" stroke="#e8ae61" strokeWidth="3" transform="translate(30 40) scale(.58)"/></g>
    <g fill="none" strokeLinecap="round"><path d="M76 113c11 38 38 48 47 105" stroke="#da77a6" strokeWidth="2"/><path d="M163 104c-5 43-34 66-40 114" stroke="#659fe0" strokeWidth="2"/><path d="M116 130c4 34 13 53 7 88" stroke="#d7a25b" strokeWidth="2"/><path d="M123 218c-14-12-22-5-16 4 6 8 18 3 27-4 13-10 21 4 10 10" stroke="#c7809f" strokeWidth="3"/></g>
    <g fill="#fff" opacity=".65"><ellipse cx="58" cy="51" rx="8" ry="13" transform="rotate(30 58 51)"/><ellipse cx="155" cy="49" rx="7" ry="12" transform="rotate(28 155 49)"/></g><path d="m201 89 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#f7c35f"/>
  </svg>;
}

export function MusicVinylWave({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><radialGradient id={`${id}-r`}><stop offset="0" stopColor="#fff"/><stop offset=".08" stopColor="#f472b6"/><stop offset=".2" stopColor="#2d2630"/><stop offset=".55" stopColor="#5c354b"/><stop offset="1" stopColor="#201b24"/></radialGradient><filter id={`${id}-s`}><feDropShadow dy="8" stdDeviation="7" floodOpacity=".25"/></filter></defs>
    <circle cx="116" cy="116" r="78" fill={`url(#${id}-r)`} filter={`url(#${id}-s)`}/><g fill="none" stroke="#f9a8d4" opacity=".38"><circle cx="116" cy="116" r="67"/><circle cx="116" cy="116" r="55"/><circle cx="116" cy="116" r="42"/></g><circle cx="116" cy="116" r="23" fill="#f472b6"/><circle cx="116" cy="116" r="6" fill="#fff"/>
    <path d="M116 80c-3-4-13-9-13-17 0-8 10-11 13-4 4-7 14-4 14 4 0 8-11 14-14 17Z" fill="#fff" opacity=".9"/>
    <g fill="none" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round"><path d="M39 188v-18M54 188v-31M69 188v-45M84 188v-25M99 188v-38M114 188v-20M129 188v-34M144 188v-48M159 188v-28M174 188v-40M189 188v-19"/></g><path d="M34 188h160" stroke="#f472b6" strokeWidth="3" strokeLinecap="round"/>
    <g fill="#f472b6"><path d="M190 48v28c-13-2-17 11-8 15 8 4 16-3 16-12V57l18-5v17c-13-2-17 11-8 15 8 4 16-3 16-12V39Z"/><path d="M43 75v20c-10-2-13 8-6 11 6 3 12-2 12-9V79l12-3v-8Z"/></g>
  </svg>;
}

export function CelestialSparks({ title, className = "h-40 w-40", ...props }: CozyIllustrationProps) {
  const id = useId();
  return <svg viewBox="0 0 240 240" className={className} {...a11y(title)} {...props}>
    {title && <title>{title}</title>}<defs><linearGradient id={`${id}-m`} x1="63" y1="55" x2="148" y2="166"><stop stopColor="#fff0ad"/><stop offset="1" stopColor="#f3bb50"/></linearGradient><linearGradient id={`${id}-p`} x1="130" y1="65" x2="195" y2="170"><stop stopColor="#fbcfe8"/><stop offset="1" stopColor="#f472b6"/></linearGradient><filter id={`${id}-s`} x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dy="5" stdDeviation="5" floodColor="#8b6270" floodOpacity=".2"/></filter></defs>
    <g filter={`url(#${id}-s)`}><path d="M127 38a68 68 0 1 0 57 105 79 79 0 0 1-57-105Z" fill={`url(#${id}-m)`} stroke="#e8b24c" strokeWidth="3"/><path d="m169 43 8 20 20 8-20 8-8 20-8-20-20-8 20-8Z" fill={`url(#${id}-p)`}/><path d="m197 121 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z" fill="#60a5fa"/><path d="m64 42 4 11 11 4-11 4-4 11-4-11-11-4 11-4Z" fill="#f472b6"/><path d="m57 163 6 16 16 6-16 6-6 16-6-16-16-6 16-6Z" fill="#f7c35f"/></g>
    <g fill="#f9a8d4"><circle cx="211" cy="74" r="4"/><circle cx="99" cy="202" r="5"/></g><g fill="#60a5fa"><circle cx="34" cy="109" r="5"/><circle cx="160" cy="201" r="3"/></g>
    <g fill="none" strokeLinecap="round"><path d="m32 144 11-2m-5 8 7 5M205 185l10 5m-13 2 3 9" stroke="#f472b6" strokeWidth="3"/><path d="m109 29 2-11m8 15 7-7" stroke="#60a5fa" strokeWidth="3"/></g>
  </svg>;
}

export const cozyCouplesIllustrations = {
  LoveLetterEnvelope,
  OpenScrapbook,
  PhotoboothFilmStrip,
  MilestoneCompass,
  AnniversaryCalendar,
  CozyCoupleMugs,
  WaxSealStamp,
  HeartBalloonBouquet,
  MusicVinylWave,
  CelestialSparks,
} as const;
