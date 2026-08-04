"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import { sendPasswordEmail } from "@/app/actions/email";
import { isAllowedEmail } from "@/lib/allowedEmails";

const Spinner = () => (
  <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const slide = {
  enter:  { x: 24, opacity: 0 },
  center: { x: 0,  opacity: 1 },
  exit:   { x: -24, opacity: 0 },
};

export default function LoginPage() {
  const [mode, setMode]         = useState<"standard" | "otp-email" | "otp-code">("standard");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [message, setMessage]   = useState("");
  const router = useRouter();

  const reset = () => { setError(""); setMessage(""); };

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();

    // UX-level check only — real enforcement is Supabase auth + RLS.
    if (!isAllowedEmail(email)) {
      setError("Access Denied: this email is not authorized.");
      setLoading(false); return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/");
    } catch (err: unknown) {
      setError((err as Error).message || "Invalid credentials.");
    } finally { setLoading(false); }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    if (!isAllowedEmail(email)) {
      setError("Access Denied: this email is not authorized.");
      setLoading(false); return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setMode("otp-code");
      setMessage("OTP sent to your email.");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to send OTP.");
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "email" });
      if (error) throw error;
      router.push("/");
    } catch (err: unknown) {
      setError((err as Error).message || "Invalid OTP code.");
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email in the email field first.");
      return;
    }
    if (!isAllowedEmail(email)) {
      setError("Access Denied: this email is not authorized.");
      return;
    }
    setLoading(true); reset(); setMessage("Sending…");
    try {
      const result = await sendPasswordEmail(email);
      if (result.success) {
        setMessage("Check your email!");
      } else {
        setMessage("");
        setError(result.error || "Failed to send email.");
      }
    } catch {
      setMessage("");
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-5 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        {/* ── Mark ── */}
        <div className="flex flex-col items-center text-center gap-3.5 mb-8">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center p-2"
            style={{ background: "var(--sunken)", border: "1px solid var(--line)" }}
          >
            <Image
              src="/logo_2.png"
              alt="Credentials Vault Logo"
              width={44}
              height={44}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-[21px] font-semibold tracking-tight leading-none" style={{ color: "var(--text)" }}>
              Credentials Vault
            </h1>
            <p className="mono text-[10.5px] uppercase tracking-[0.14em] mt-2.5" style={{ color: "var(--text-faint)" }}>
              Restricted Access
            </p>
          </div>
        </div>

        {/* ── Card ── */}
        <div className="glass-heavy rounded-2xl p-6">
          {/* Segmented control */}
          <div
            className="flex p-0.5 rounded-[11px] mb-6"
            style={{ background: "var(--sunken)", border: "1px solid var(--line)" }}
          >
            {([
              { key: "standard",  label: "Password" },
              { key: "otp-email", label: "Email code" },
            ] as const).map((tab) => {
              const active = tab.key === "standard" ? mode === "standard" : mode !== "standard";
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { reset(); setMode(tab.key); }}
                  className="relative flex-1 py-1.5 text-[12.5px] font-medium rounded-[9px] transition-colors"
                  style={{ color: active ? "var(--text)" : "var(--text-faint)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="login-tab"
                      transition={{ type: "spring", stiffness: 460, damping: 36 }}
                      className="absolute inset-0 rounded-[9px]"
                      style={{ background: "var(--surface-solid)", border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)" }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Alerts */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 mb-5 text-[12.5px] leading-snug"
                  style={{ color: "var(--danger)", background: "var(--danger-soft)", border: "1px solid var(--danger-line)" }}
                >
                  <AlertCircle size={14} className="mt-px shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
            {message && !error && (
              <motion.div
                key="msg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 mb-5 text-[12.5px] leading-snug"
                  style={{ color: "var(--success)", background: "var(--success-soft)", border: "1px solid var(--line)" }}
                >
                  <CheckCircle2 size={14} className="mt-px shrink-0" />
                  <span>{message}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forms */}
          <div className="min-h-[236px]">
            <AnimatePresence mode="wait">
              {/* ── Password login ── */}
              {mode === "standard" && (
                <motion.form
                  key="std"
                  variants={slide} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleStandardLogin}
                  className="flex flex-col gap-4"
                >
                  <label className="flex flex-col gap-2">
                    <span className="field-label ml-0.5">Email</span>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                      <input
                        type="email" required autoComplete="email"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="glass-input w-full pl-9 pr-3.5 py-2.5 text-[13.5px]"
                      />
                    </div>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="field-label ml-0.5">Master password</span>
                    <div className="relative">
                      <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                      <input
                        type="password" required autoComplete="current-password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••"
                        className="glass-input w-full pl-9 pr-3.5 py-2.5 text-[13.5px]"
                      />
                    </div>
                  </label>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-[13.5px] mt-1">
                    {loading && <Spinner />}
                    {loading ? "Authenticating" : "Unlock vault"}
                  </button>

                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => { reset(); setMode("otp-email"); }}
                      className="text-[12.5px] font-medium transition-opacity hover:opacity-70"
                      style={{ color: "var(--accent)" }}
                    >
                      Use one-time code
                    </button>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-[12.5px] transition-opacity hover:opacity-70 disabled:opacity-40"
                      style={{ color: "var(--text-faint)" }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── OTP: email ── */}
              {mode === "otp-email" && (
                <motion.form
                  key="otp-e"
                  variants={slide} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleSendOTP}
                  className="flex flex-col gap-4"
                >
                  <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
                    We&apos;ll email you a six-digit code. No password needed.
                  </p>

                  <label className="flex flex-col gap-2">
                    <span className="field-label ml-0.5">Email</span>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-faint)" }} />
                      <input
                        type="email" required autoComplete="email"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="glass-input w-full pl-9 pr-3.5 py-2.5 text-[13.5px]"
                      />
                    </div>
                  </label>

                  <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-[13.5px] mt-1">
                    {loading && <Spinner />}
                    {loading ? "Sending" : "Send code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { reset(); setMode("standard"); }}
                    className="flex items-center gap-1.5 text-[12.5px] transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <ArrowLeft size={13} /> Back to password login
                  </button>
                </motion.form>
              )}

              {/* ── OTP: code ── */}
              {mode === "otp-code" && (
                <motion.form
                  key="otp-c"
                  variants={slide} initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  onSubmit={handleVerifyOTP}
                  className="flex flex-col gap-4"
                >
                  <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
                    Code sent to <span className="mono" style={{ color: "var(--text)" }}>{email}</span>
                  </p>

                  <label className="flex flex-col gap-2">
                    <span className="field-label ml-0.5">Verification code</span>
                    <input
                      type="text" required maxLength={6} inputMode="numeric" autoComplete="one-time-code"
                      value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="000000"
                      className="glass-input mono w-full px-4 py-3 text-center text-lg tracking-[0.5em]"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 6}
                    className="btn-primary w-full py-2.5 text-[13.5px] mt-1"
                  >
                    {loading && <Spinner />}
                    {loading ? "Verifying" : "Verify & enter"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { reset(); setMode("otp-email"); }}
                    className="flex items-center gap-1.5 text-[12.5px] transition-opacity hover:opacity-70"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <ArrowLeft size={13} /> Change email
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="mono text-center text-[10px] uppercase tracking-[0.13em] mt-6" style={{ color: "var(--text-faint)" }}>
          AES encrypted · approved accounts only
        </p>
      </motion.div>
    </div>
  );
}
