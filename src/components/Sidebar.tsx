"use client";

import { useState, useEffect } from "react";
import { useVault } from "@/context/VaultContext";
import { FolderPlus, Trash2, LogOut, Sun, Moon } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const { folders, currentCategory, setCurrentCategory, addFolder, deleteFolder } = useVault();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      setTheme("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  const handleAddFolder = async () => {
    const name = window.prompt("Enter new folder name:");
    if (name?.trim()) {
      try { await addFolder(name.trim()); }
      catch (err: unknown) { alert((err as Error).message || "Failed to add folder"); }
    }
  };

  const handleDeleteFolder = async () => {
    if (folders.length <= 1) { alert("Cannot delete the only folder."); return; }
    const folder = folders.find((f) => f.name === currentCategory);
    if (!folder) return;
    if (window.confirm(`Delete "${folder.name}" and all its credentials?`)) {
      try { await deleteFolder(folder.id, folder.name); }
      catch (err: unknown) { alert((err as Error).message || "Failed to delete folder"); }
    }
  };

  return (
    <div className="glass rounded-[2rem] h-full flex flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/20 dark:border-white/8">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-500 dark:text-slate-400 mb-0.5">
            Beautiful Organizer
          </p>
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent leading-none">
            Credentials
          </h2>
        </div>
        <button
          onClick={toggleTheme}
          className="btn-icon"
          title="Toggle Theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* ── Folders list ── */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden px-4 py-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.14em]">
            Folders
          </h3>
          <div className="flex items-center gap-1.5">
            <button onClick={handleDeleteFolder} className="btn-icon !w-7 !h-7 hover:!text-red-500" title="Delete Folder">
              <Trash2 size={13} />
            </button>
            <button onClick={handleAddFolder} className="btn-icon !w-7 !h-7 hover:!text-blue-500" title="Add Folder">
              <FolderPlus size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 -mr-1 pr-1">
          {folders.map((folder) => {
            const isActive = currentCategory === folder.name;
            return (
              <button
                key={folder.id}
                onClick={() => setCurrentCategory(folder.name)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-2.5 ${
                  isActive
                    ? "bg-white/65 dark:bg-white/12 text-slate-900 dark:text-white font-semibold border border-white/50 dark:border-white/15 shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white/35 dark:hover:bg-white/6 font-medium border border-transparent"
                }`}
              >
                {/* Active blue checkmark */}
                <span
                  className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? "bg-[#0070eb] shadow-[0_2px_8px_rgba(0,112,235,0.4)]"
                      : "bg-white/30 dark:bg-white/8 border border-white/30 dark:border-white/10"
                  }`}
                >
                  {isActive && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5.2l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span className="truncate">{folder.name}</span>
              </button>
            );
          })}
          {folders.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic px-4 py-2">No folders yet.</p>
          )}
        </div>
      </div>

      {/* ── Sign out ── */}
      <div className="px-4 pb-5 pt-3 border-t border-white/20 dark:border-white/8">
        <button
          onClick={() => supabase.auth.signOut()}
          className="btn-glass w-full flex items-center justify-center gap-2 py-2.5 text-sm"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
