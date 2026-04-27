"use client";

import { useVault } from "@/context/VaultContext";
import { FolderPlus, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  const { folders, currentCategory, setCurrentCategory, addFolder, deleteFolder } = useVault();

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
    <div className="glass-panel h-full rounded-2xl p-5 flex flex-col gap-6 overflow-hidden">
      <div className="flex items-start justify-between border-b border-slate-700/50 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            Beautiful Organizer
          </p>
          <h2 className="text-xl font-bold leading-none text-white">Credentials</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Folders</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDeleteFolder}
              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Current Folder"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleAddFolder}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-dashed border-slate-600 hover:border-slate-400"
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
                  ? "bg-blue-500/10 text-white border border-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              {folder.name}
            </button>
          ))}
          {folders.length === 0 && (
            <div className="text-sm text-slate-500 italic p-2">No folders yet.</div>
          )}
        </div>
      </div>
      
      <div className="pt-4 border-t border-slate-700/50">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
