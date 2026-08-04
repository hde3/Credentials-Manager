"use client";

import { useVault } from "@/context/VaultContext";
import { useState } from "react";
import { Eye, EyeOff, Plus } from "lucide-react";

export default function CredentialForm() {
  const { currentCategory, folders, addCredential } = useVault();
  const [loginId, setLoginId]     = useState("");
  const [password, setPassword]   = useState("");
  const [showPassword, setShow]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const folder = folders.find((f) => f.name === currentCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folder || !loginId || !password) return;
    setLoading(true);
    try {
      await addCredential(folder.id, loginId, password);
      setLoginId("");
      setPassword("");
    } catch (err: unknown) {
      alert("Error adding credential: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!folder) return null;

  return (
    <section className="glass rounded-xl p-5 sm:p-6 animate-rise">
      {/* ── Heading ── */}
      <div className="mb-5">
        <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>
          Add {currentCategory} credential
        </h2>
        <p className="text-[12.5px] mt-1" style={{ color: "var(--text-dim)" }}>
          Encrypted on this device before it is stored.
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        {/* Login ID */}
        <label className="flex flex-col gap-2 w-full min-w-0">
          <span className="field-label ml-0.5">{currentCategory} ID</span>
          <input
            type="text"
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="email or username"
            className="glass-input mono w-full px-3.5 py-2.5 text-[13px]"
          />
        </label>

        {/* Password */}
        <label className="flex flex-col gap-2 w-full min-w-0">
          <span className="field-label ml-0.5">Password</span>
          <div className="relative flex items-center w-full">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="glass-input mono w-full pl-3.5 pr-10 py-2.5 text-[13px]"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShow(!showPassword)}
              className="absolute right-2 btn-icon !w-6 !h-6"
            >
              {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full md:w-auto px-5 h-[38px] text-[13px]"
        >
          {loading ? (
            "Saving"
          ) : (
            <>
              <Plus size={14} />
              Add
            </>
          )}
        </button>
      </form>
    </section>
  );
}
