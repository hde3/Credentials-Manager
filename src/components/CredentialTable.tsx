"use client";

import { useVault, Credential } from "@/context/VaultContext";
import React, { useState } from "react";
import { Copy, Trash2, Pencil, X, Eye, EyeOff, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { decryptPassword } from "@/lib/crypto";

/* ─── Copy button with transient tick ─── */
function CopyButton({
  value, title, className = "",
}: { value: string; title: string; className?: string }) {
  const [done, setDone] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setDone(true);
    setTimeout(() => setDone(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-icon !w-6 !h-6 ${className}`}
      title={done ? "Copied" : title}
      aria-label={title}
      style={done ? { color: "var(--success)" } : undefined}
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

/* ─── Desktop row ─── */
const CredentialRow = React.memo(({
  cred, index, isRevealed, toggleReveal, onEdit, onDelete,
}: {
  cred: Credential; index: number;
  isRevealed: boolean; toggleReveal: (id: string) => void;
  onEdit: (cred: Credential) => void;
  onDelete: (id: string, loginId: string) => void;
}) => {
  const decrypted = decryptPassword(cred.password);

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="vault-row group"
    >
      {/* # */}
      <td className="mono text-[11px] tabular-nums" style={{ color: "var(--text-faint)" }}>
        {String(index + 1).padStart(2, "0")}
      </td>

      {/* Login ID */}
      <td>
        <div className="flex items-center gap-1.5">
          <span className="mono text-[12.5px] truncate max-w-[240px]" style={{ color: "var(--text)" }}>
            {cred.login_id}
          </span>
          <CopyButton
            value={cred.login_id}
            title="Copy ID"
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          />
        </div>
      </td>

      {/* Password */}
      <td>
        <div className="flex items-center gap-1.5">
          <span className="secret-pill">{isRevealed ? decrypted : "••••••••••"}</span>
          <button
            type="button"
            aria-label="Toggle password"
            onClick={() => toggleReveal(cred.id)}
            className="btn-icon !w-6 !h-6"
            title={isRevealed ? "Hide password" : "Show password"}
          >
            {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
          </button>
          <CopyButton value={decrypted} title="Copy password" />
        </div>
      </td>

      {/* Actions */}
      <td>
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={() => onEdit(cred)}
            className="btn-icon !w-6 !h-6"
            title="Edit"
            aria-label="Edit credential"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => onDelete(cred.id, cred.login_id)}
            className="btn-icon !w-6 !h-6 hover:!text-red-500"
            title="Delete"
            aria-label="Delete credential"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
});
CredentialRow.displayName = "CredentialRow";

/* ─── Mobile card (no horizontal scroll) ─── */
const CredentialCard = React.memo(({
  cred, index, isRevealed, toggleReveal, onEdit, onDelete,
}: {
  cred: Credential; index: number;
  isRevealed: boolean; toggleReveal: (id: string) => void;
  onEdit: (cred: Credential) => void;
  onDelete: (id: string, loginId: string) => void;
}) => {
  const decrypted = decryptPassword(cred.password);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="rounded-[10px] p-3"
      style={{ border: "1px solid var(--line)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0 flex-1">
          <p className="mono text-[9.5px] mb-1" style={{ color: "var(--text-faint)" }}>
            {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mono text-[12.5px] break-all leading-snug" style={{ color: "var(--text)" }}>
            {cred.login_id}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CopyButton value={cred.login_id} title="Copy ID" />
          <button
            onClick={() => onEdit(cred)}
            className="btn-icon !w-6 !h-6"
            title="Edit"
            aria-label="Edit credential"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={() => onDelete(cred.id, cred.login_id)}
            className="btn-icon !w-6 !h-6 hover:!text-red-500"
            title="Delete"
            aria-label="Delete credential"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="secret-pill flex-1 min-w-0 truncate">
          {isRevealed ? decrypted : "••••••••••"}
        </span>
        <button
          type="button"
          aria-label="Toggle password"
          onClick={() => toggleReveal(cred.id)}
          className="btn-icon !w-6 !h-6"
          title={isRevealed ? "Hide password" : "Show password"}
        >
          {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>
        <CopyButton value={decrypted} title="Copy password" />
      </div>
    </motion.li>
  );
});
CredentialCard.displayName = "CredentialCard";

/* ─── Empty state ─── */
function EmptyState({ category }: { category: string }) {
  return (
    <div className="py-12 px-6 text-center">
      <p className="mono text-[10.5px] uppercase tracking-[0.13em]" style={{ color: "var(--text-faint)" }}>
        Empty
      </p>
      <p className="text-[12.5px] mt-2.5" style={{ color: "var(--text-dim)" }}>
        Add your first {category} credential using the form above.
      </p>
    </div>
  );
}

/* ─── Main component ─── */
export default function CredentialTable() {
  const { currentCategory, vaultData, deleteCredential, editCredential } = useVault();
  const [revealed, setRevealed]       = useState<Set<string>>(new Set());
  const [editingCred, setEditingCred] = useState<Credential | null>(null);
  const [editLoginId, setEditLoginId] = useState("");
  const [editPassword, setEditPw]     = useState("");
  const [showEditPw, setShowEditPw]   = useState(false);
  const [loading, setLoading]         = useState(false);

  const credentials = vaultData[currentCategory] || [];

  const toggleReveal = React.useCallback((id: string) => {
    setRevealed(prev => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
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
    setShowEditPw(false);
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
      <section className="glass rounded-xl p-5 sm:p-6 animate-rise">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              Saved in {currentCategory}
            </h2>
            <p className="text-[12.5px] mt-1" style={{ color: "var(--text-dim)" }}>
              Reveal with the eye, or copy straight to clipboard.
            </p>
          </div>
          <span className="chip shrink-0">
            {credentials.length} {credentials.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block rounded-[10px] overflow-hidden" style={{ border: "1px solid var(--line)" }}>
          <table className="vault-table w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="w-14">#</th>
                <th>{currentCategory} ID</th>
                <th>Password</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {credentials.length === 0 ? (
                  <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={4} className="!p-0">
                      <EmptyState category={currentCategory} />
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

        {/* ── Mobile cards ── */}
        <div className="md:hidden">
          {credentials.length === 0 ? (
            <div className="rounded-[10px]" style={{ border: "1px solid var(--line)" }}>
              <EmptyState category={currentCategory} />
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {credentials.map((cred, i) => (
                  <CredentialCard
                    key={cred.id}
                    cred={cred}
                    index={i}
                    isRevealed={revealed.has(cred.id)}
                    toggleReveal={toggleReveal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>

      {/* ══ Edit modal ══ */}
      <AnimatePresence>
        {editingCred && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(6, 7, 9, 0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={() => setEditingCred(null)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 10 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="glass-heavy rounded-2xl w-full max-w-md p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setEditingCred(null)}
                className="btn-icon absolute top-4 right-4"
                aria-label="Close"
              >
                <X size={13} />
              </button>

              <div className="mb-5 pr-10">
                <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                  Edit credential
                </h3>
                <p className="text-[12.5px] mt-1" style={{ color: "var(--text-dim)" }}>
                  Re-encrypted on save.
                </p>
              </div>

              <form onSubmit={submitEdit} className="flex flex-col gap-4 w-full">
                <label className="flex flex-col gap-2 w-full">
                  <span className="field-label ml-0.5">Login ID / Username</span>
                  <input
                    type="text" required
                    value={editLoginId}
                    onChange={(e) => setEditLoginId(e.target.value)}
                    className="glass-input mono w-full px-3.5 py-2.5 text-[13px]"
                  />
                </label>

                <label className="flex flex-col gap-2 w-full">
                  <span className="field-label ml-0.5">Password</span>
                  <div className="relative flex items-center w-full">
                    <input
                      type={showEditPw ? "text" : "password"}
                      required
                      value={editPassword}
                      onChange={(e) => setEditPw(e.target.value)}
                      className="glass-input mono w-full pl-3.5 pr-10 py-2.5 text-[13px]"
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowEditPw(!showEditPw)}
                      className="absolute right-2 btn-icon !w-6 !h-6"
                    >
                      {showEditPw ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </label>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingCred(null)}
                    className="btn-glass flex-1 py-2.5 text-[13px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-2.5 text-[13px]"
                  >
                    {loading ? "Saving" : "Save changes"}
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
