"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { sendPasswordEmail } from "@/app/actions/email";

const ALLOWED_EMAILS = ['manag00400@gmail.com', 'agarg1473@gmail.com', 'happypandey2387@gmail.com'];

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

const slide = {
  enter:  { x: 40, opacity: 0 },
  center: { x: 0,  opacity: 1 },
  exit:   { x: -40, opacity: 0 },
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
    if (email !== "manag00400@gmail.com" || password !== "#Credentials98329") {
      setError("Unauthorized. Invalid credentials.");
      setLoading(false); return;
    }
    try {
      const { error: err1 } = await supabase.auth.signInWithPassword({ email, password });
      if (err1?.message.includes("Invalid login")) {
        const { error: err2 } = await supabase.auth.signUp({ email, password });
        if (err2) throw err2;
      } else if (err1) throw err1;
      router.push("/");
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred.");
    } finally { setLoading(false); }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); reset();
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
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
    setLoading(true); reset(); setMessage("Sending…");
    try {
      const result = await sendPasswordEmail();
      result.success ? setMessage("Check your email!") : setError("Failed to send email.");
    } catch { setError("An error occurred."); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.26, 0.64, 1] }}
        className="glass-heavy rounded-[2.5rem] w-full max-w-[400px] p-8 flex flex-col gap-6 relative overflow-hidden"
      >
        {/* Inner top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-400/15 dark:bg-blue-500/12 blur-3xl rounded-full pointer-events-none" />

        {/* Icon + title */}
        <div className="flex flex-col items-center text-center gap-2 relative z-10">
          <div className="btn-icon-primary w-14 h-14 mb-1 shadow-[0_6px_24px_rgba(0,112,235,0.4)]">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Credentials Vault</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Secure your digital life</p>
        </div>

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div key="err" initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
              className="glass rounded-2xl px-4 py-3 text-sm text-red-600 dark:text-red-400 text-center border border-red-300/30 bg-red-50/30 dark:bg-red-900/15 relative z-10">
              {error}
            </motion.div>
          )}
          {message && !error && (
            <motion.div key="msg" initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
              className="glass rounded-2xl px-4 py-3 text-sm text-blue-600 dark:text-blue-400 text-center border border-blue-300/30 bg-blue-50/30 dark:bg-blue-900/15 relative z-10">
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forms */}
        <div className="relative z-10 h-[270px]">
          <AnimatePresence mode="wait">
            {/* Standard login */}
            {mode === "standard" && (
              <motion.form key="std" variants={slide} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28 }} onSubmit={handleStandardLogin} className="flex flex-col gap-4 h-full">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email</span>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-slate-800 dark:text-white" />
                  </div>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</span>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-slate-800 dark:text-white" />
                  </div>
                </label>
                <button type="submit" disabled={loading}
                  className="btn-primary py-3 text-sm flex items-center justify-center mt-1 disabled:opacity-50">
                  {loading && <Spinner />}{loading ? "Authenticating…" : "Sign In"}
                </button>
                <div className="flex justify-between items-center mt-auto pt-1">
                  <button type="button" onClick={() => { reset(); setMode("otp-email"); }}
                    className="text-sm text-[#0070eb] hover:opacity-75 transition-opacity font-medium">
                    Login with OTP
                  </button>
                  <button type="button" onClick={handleForgotPassword} disabled={loading}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                    Forgot Password?
                  </button>
                </div>
              </motion.form>
            )}

            {/* OTP email */}
            {mode === "otp-email" && (
              <motion.form key="otp-e" variants={slide} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28 }} onSubmit={handleSendOTP} className="flex flex-col gap-4 h-full">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email for OTP</span>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={email} onChange={e=>setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-2xl text-sm text-slate-800 dark:text-white" />
                  </div>
                </label>
                <button type="submit" disabled={loading}
                  className="btn-primary py-3 text-sm flex items-center justify-center mt-1 disabled:opacity-50">
                  {loading && <Spinner />}{loading ? "Sending…" : "Send OTP"}
                </button>
                <div className="mt-auto pt-1">
                  <button type="button" onClick={() => { reset(); setMode("standard"); }}
                    className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Back to Password Login
                  </button>
                </div>
              </motion.form>
            )}

            {/* OTP code */}
            {mode === "otp-code" && (
              <motion.form key="otp-c" variants={slide} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.28 }} onSubmit={handleVerifyOTP} className="flex flex-col gap-4 h-full">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">6-digit Code</span>
                  <input type="text" required maxLength={6} value={otpCode}
                    onChange={e=>setOtpCode(e.target.value)}
                    placeholder="••••••"
                    className="glass-input w-full px-4 py-3 rounded-2xl text-sm text-center tracking-[0.5em] text-lg text-slate-800 dark:text-white" />
                </label>
                <button type="submit" disabled={loading || otpCode.length < 6}
                  className="btn-primary py-3 text-sm flex items-center justify-center mt-1 disabled:opacity-50"
                  style={{ background: loading || otpCode.length < 6 ? undefined : "#34c759",
                           boxShadow: "0 4px 20px rgba(52,199,89,0.4)" }}>
                  {loading && <Spinner />}{loading ? "Verifying…" : "Verify OTP"}
                </button>
                <div className="mt-auto pt-1">
                  <button type="button" onClick={() => { reset(); setMode("otp-email"); }}
                    className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Change Email
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
