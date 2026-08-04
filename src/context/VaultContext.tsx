"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { encryptPassword } from "@/lib/crypto";

export type Folder = {
  id: string;
  name: string;
  user_id: string;
};

export type Credential = {
  id: string;
  folder_id: string;
  login_id: string;
  password: string; // stored encrypted
  user_id: string;
  created_at: string;
};

export type VaultData = {
  [folderName: string]: Credential[];
};

type VaultContextType = {
  user: User | null;
  authLoading: boolean;
  vaultData: VaultData;
  folders: Folder[];
  currentCategory: string;
  setCurrentCategory: (category: string) => void;
  addFolder: (folderName: string) => Promise<Folder>;
  deleteFolder: (folderId: string, folderName: string) => Promise<void>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  addCredential: (folderId: string, loginId: string, password: string) => Promise<void>;
  editCredential: (credId: string, newLoginId: string, newPassword: string) => Promise<void>;
  deleteCredential: (credId: string) => Promise<void>;
  isLoaded: boolean;
  refreshData: () => Promise<void>;
};

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [vaultData, setVaultData] = useState<VaultData>({});
  const [currentCategory, setCurrentCategory] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * NOTE: `currentCategory` is deliberately NOT a dependency here.
   * Reading it via the functional form of setState keeps this callback stable,
   * so switching folders no longer triggers a full re-fetch of the vault.
   */
  const refreshData = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setVaultData({});
      setIsLoaded(true);
      return;
    }

    try {
      const [foldersRes, credsRes] = await Promise.all([
        supabase.from("folders").select("*").eq("user_id", user.id).order("name"),
        supabase.from("credentials").select("*").eq("user_id", user.id),
      ]);

      if (foldersRes.error) throw foldersRes.error;
      if (credsRes.error) throw credsRes.error;

      const newFolders: Folder[] = foldersRes.data ?? [];
      const allCreds: Credential[] = credsRes.data ?? [];

      setFolders(newFolders);

      // Build vault map
      const newVaultData: VaultData = {};
      newFolders.forEach((f) => {
        newVaultData[f.name] = allCreds.filter((c) => c.folder_id === f.id);
      });
      setVaultData(newVaultData);

      // Keep the current selection if it still exists, else fall back.
      setCurrentCategory((prev) => {
        if (prev && newFolders.some((f) => f.name === prev)) return prev;
        return newFolders[0]?.name ?? "";
      });
    } catch (err) {
      console.error("Failed to fetch vault data:", err);
    } finally {
      setIsLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      refreshData();
    }
  }, [authLoading, refreshData]);

  const addFolder = useCallback(async (folderName: string): Promise<Folder> => {
    if (!user) throw new Error("Not authenticated.");

    const trimmed = folderName?.trim();
    if (!trimmed) throw new Error("Folder name cannot be empty.");

    const normalized = trimmed.toLowerCase();
    if (folders.some((f) => f.name.toLowerCase() === normalized)) {
      throw new Error("A folder with this name already exists.");
    }

    const { data, error } = await supabase
      .from("folders")
      .insert([{ name: trimmed, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error(error);
      throw error;
    }

    await refreshData();
    setCurrentCategory(trimmed);
    return data as Folder;
  }, [user, folders, refreshData]);

  const deleteFolder = useCallback(async (folderId: string, _folderName: string) => {
    if (folders.length <= 1) throw new Error("Cannot delete the only folder");

    const { error } = await supabase.from("folders").delete().eq("id", folderId);
    if (error) {
      console.error(error);
      throw error;
    }

    // refreshData() re-points currentCategory automatically if it disappeared.
    await refreshData();
  }, [folders, refreshData]);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    if (!user) return;

    const trimmed = newName?.trim();
    if (!trimmed) throw new Error("Folder name cannot be empty.");

    const normalized = trimmed.toLowerCase();
    const duplicate = folders.find((f) => f.name.toLowerCase() === normalized);
    if (duplicate && duplicate.id !== folderId) {
      throw new Error("A folder with this name already exists.");
    }

    const { error } = await supabase
      .from("folders")
      .update({ name: trimmed })
      .eq("id", folderId);

    if (error) {
      console.error(error);
      throw error;
    }

    await refreshData();
    setCurrentCategory(trimmed);
  }, [user, folders, refreshData]);

  const addCredential = useCallback(async (folderId: string, loginId: string, password: string) => {
    if (!user) return;

    const encryptedPassword = encryptPassword(password);
    const { error } = await supabase
      .from("credentials")
      .insert([
        { folder_id: folderId, login_id: loginId, password: encryptedPassword, user_id: user.id },
      ]);

    if (error) {
      console.error(error);
      throw error;
    }
    await refreshData();
  }, [user, refreshData]);

  const editCredential = useCallback(async (credId: string, newLoginId: string, newPassword: string) => {
    const encryptedPassword = encryptPassword(newPassword);
    const { error } = await supabase
      .from("credentials")
      .update({ login_id: newLoginId, password: encryptedPassword })
      .eq("id", credId);

    if (error) {
      console.error(error);
      throw error;
    }
    await refreshData();
  }, [refreshData]);

  const deleteCredential = useCallback(async (credId: string) => {
    const { error } = await supabase.from("credentials").delete().eq("id", credId);
    if (error) {
      console.error(error);
      throw error;
    }
    await refreshData();
  }, [refreshData]);

  const contextValue = React.useMemo(() => ({
    user,
    authLoading,
    vaultData,
    folders,
    currentCategory,
    setCurrentCategory,
    addFolder,
    deleteFolder,
    renameFolder,
    addCredential,
    editCredential,
    deleteCredential,
    isLoaded,
    refreshData,
  }), [
    user,
    authLoading,
    vaultData,
    folders,
    currentCategory,
    addFolder,
    deleteFolder,
    renameFolder,
    addCredential,
    editCredential,
    deleteCredential,
    isLoaded,
    refreshData,
  ]);

  return (
    <VaultContext.Provider value={contextValue}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}
