"use client";

import { useVault } from "@/context/VaultContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import CredentialForm from "./CredentialForm";
import CredentialTable from "./CredentialTable";
import { Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIChatWidget from "./AIChatWidget";

export default function DashboardLayout() {
  const { user, authLoading, isLoaded, currentCategory } = useVault();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading || !isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="glass rounded-[2rem] px-10 py-8 flex flex-col items-center gap-4">
          {/* Spinning glass ring */}
          <div className="w-10 h-10 rounded-full border-2 border-white/30 border-t-[#0070eb] animate-spin" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 tracking-wide">Loading vault…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex w-full p-3 md:p-5 gap-4 md:gap-5 overflow-hidden h-screen">
      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 272, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="shrink-0 hidden md:block overflow-hidden h-full"
          >
            <div className="w-[272px] h-full">
              <Sidebar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between pt-1 px-1">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-icon hidden md:inline-flex"
            title="Toggle sidebar"
            aria-label="Toggle sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="flex md:hidden items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Vault</h1>
          </div>

          {currentCategory && (
            <div className="px-4 py-1.5 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-200 glass border-white/30">
              {currentCategory}
            </div>
          )}
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-5 max-w-5xl w-full mx-auto pb-28">
          <CredentialForm />
          <CredentialTable />
        </div>
      </div>

      {/* ── AI Widget ── */}
      <AIChatWidget />
    </div>
  );
}
