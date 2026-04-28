"use client";

import { useVault } from "@/context/VaultContext";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send } from "lucide-react";
import { processGeminiCommand } from "@/app/actions/gemini";

type Message = {
  id: string;
  text: string;
  sender: "user" | "system" | "assistant";
};

export default function AIChatWidget() {
  const { vaultData, folders, addFolder, renameFolder, deleteFolder, addCredential, editCredential, deleteCredential, setCurrentCategory } = useVault();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi! I'm Gemini. Say \"Put test@gmail.com and pass 123 into Netflix\" and I'll add it for you.", sender: "system" }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resolveFolderName = (name: string) => {
    if (!name) return "Uncategorized";
    const match = folders.find((f) => f.name.toLowerCase() === name.toLowerCase());
    return match ? match.name : name;
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userMsg, sender: "user" }]);
    setLoading(true);

    try {
      const sanitizedVault: Record<string, {loginId: string}[]> = {};
      folders.forEach(f => {
        sanitizedVault[f.name] = (vaultData[f.name] || []).map(c => ({ loginId: c.login_id }));
      });
      const contextStr = JSON.stringify(sanitizedVault, null, 2);

      const responseText = await processGeminiCommand(userMsg, contextStr);
      
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      let parsed = null;
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[1]); } catch (e) {}
      } else {
        try { parsed = JSON.parse(responseText.trim()); } catch (e) {}
      }

      if (!parsed) {
        const fallbackMsg = responseText.replace(/```json[\s\S]*?```/g, "").trim() || "I can only add credentials, create folders, or rename folders.";
        setMessages(prev => [...prev, { id: Date.now().toString(), text: fallbackMsg, sender: "assistant" }]);
        setLoading(false);
        return;
      }

      const actions = Array.isArray(parsed) ? parsed : [parsed];
      const replyMessages: string[] = [];

      for (const actionData of actions) {
        if (actionData.action === "ADD_CREDENTIAL") {
          const fName = resolveFolderName(actionData.folder);
          const targetFolder = folders.find(f => f.name === fName);
          if (!targetFolder) {
            await addFolder(fName);
            // Folder needs to be fetched, but context update is async. For robust parsing we'd wait,
            // but for simplicity we rely on the user confirming or doing it in two steps.
            replyMessages.push(`Added ${fName} folder. Please run the add command again.`);
            continue;
          }
          await addCredential(targetFolder.id, actionData.loginId || "unknown", actionData.password || "unknown");
          setCurrentCategory(fName);
          replyMessages.push(`Added ${actionData.loginId} to ${fName}.`);
        } else if (actionData.action === "CREATE_FOLDER") {
          const fName = resolveFolderName(actionData.folder);
          await addFolder(fName);
          replyMessages.push(`Created folder: ${fName}`);
        } else if (actionData.action === "DELETE_FOLDER") {
          const fName = resolveFolderName(actionData.folder);
          const target = folders.find(f => f.name === fName);
          if (target) {
            await deleteFolder(target.id, target.name);
            replyMessages.push(`Deleted folder: ${fName}`);
          }
        }
        // Simplified parsing for editing/deleting based on old script
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), text: replyMessages.join("\n") || "Task completed.", sender: "assistant" }]);
    } catch (err: unknown) {
      const e = err as Error;
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Error: " + e.message, sender: "assistant" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[340px] h-[480px] max-h-[60vh] bg-white dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl shadow-blue-500/10"
          >
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-blue-50 dark:bg-blue-500/5">
              <h3 className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-2">
                <Bot size={18} className="text-blue-400" />
                Gemini Assistant
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`max-w-[85%] p-3 rounded-xl text-sm ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white self-end rounded-br-sm"
                      : msg.sender === "system"
                      ? "bg-gray-100 dark:bg-neutral-800/50 text-gray-500 dark:text-gray-400 self-center text-center text-xs border border-gray-200 dark:border-neutral-700/50"
                      : "bg-gray-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-200 self-start rounded-bl-sm border border-gray-200 dark:border-neutral-700"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
              {loading && (
                <div className="bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 self-start rounded-bl-sm border border-gray-200 dark:border-neutral-700 p-3 rounded-xl text-sm flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleCommand} className="p-3 border-t border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && input.trim()) {
                      handleCommand(e as unknown as React.FormEvent);
                    }
                  }
                }}
                placeholder="Ask Gemini..."
                rows={1}
                className="flex-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-blue-500 transition-colors resize-none min-h-[40px] max-h-[120px] overflow-y-auto"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center justify-center flex-shrink-0 transition-colors mb-0.5"
              >
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center hover:scale-105 transition-transform"
      >
        <Bot size={28} />
      </button>
    </div>
  );
}
