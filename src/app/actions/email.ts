"use server";

import nodemailer from "nodemailer";
import { isAllowedEmail } from "@/lib/allowedEmails";

/**
 * Server Actions are publicly callable HTTP endpoints, so every check here
 * must be enforced server-side — never trust the caller.
 */

const COOLDOWN_MS = 60_000;
const lastSentAt = new Map<string, number>();

export async function sendPasswordEmail(toEmail?: string) {
  const recipient = toEmail?.trim().toLowerCase();

  // 1. Authorisation — enforced on the server, not just in the browser.
  if (!isAllowedEmail(recipient)) {
    return { success: false, error: "Access denied: this email is not authorised." };
  }

  // 2. Basic throttling so the endpoint can't be used to mail-bomb.
  const now = Date.now();
  const previous = lastSentAt.get(recipient!) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - previous)) / 1000);
    return { success: false, error: `Please wait ${wait}s before requesting another email.` };
  }

  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const masterEmail = process.env.MASTER_EMAIL;
    const masterPassword = process.env.MASTER_PASSWORD;

    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials are not configured in environment variables.");
      return { success: false, error: "Email service is not configured." };
    }

    if (!masterEmail || !masterPassword) {
      console.error("MASTER_EMAIL / MASTER_PASSWORD are not configured in environment variables.");
      return { success: false, error: "Recovery is not configured." };
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const htmlContent = `
      <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
        <h2 style="color: #60a5fa; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 24px;">Credentials Vault - Secure Recovery</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">You requested your master password for the Credentials Manager app. Please keep this secure.</p>

        <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #94a3b8;">User ID:</p>
          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #e2e8f0;">${masterEmail}</p>
        </div>

        <div style="background-color: #111111; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin-bottom: 32px; text-align: center; box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);">
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #94a3b8;">Master Password:</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #60a5fa; letter-spacing: 1px;">${masterPassword}</p>
        </div>

        <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 12px; color: #64748b; text-align: center;">
          <p style="margin: 0;">⚠️ Security Warning</p>
          <p style="margin: 8px 0 0 0;">Do not share this password with anyone. If you didn't request this email, please secure your account immediately.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Credentials Manager" <${smtpUser}>`,
      // Only ever send to the allow-listed address that actually asked for it.
      to: recipient,
      subject: "Secure Access: Your Credentials Manager Password",
      html: htmlContent,
    });

    lastSentAt.set(recipient!, Date.now());

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: "Failed to send email" };
  }
}
