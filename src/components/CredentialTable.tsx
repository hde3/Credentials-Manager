"use client";

import { useVault } from "@/context/VaultContext";
import { useState } from "react";
import { Copy, Eye, EyeOff, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { decryptPassword } from "@/lib/crypto";

export default function CredentialTable() {
  const { currentCategory, vaultData, deleteCredential } = useVault();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const credentials = vaultData[currentCategory] || [];

  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealed);
    if (newRevealed.has(id)) {
      newRevealed.delete(id);
    } else {
      newRevealed.add(id);
    }
    setRevealed(newRevealed);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, trigger a toast here
  };

  return (
    <section className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Saved {currentCategory} Credentials</h2>
          <p className="text-sm text-slate-400">Everything stays tidy and easy to copy.</p>
        </div>
        <div className="px-3 py-1 bg-slate-800/50 rounded-full text-xs font-semibold text-slate-400 border border-slate-700">
          {credentials.length} entries
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-700/50 rounded-xl bg-slate-900/30">
        <table className="w-full text-left border-collapse min-w-[680px]">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="p-4 w-12">#</th>
              <th className="p-4">{currentCategory} ID</th>
              <th className="p-4">Password</th>
              <th className="p-4 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {credentials.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <td colSpan={4} className="p-8 text-center text-slate-400 text-sm">
                    No accounts yet. Add your first {currentCategory} credential to get started.
                  </td>
                </motion.tr>
              ) : (
                credentials.map((cred, index) => {
                  const isRevealed = revealed.has(cred.id);
                  const decryptedPw = decryptPassword(cred.password);
                  
                  return (
                    <motion.tr
                      key={cred.id}
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-slate-700/30 hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4 text-sm text-slate-500 font-mono">{index + 1}</td>
                      <td className="p-4 text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <span className="truncate max-w-[200px]">{cred.login_id}</span>
                          <button
                            onClick={() => handleCopy(cred.login_id)}
                            className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Copy ID"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400 bg-slate-900/50 px-2 py-1 rounded border border-slate-700 tracking-widest">
                            {isRevealed ? decryptedPw : "••••••••"}
                          </span>
                          <button
                            onClick={() => toggleReveal(cred.id)}
                            className="text-slate-500 hover:text-white transition-colors"
                            title="Toggle Visibility"
                          >
                            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => handleCopy(decryptedPw)}
                            className="text-slate-500 hover:text-blue-400 transition-colors"
                            title="Copy Password"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete credential ${cred.login_id}?`)) {
                                deleteCredential(cred.id);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </section>
  );
}
