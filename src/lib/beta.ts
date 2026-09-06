/**
 * Pairfect Beta Mode Manager
 * Handles beta gates, invite codes, and tester whitelisting.
 */

export function isBetaModeEnabled(): boolean {
  // Public Launch: Beta mode disabled. Pairfect is open to all couples.
  return false;
}

export function getApprovedBetaCodes(): string[] {
  const defaultCodes = "PAIRFECT2026,LOVESPACE,PAIRFECTBETA,PAIRFECT,PAIRFECTVIP,EARLYBIRD,FOREVER,SANCTUARY,COUPLES2026";
  const codesEnv = process.env.NEXT_PUBLIC_BETA_CODE
    ? `${process.env.NEXT_PUBLIC_BETA_CODE},${defaultCodes}`
    : defaultCodes;
  return codesEnv
    .split(",")
    .map((c) => c.trim().toUpperCase().replace(/[\s\-_]/g, ""))
    .filter(Boolean);
}

export function isValidBetaCode(inputCode?: string | null): boolean {
  if (!isBetaModeEnabled()) return true; // Beta mode disabled = all codes valid
  if (!inputCode) return false;

  const normalized = inputCode.trim().toUpperCase().replace(/[\s\-_]/g, "");
  const approvedCodes = getApprovedBetaCodes();
  return approvedCodes.includes(normalized);
}

export function isEmailWhitelisted(email?: string | null): boolean {
  if (!isBetaModeEnabled()) return true;
  if (!email) return false;

  const allowedEmailsEnv =
    process.env.NEXT_PUBLIC_BETA_EMAILS || process.env.BETA_ALLOWED_EMAILS || "";
  const allowedList = allowedEmailsEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedList.length === 0) return false;
  return allowedList.includes(email.trim().toLowerCase());
}
