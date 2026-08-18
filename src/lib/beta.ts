/**
 * Pairfect Beta Mode Manager
 * Handles beta gates, invite codes, and tester whitelisting.
 */

export function isBetaModeEnabled(): boolean {
  const envVal = process.env.NEXT_PUBLIC_BETA_MODE;
  // Beta mode is active by default. Only disabled if explicitly set to "false", "0", or "no".
  if (envVal === "false" || envVal === "0" || envVal === "no" || envVal === "disabled") {
    return false;
  }
  return true;
}

export function getApprovedBetaCodes(): string[] {
  const codesEnv = process.env.NEXT_PUBLIC_BETA_CODE || "PAIRFECT2026,LOVESPACE,PAIRFECTBETA";
  return codesEnv
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

export function isValidBetaCode(inputCode?: string | null): boolean {
  if (!isBetaModeEnabled()) return true; // Beta mode disabled = all codes valid
  if (!inputCode) return false;

  const normalized = inputCode.trim().toUpperCase();
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
