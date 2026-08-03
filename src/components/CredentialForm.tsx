"use client";

import { useVault } from "@/context/VaultContext";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
    <section className="glass rounded-[2rem] p-6 md:p-8">
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white mb-1">
          Add {currentCategory} Credential
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Store and manage your credentials securely.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        {/* Login ID */}
        <label className="flex flex-col gap-1.5 w-full">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
            {currentCategory} ID
          </span>
          <input
            type="text"
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder={`Enter ${currentCategory} email / username`}
            className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </label>

        {/* Password */}
        <label className="flex flex-col gap-1.5 w-full">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</span>
          <div className="relative flex items-center w-full">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="glass-input w-full rounded-2xl pl-4 pr-12 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShow(!showPassword)}
              className="absolute right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary px-7 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed h-[46px]"
        >
          {loading ? "Adding…" : "Add Account"}
        </button>
      </form>
    </section>
  );
}
