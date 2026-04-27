"use client";

import { useVault } from "@/context/VaultContext";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function CredentialForm() {
  const { currentCategory, folders, addCredential } = useVault();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      const e = err as Error;
      alert("Error adding credential: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!folder) return null;

  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Add {currentCategory} Credential</h2>
        <p className="text-sm text-slate-400">Store and manage your credentials securely.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-300">{currentCategory} ID</span>
          <input
            type="text"
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder={`Enter ${currentCategory} username / email`}
            className="px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
          />
        </label>

        <label className="flex flex-col gap-1.5 relative">
          <span className="text-sm font-medium text-slate-300">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-900/50 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-[42px] px-6 bg-white hover:bg-slate-200 text-slate-900 font-semibold rounded-lg transition-colors text-sm disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Account"}
        </button>
      </form>
    </section>
  );
}
