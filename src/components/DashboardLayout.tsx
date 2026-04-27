"use client";

import { useVault } from "@/context/VaultContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import CredentialForm from "./CredentialForm";
import CredentialTable from "./CredentialTable";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import AIChatWidget from "./AIChatWidget";

export default function DashboardLayout() {
  const { user, authLoading, isLoaded, currentCategory } = useVault();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex w-full max-w-screen-2xl mx-auto p-4 md:p-8 gap-6 overflow-hidden h-screen">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0, opacity: sidebarOpen ? 1 : 0 }}
        className="shrink-0 hidden md:block z-10"
      >
        <Sidebar />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto min-w-0">
        <div className="flex items-center justify-between pb-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors hidden md:block"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex md:hidden items-center gap-2">
            <h1 className="text-xl font-bold">Vault</h1>
          </div>

          {currentCategory && (
            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold">
              {currentCategory}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 max-w-5xl w-full mx-auto pb-24">
          <CredentialForm />
          <CredentialTable />
        </div>
      </div>

      {/* AI Widget */}
      <AIChatWidget />
    </div>
  );
}
