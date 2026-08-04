/**
 * ── Single vault account ──────────────────────────────────────────────
 * Every credential row in Supabase is scoped to a `user_id`. If different
 * people sign in with different emails, each gets a DIFFERENT Supabase
 * user and therefore a DIFFERENT (empty) vault.
 *
 * To make sure everyone always lands in the SAME vault, all login paths
 * (password AND one-time code) are locked to this one account.
 *
 * Override with NEXT_PUBLIC_VAULT_EMAIL if the master account ever changes.
 * This is only an email address, not a secret.
 */
export const VAULT_ACCOUNT_EMAIL = (
  process.env.NEXT_PUBLIC_VAULT_EMAIL || "manag00400@gmail.com"
)
  .trim()
  .toLowerCase();

/** True only for the one shared vault account. Used to gate sign-in. */
export function isVaultAccount(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === VAULT_ACCOUNT_EMAIL;
}

/**
 * ── Recovery allowlist ───────────────────────────────────────────────
 * People permitted to have the master password emailed to their OWN inbox.
 * They then use that password to sign into VAULT_ACCOUNT_EMAIL above.
 *
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
