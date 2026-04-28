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
  addFolder: (folderName: string) => Promise<void>;
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

  const refreshData = useCallback(async () => {
    if (!user) {
      setFolders([]);
      setVaultData({});
      setIsLoaded(true);
      return;
    }

    try {
      setIsLoaded(false);
      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from("folders")
        .select("*")
        .order("name");
        
      if (foldersError) throw foldersError;

      // Fetch credentials
      const { data: credsData, error: credsError } = await supabase
        .from("credentials")
        .select("*");
        
      if (credsError) throw credsError;

      const newFolders = foldersData || [];
      setFolders(newFolders);

      // Build vault map
      const newVaultData: VaultData = {};
      newFolders.forEach(f => {
        newVaultData[f.name] = credsData?.filter(c => c.folder_id === f.id) || [];
      });

      setVaultData(newVaultData);

      if (newFolders.length > 0 && !currentCategory) {
        setCurrentCategory(newFolders[0].name);
      }
    } catch (err) {
      console.error("Failed to fetch vault data:", err);
    } finally {
      setIsLoaded(true);
    }
  }, [user, currentCategory]);

  useEffect(() => {
    if (!authLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshData();
    }
  }, [authLoading, refreshData]);

  const addFolder = async (folderName: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("folders")
      .insert([{ name: folderName, user_id: user.id }]);
    if (error) {
      console.error(error);
      throw error;
    }
    await refreshData();
    setCurrentCategory(folderName);
  };

  const deleteFolder = async (folderId: string, folderName: string) => {
    if (folders.length <= 1) throw new Error("Cannot delete the only folder");
    const { error } = await supabase.from("folders").delete().eq("id", folderId);
    if (error) {
      console.error(error);
      throw error;
    }
    
    if (currentCategory === folderName) {
      setCurrentCategory("");
    }
    await refreshData();
  };

  const renameFolder = async (folderId: string, newName: string) => {
    const { error } = await supabase
      .from("folders")
      .update({ name: newName })
      .eq("id", folderId);
    if (error) {
      console.error(error);
      throw error;
    }
    await refreshData();
    setCurrentCategory(newName);
  };

  const addCredential = async (folderId: string, loginId: string, password: string) => {
    if (!user) return;
    const encryptedPassword = encryptPassword(password);
    const { error } = await supabase
      .from("credentials")
      .insert([
        { folder_id: folderId, login_id: loginId, password: encryptedPassword, user_id: user.id }
      ]);
    if (error) {
      console.error(error);
      throw error;
    }
    await refreshData();
  };

  const editCredential = async (credId: string, newLoginId: string, newPassword: string) => {
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
  };

  const deleteCredential = async (credId: string) => {
    const { error } = await supabase.from("credentials").delete().eq("id", credId);
    if (error) {
      console.error(error);
      throw error;
    }
    await refreshData();
  };

  return (
    <VaultContext.Provider
      value={{
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
      }}
    >
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
