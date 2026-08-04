"use server";

import nodemailer from "nodemailer";
import { isAllowedEmail, VAULT_ACCOUNT_EMAIL } from "@/lib/allowedEmails";

/**
 * ── Custom OTP system ──────────────────────────────────────────────────
 * Supabase OTP is email-specific: it authenticates the email it's sent to.
 * If we send a Supabase OTP to agarg1473@gmail.com, verifying it logs
 * into *that* account — NOT the shared vault account (manag00400@gmail.com).
 *
 * To let users receive codes on their personal emails while still always
 * landing in the vault account, we roll our own lightweight OTP:
 *
 *   1. sendCustomOTP  → generates a 6-digit code, emails it, stores it.
 *   2. verifyCustomOTP → checks the code. On success the client-side
 *      signs in with signInWithPassword(VAULT_ACCOUNT_EMAIL, masterPwd).
 *
 * The master password is returned ONLY after a valid OTP check, and only
 * to the server action caller — it never appears in any email or HTML.
 */

// ── In-memory code store (survives across requests within the same process) ──
type PendingOTP = { code: string; email: string; expiresAt: number };
const otpStore = new Map<string, PendingOTP>();

const OTP_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes
const COOLDOWN_MS = 30_000; // 30 seconds between sends
const lastSentAt = new Map<string, number>();

function generateCode(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

/**
 * Send a 6-digit OTP code to one of the allowed email addresses.
 * The code is valid for 5 minutes.
 */
export async function sendCustomOTP(toEmail?: string) {
  const recipient = toEmail?.trim().toLowerCase();

  if (!recipient) {
    return { success: false, error: "Please select an email." };
  }

  if (!isAllowedEmail(recipient)) {
    return { success: false, error: "Access denied: this email is not authorised." };
  }

  // Don't let the vault email receive OTP — it IS the vault, not a personal inbox
  if (recipient === VAULT_ACCOUNT_EMAIL) {
    return { success: false, error: "Send the code to one of your personal emails instead." };
  }

  // Throttle
  const now = Date.now();
  const prev = lastSentAt.get(recipient) ?? 0;
  if (now - prev < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - prev)) / 1000);
    return { success: false, error: `Please wait ${wait}s before requesting another code.` };
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error("SMTP credentials missing.");
    return { success: false, error: "Email service is not configured." };
  }

  const code = generateCode();
  const key = recipient; // one active code per email

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const htmlContent = `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px; border-radius: 12px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
        <h2 style="color: #60a5fa; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 24px;">Credentials Vault – Login Code</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Use the code below to unlock the vault. It expires in 5 minutes.</p>
        <div style="background-color: #111; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: center; box-shadow: 0 0 15px rgba(59,130,246,0.2);">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8;">Your one-time code</p>
          <p style="margin: 0; font-size: 36px; font-weight: 700; color: #60a5fa; letter-spacing: 8px;">${code}</p>
        </div>
        <div style="border-top: 1px solid #1e293b; padding-top: 16px; font-size: 12px; color: #64748b; text-align: center;">
          <p style="margin: 0;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Credentials Manager" <${smtpUser}>`,
      to: recipient,
      subject: "Your Vault Login Code",
      html: htmlContent,
    });

    otpStore.set(key, {
      code,
      email: recipient,
      expiresAt: Date.now() + OTP_LIFETIME_MS,
    });
    lastSentAt.set(recipient, Date.now());

    return { success: true };
  } catch (err) {
    console.error("OTP send error:", err);
    return { success: false, error: "Failed to send the code." };
  }
}

/**
 * Verify the 6-digit code the user entered.
 * On success, returns the vault account's password so the client can
 * call signInWithPassword() to get a real Supabase session.
 */
export async function verifyCustomOTP(email?: string, code?: string) {
  const recipient = email?.trim().toLowerCase();
  const token = code?.trim();

  if (!recipient || !token) {
    return { success: false, error: "Email and code are required." };
  }

  if (!isAllowedEmail(recipient)) {
    return { success: false, error: "Access denied." };
  }

  const pending = otpStore.get(recipient);

  if (!pending) {
    return { success: false, error: "No code was sent to this email. Send a new one." };
  }

  if (Date.now() > pending.expiresAt) {
    otpStore.delete(recipient);
    return { success: false, error: "Code expired. Send a new one." };
  }

  if (pending.code !== token) {
    return { success: false, error: "Invalid code." };
  }

  // Code is valid — burn it
  otpStore.delete(recipient);

  // Return the vault password so the client can sign in as the vault account
  const masterPassword = process.env.MASTER_PASSWORD;
  if (!masterPassword) {
    console.error("MASTER_PASSWORD env var is not set.");
    return { success: false, error: "Vault recovery is not configured." };
  }

  return { success: true, vaultPassword: masterPassword };
}
