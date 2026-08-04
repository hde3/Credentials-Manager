"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useVault } from "@/context/VaultContext";
import { FolderPlus, Trash2, LogOut, Sun, Moon, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SidebarProps = {
  /** Called after a folder is picked — used to auto-close the mobile drawer. */
  onNavigate?: () => void;
  /** Renders a close button (mobile drawer only). */
  onClose?: () => void;
};

export default function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const { folders, currentCategory, setCurrentCategory, addFolder, deleteFolder, vaultData, user } = useVault();
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

  const handleSelect = (name: string) => {
    setCurrentCategory(name);
    onNavigate?.();
  };

  return (
    <div className="glass rounded-xl h-full flex flex-col overflow-hidden">
      {/* ══ Header ══ */}
      <div className="px-3.5 py-3.5 flex items-center justify-between gap-2 hairline-b">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-[9px] shrink-0 flex items-center justify-center p-1.5"
            style={{ background: "var(--sunken)", border: "1px solid var(--line)" }}
          >
            <Image
              src="/logo_2.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-[13.5px] font-semibold tracking-tight leading-none truncate" style={{ color: "var(--text)" }}>
              Credentials
            </h2>
            <p className="mono text-[9px] uppercase tracking-[0.15em] mt-1.5 leading-none" style={{ color: "var(--text-faint)" }}>
              Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={toggleTheme} className="btn-icon !w-7 !h-7" title="Toggle Theme" aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-icon !w-7 !h-7 md:hidden" title="Close menu" aria-label="Close menu">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ══ Folders ══ */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden px-2.5 pt-3.5 pb-2">
        <div className="flex items-center justify-between pl-1.5">
          <h3 className="mono text-[9.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
            Folders
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteFolder}
              className="btn-icon !w-6.5 !h-6.5 hover:!text-red-500"
              style={{ width: 26, height: 26 }}
              title="Delete Folder"
              aria-label="Delete folder"
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={handleAddFolder}
              className="btn-icon"
              style={{ width: 26, height: 26 }}
              title="Add Folder"
              aria-label="Add folder"
            >
              <FolderPlus size={12.5} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-0.5 pl-2 pr-0.5 -mr-1">
          {folders.map((folder) => {
            const isActive = currentCategory === folder.name;
            const count = (vaultData[folder.name] || []).length;
            return (
              <button
                key={folder.id}
                onClick={() => handleSelect(folder.name)}
                data-active={isActive}
                className="nav-item"
                title={folder.name}
              >
                <span
                  className="shrink-0 w-1.5 h-1.5 rounded-full"
                  style={{ background: isActive ? "var(--accent)" : "var(--line-2)" }}
                />
                <span className="truncate flex-1">{folder.name}</span>
                <span
                  className="mono text-[10px] tabular-nums"
                  style={{ color: isActive ? "var(--accent)" : "var(--text-faint)" }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {folders.length === 0 && (
            <p className="text-[12px] leading-relaxed px-2.5 py-4" style={{ color: "var(--text-faint)" }}>
              No folders yet. Use the + button to create one.
            </p>
          )}
        </div>
      </div>

      {/* ══ Footer ══ */}
      <div className="px-2.5 pt-2.5 pb-2.5 hairline-t space-y-2">
        {user?.email && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span
              className="w-6 h-6 rounded-[7px] shrink-0 flex items-center justify-center mono text-[10px] font-semibold uppercase"
              style={{ background: "var(--sunken)", border: "1px solid var(--line)", color: "var(--text-dim)" }}
            >
              {user.email.charAt(0)}
            </span>
            <p className="mono text-[10.5px] truncate flex-1" style={{ color: "var(--text-faint)" }}>
              {user.email}
            </p>
          </div>
        )}

        <button
          onClick={() => supabase.auth.signOut()}
          className="btn-glass w-full py-2 text-[12.5px]"
        >
          <LogOut size={12.5} />
          Sign out
        </button>
      </div>
    </div>
  );
}
