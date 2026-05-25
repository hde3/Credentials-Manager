"use client";

import { useVault } from "@/context/VaultContext";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { processGeminiCommand } from "@/app/actions/gemini";

type Message = { id: string; text: string; sender: "user" | "system" | "assistant" };

export default function AIChatWidget() {
  const {
    vaultData, folders,
    addFolder, renameFolder, deleteFolder,
    addCredential, editCredential, deleteCredential,
    setCurrentCategory,
  } = useVault();

  const [isOpen, setIsOpen]   = useState(false);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "0", text: `Hi! I'm Gemini. Try: "Put test@gmail.com / pass123 into Netflix" and I'll add it instantly.`, sender: "system" },
  ]);

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const pushMsg = (text: string, sender: Message["sender"]) =>
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender }]);

  const resolveFolder = (name: string) =>
    folders.find(f => f.name.toLowerCase() === name?.toLowerCase())?.name ?? name;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    pushMsg(userMsg, "user");
    setLoading(true);

    try {
      /* Build vault context (no passwords) */
      const ctx: Record<string, { loginId: string }[]> = {};
      folders.forEach(f => {
        ctx[f.name] = (vaultData[f.name] || []).map(c => ({ loginId: c.login_id }));
      });

      const raw = await processGeminiCommand(userMsg, JSON.stringify(ctx, null, 2));

      /* Parse JSON — strip any accidental markdown fences */
      const cleaned = raw.replace(/```json|```/g, "").trim();
      let actions: Record<string, string>[];
      try { actions = JSON.parse(cleaned); }
      catch { pushMsg(raw || "Sorry, I couldn't understand that.", "assistant"); setLoading(false); return; }

      if (!Array.isArray(actions)) actions = [actions];

      const replies: string[] = [];

      for (const a of actions) {
        switch (a.action) {

          case "ADD_CREDENTIAL": {
            const fName = resolveFolder(a.folder);
            let targetFolder = folders.find(f => f.name === fName);
            if (!targetFolder) {
              await addFolder(fName);
              /* After addFolder, VaultContext refreshes; but we need the new folder ID.
                 Tell the user to repeat — safest without a race condition. */
              replies.push(`Created folder "${fName}". Please repeat the add command.`);
              break;
            }
            await addCredential(targetFolder.id, a.loginId || "unknown", a.password || "unknown");
            setCurrentCategory(fName);
            replies.push(`Added ${a.loginId} to ${fName}.`);
            break;
          }

          case "EDIT_CREDENTIAL": {
            const fName = resolveFolder(a.folder);
            const creds = vaultData[fName] || [];
            const cred = creds.find(c => c.login_id.toLowerCase() === (a.currentLoginId || "").toLowerCase());
            if (!cred) { replies.push(`Credential "${a.currentLoginId}" not found in ${fName}.`); break; }
            await editCredential(cred.id, a.newLoginId || cred.login_id, a.newPassword || "");
            setCurrentCategory(fName);
            replies.push(`Updated credential in ${fName}.`);
            break;
          }

          case "DELETE_CREDENTIAL": {
            const fName = resolveFolder(a.folder);
            const creds = vaultData[fName] || [];
            const cred = creds.find(c => c.login_id.toLowerCase() === (a.loginId || "").toLowerCase());
            if (!cred) { replies.push(`Credential "${a.loginId}" not found in ${fName}.`); break; }
            await deleteCredential(cred.id);
            replies.push(`Deleted ${a.loginId} from ${fName}.`);
            break;
          }

          case "CREATE_FOLDER": {
            await addFolder(a.folder);
            replies.push(`Created folder: ${a.folder}`);
            break;
          }

          case "RENAME_FOLDER": {
            const folder = folders.find(f => f.name.toLowerCase() === (a.oldFolder || "").toLowerCase());
            if (!folder) { replies.push(`Folder "${a.oldFolder}" not found.`); break; }
            await renameFolder(folder.id, a.newFolder);
            replies.push(`Renamed "${a.oldFolder}" → "${a.newFolder}".`);
            break;
          }

          case "DELETE_FOLDER": {
            const fName = resolveFolder(a.folder);
            const folder = folders.find(f => f.name === fName);
            if (!folder) { replies.push(`Folder "${fName}" not found.`); break; }
            await deleteFolder(folder.id, folder.name);
            replies.push(`Deleted folder: ${fName}`);
            break;
          }

          case "CHAT":
            replies.push(a.message || "Done.");
            break;

          default:
            replies.push(`Unknown action: ${a.action}`);
        }
      }

      pushMsg(replies.join("\n") || "Task completed.", "assistant");
    } catch (err: unknown) {
      pushMsg("Error: " + (err as Error).message, "assistant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* ── Chat panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.34, 1.26, 0.64, 1] }}
            className="glass-heavy rounded-[2rem] w-[340px] flex flex-col overflow-hidden"
            style={{ maxHeight: "min(520px, 65vh)" }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/20 dark:border-white/8 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md">✦</span>
                Gemini Assistant
              </h3>
              <button onClick={() => setIsOpen(false)} className="btn-icon !w-7 !h-7" aria-label="Close">
                <X size={13} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`max-w-[86%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "btn-primary self-end rounded-br-sm text-white px-4"
                      : msg.sender === "system"
                      ? "self-center text-center text-xs glass rounded-xl text-slate-500 dark:text-slate-400 max-w-[95%] border border-white/20"
                      : "glass self-start rounded-bl-sm text-slate-700 dark:text-slate-200 border border-white/25 dark:border-white/8"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="glass self-start rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 border border-white/25">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/20 dark:border-white/8 flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && input.trim()) handleSend(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Ask Gemini…"
                rows={1}
                className="glass-input flex-1 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 resize-none overflow-hidden min-h-[38px] max-h-[100px]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-icon-primary flex-shrink-0 disabled:opacity-40"
                aria-label="Send"
              >
                <Send size={14} className="-mr-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Gemini Assistant"
        className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #a855f7 0%, #0070eb 100%)",
          boxShadow: "0 6px 28px rgba(168,85,247,0.45), 0 2px 8px rgba(0,0,0,0.15)",
          border: "0.5px solid rgba(255,255,255,0.3)",
        }}
      >
        {/* Gemini-style spark icon */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C12 2 13.5 8 18 9.5C13.5 11 12 17 12 17C12 17 10.5 11 6 9.5C10.5 8 12 2 12 2Z" />
          <path d="M5 3C5 3 5.8 6 8 6.8C5.8 7.6 5 10.5 5 10.5C5 10.5 4.2 7.6 2 6.8C4.2 6 5 3 5 3Z" opacity="0.7"/>
          <path d="M19 14C19 14 19.6 16.5 21 17C19.6 17.5 19 20 19 20C19 20 18.4 17.5 17 17C18.4 16.5 19 14 19 14Z" opacity="0.7"/>
        </svg>
      </button>
    </div>
  );
}
