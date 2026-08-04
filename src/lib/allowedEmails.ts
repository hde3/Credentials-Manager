/**
 * Single source of truth for the vault's email allowlist.
 * Imported by both client components and server actions so the two
 * can never drift apart.
 */
export const ALLOWED_EMAILS = [
  "manag00400@gmail.com",
  "agarg1473@gmail.com",
  "happypandey2387@gmail.com",
] as const;

export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  return (ALLOWED_EMAILS as readonly string[]).includes(email.trim().toLowerCase());
}
