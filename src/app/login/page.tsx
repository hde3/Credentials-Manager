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
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<"standard" | "otp-email" | "otp-code">("standard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (email !== "manag00400@gmail.com" || password !== "#Credentials98329") {
      setError("Unauthorized. Invalid credentials.");
      setLoading(false);
      return;
    }

    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      // Auto-signup for personal use if account doesn't exist yet
      if (signInError && signInError.message.includes("Invalid login")) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
      } else if (signInError) {
        throw signInError;
      }

      router.push("/");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      setError("Access Denied: This email is not authorized");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setLoginMode("otp-code");
      setMessage("OTP sent to your email.");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "email" });
      if (error) throw error;
      router.push("/");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError("");
    setMessage("Sending...");
    
    try {
      const result = await sendPasswordEmail();
      if (result.success) {
        setMessage("Check your email!");
      } else {
        setError("Failed to send email.");
        setMessage("");
      }
    } catch (err) {
      setError("An error occurred while sending email.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-[#0a0f1c] text-slate-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel relative overflow-hidden bg-slate-900/60 border border-slate-800 shadow-2xl max-w-md w-full p-8 rounded-3xl flex flex-col gap-6"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="flex flex-col items-center text-center gap-2 relative z-10">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Lock size={28} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Credentials Vault</h1>
          <p className="text-sm text-slate-400">
            Secure your digital life
          </p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center relative z-10">
            {error}
          </motion.div>
        )}
        {message && !error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-sm text-center relative z-10">
            {message}
          </motion.div>
        )}

        <div className="relative z-10 h-[280px]">
          <AnimatePresence mode="wait" custom={1}>
            {loginMode === "standard" && (
              <motion.form
                key="standard"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleStandardLogin}
                className="flex flex-col gap-4 h-full"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300 ml-1">Email</span>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300 ml-1">Password</span>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center"
                >
                  {loading && <Spinner />}
                  {loading ? "Authenticating..." : "Sign In"}
                </button>

                <div className="flex justify-between items-center mt-auto pt-2">
                  <button type="button" onClick={() => setLoginMode("otp-email")} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Login with OTP instead
                  </button>
                  <button type="button" onClick={handleForgotPassword} disabled={loading} className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
                    Forgot Password?
                  </button>
                </div>
              </motion.form>
            )}

            {loginMode === "otp-email" && (
              <motion.form
                key="otp-email"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleSendOTP}
                className="flex flex-col gap-4 h-full"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300 ml-1">Email for OTP</span>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center"
                >
                  {loading && <Spinner />}
                  {loading ? "Sending..." : "Send OTP"}
                </button>

                <div className="mt-auto pt-2">
                  <button type="button" onClick={() => setLoginMode("standard")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to Password Login
                  </button>
                </div>
              </motion.form>
            )}

            {loginMode === "otp-code" && (
              <motion.form
                key="otp-code"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                onSubmit={handleVerifyOTP}
                className="flex flex-col gap-4 h-full"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300 ml-1">Enter 6-digit Code</span>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 text-center tracking-[0.5em] text-lg rounded-xl bg-slate-950/50 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="mt-2 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-green-500/25 flex items-center justify-center"
                >
                  {loading && <Spinner />}
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>

                <div className="mt-auto pt-2">
                  <button type="button" onClick={() => setLoginMode("otp-email")} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Change Email
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
