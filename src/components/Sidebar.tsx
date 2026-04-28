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
      try {
        await addFolder(name.trim());
      } catch (err: unknown) {
        const e = err as Error;
        alert(e.message || "Failed to add folder");
      }
    }
  };

  const handleDeleteFolder = async () => {
    if (folders.length <= 1) {
      alert("Cannot delete the only folder.");
      return;
    }
    const folder = folders.find((f) => f.name === currentCategory);
    if (!folder) return;
    
    if (window.confirm(`Are you sure you want to delete the "${folder.name}" folder and all its credentials?`)) {
      try {
        await deleteFolder(folder.id, folder.name);
      } catch (err: unknown) {
        const e = err as Error;
        alert(e.message || "Failed to delete folder");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#171717] border border-gray-200 dark:border-neutral-800 shadow-md backdrop-blur-md h-screen max-h-full rounded-2xl p-5 flex flex-col gap-6 overflow-hidden transition-colors">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl font-bold leading-none text-gray-900 dark:text-gray-100">Credentials</h2>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors border border-gray-200 dark:border-neutral-700"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folders</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteFolder}
              className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              title="Delete Current Folder"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleAddFolder}
              className="p-1.5 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors border border-dashed border-gray-300 dark:border-neutral-600 hover:border-gray-400 dark:hover:border-neutral-400"
              title="Add New Folder"
            >
              <FolderPlus size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setCurrentCategory(folder.name)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentCategory === folder.name
                  ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-white border border-blue-200 dark:border-blue-500/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent"
              }`}
            >
              {folder.name}
            </button>
          ))}
          {folders.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-500 italic p-2">No folders yet.</div>
          )}
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-200 dark:border-neutral-800 flex flex-col gap-2">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
