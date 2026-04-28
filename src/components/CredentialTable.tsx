"use client";

import { useVault, Credential } from "@/context/VaultContext";
import React, { useState } from "react";
import { Copy, Eye, EyeOff, Trash2, Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { decryptPassword } from "@/lib/crypto";

const MemoizedCredentialRow = React.memo(({ 
  cred, 
  index, 
  isRevealed, 
  toggleReveal, 
  onEdit, 
  onDelete 
}: { 
  cred: Credential; 
  index: number; 
  isRevealed: boolean; 
  toggleReveal: (id: string) => void;
  onEdit: (cred: Credential) => void;
  onDelete: (id: string, loginId: string) => void;
}) => {
  const decryptedPw = decryptPassword(cred.password);
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
            onClick={() => onEdit(cred)}
            className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onDelete(cred.id, cred.login_id)}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});

MemoizedCredentialRow.displayName = "MemoizedCredentialRow";

export default function CredentialTable() {
  const { currentCategory, vaultData, deleteCredential, editCredential } = useVault();
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [editLoginId, setEditLoginId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const credentials = vaultData[currentCategory] || [];

  const toggleReveal = React.useCallback((id: string) => {
    setRevealed(prev => {
      const newRevealed = new Set(prev);
      if (newRevealed.has(id)) newRevealed.delete(id);
      else newRevealed.add(id);
      return newRevealed;
    });
  }, []);

  const handleDelete = React.useCallback((id: string, loginId: string) => {
    if (window.confirm(`Delete credential ${loginId}?`)) {
      deleteCredential(id);
    }
  }, [deleteCredential]);

  const handleEdit = React.useCallback((cred: Credential) => {
    setEditingCred(cred);
    setEditLoginId(cred.login_id);
    setEditPassword(decryptPassword(cred.password));
  }, []);

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCred) return;
    setLoading(true);
    try {
      await editCredential(editingCred.id, editLoginId, editPassword);
      setEditingCred(null);
    } catch (err) {
      alert("Failed to edit credential");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                  credentials.map((cred, index) => (
                    <MemoizedCredentialRow
                      key={cred.id}
                      cred={cred}
                      index={index}
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

      {/* Edit Modal */}
      <AnimatePresence>
        {editingCred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="glass-panel w-full max-w-md p-6 rounded-2xl relative"
            >
              <button 
                onClick={() => setEditingCred(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-semibold mb-6">Edit Credential</h3>
              
              <form onSubmit={submitEdit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300">Login ID / Username</span>
                  <input
                    type="text"
                    value={editLoginId}
                    onChange={e => setEditLoginId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-colors"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-slate-300">Password</span>
                  <input
                    type="text"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700 focus:border-blue-500 outline-none transition-colors"
                  />
                </label>
                
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCred(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium"
                  >
                    {loading ? "Saving..." : "Save Changes"}
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
