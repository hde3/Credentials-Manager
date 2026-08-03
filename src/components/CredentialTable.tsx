"use client";

import { useVault, Credential } from "@/context/VaultContext";
import React, { useState } from "react";
import { Copy, Trash2, Pencil, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { decryptPassword } from "@/lib/crypto";

/* ─── Single credential row ─── */
const CredentialRow = React.memo(({
  cred, index, isRevealed, toggleReveal, onEdit, onDelete,
}: {
  cred: Credential; index: number;
  isRevealed: boolean; toggleReveal: (id: string) => void;
  onEdit: (cred: Credential) => void;
  onDelete: (id: string, loginId: string) => void;
}) => {
  const decrypted = decryptPassword(cred.password);
  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="border-b border-white/15 dark:border-white/6 hover:bg-white/25 dark:hover:bg-white/5 transition-colors duration-150 group"
    >
      {/* # */}
      <td className="py-3.5 px-5 text-xs font-mono text-slate-400 dark:text-slate-500">{index + 1}</td>

      {/* Login ID */}
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
            {cred.login_id}
          </span>
          <button onClick={() => copy(cred.login_id)} className="btn-icon !w-6 !h-6 opacity-0 group-hover:opacity-100 transition-opacity" title="Copy ID">
            <Copy size={11} />
          </button>
        </div>
      </td>

      {/* Password */}
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-2">
          {/* Password pill */}
          <span className="glass rounded-xl px-3 py-1 text-xs font-mono tracking-widest text-slate-700 dark:text-slate-300">
            {isRevealed ? decrypted : "••••••••"}
          </span>
          {/* Password reveal */}
          <button
            type="button"
            aria-label="Toggle password"
            onClick={() => toggleReveal(cred.id)}
            className="btn-icon !w-7 !h-7"
            title={isRevealed ? "Hide password" : "Show password"}
          >
            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          {/* Copy */}
          <button onClick={() => copy(decrypted)} className="btn-icon !w-6 !h-6" title="Copy password">
            <Copy size={11} />
          </button>
        </div>
      </td>

      {/* Actions */}
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-1.5">
          <button onClick={() => onEdit(cred)} className="btn-icon !w-7 !h-7 hover:!text-blue-500" title="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(cred.id, cred.login_id)} className="btn-icon !w-7 !h-7 hover:!text-red-500" title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});
CredentialRow.displayName = "CredentialRow";

/* ─── Main table component ─── */
export default function CredentialTable() {
  const { currentCategory, vaultData, deleteCredential, editCredential } = useVault();
  const [revealed, setRevealed]       = useState<Set<string>>(new Set());
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [editLoginId, setEditLoginId] = useState("");
  const [editPassword, setEditPw]     = useState("");
  const [loading, setLoading]         = useState(false);

  const credentials = vaultData[currentCategory] || [];

  const toggleReveal = React.useCallback((id: string) => {
    setRevealed(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const handleDelete = React.useCallback((id: string, loginId: string) => {
    if (window.confirm(`Delete credential "${loginId}"?`)) deleteCredential(id);
  }, [deleteCredential]);

  const handleEdit = React.useCallback((cred: Credential) => {
    setEditingCred(cred);
    setEditLoginId(cred.login_id);
    setEditPw(decryptPassword(cred.password));
  }, []);

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCred) return;
    setLoading(true);
    try {
      await editCredential(editingCred.id, editLoginId, editPassword);
      setEditingCred(null);
    } catch { alert("Failed to edit credential"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <section className="glass rounded-[2rem] p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white mb-1">
              Saved {currentCategory} Credentials
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Everything stays tidy and easy to copy.</p>
          </div>
          <span className="glass rounded-full px-3.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {credentials.length} {credentials.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/20 dark:border-white/8 bg-white/18 dark:bg-black/15 backdrop-blur-sm">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-white/20 dark:border-white/8">
                <th className="py-3.5 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-12">#</th>
                <th className="py-3.5 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{currentCategory} ID</th>
                <th className="py-3.5 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Password</th>
                <th className="py-3.5 px-5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {credentials.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
                        <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No accounts yet</p>
                        <p className="text-xs">Add your first {currentCategory} credential above.</p>
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  credentials.map((cred, i) => (
                    <CredentialRow
                      key={cred.id}
                      cred={cred}
                      index={i}
                      isRevealed={revealed.has(cred.id)}
                      toggleReveal={toggleReveal}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Edit Modal (glass action sheet) ── */}
      <AnimatePresence>
        {editingCred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", background: "rgba(0,0,0,0.22)" }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="glass-heavy rounded-[2rem] w-full max-w-md p-7 relative"
            >
              <button
                onClick={() => setEditingCred(null)}
                className="btn-icon absolute top-5 right-5"
                aria-label="Close"
              >
                <X size={14} />
              </button>

              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">Edit Credential</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Update login ID or password.</p>

              <form onSubmit={submitEdit} className="flex flex-col gap-4 w-full">
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Login ID / Username</span>
                  <input
                    type="text" required
                    value={editLoginId}
                    onChange={e => setEditLoginId(e.target.value)}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</span>
                  <input
                    type="text" required
                    value={editPassword}
                    onChange={e => setEditPw(e.target.value)}
                    className="glass-input w-full rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white"
                  />
                </label>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCred(null)}
                    className="btn-glass flex-1 py-3 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-3 text-sm disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
