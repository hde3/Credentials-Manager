"use client";

import { useVault } from "@/context/VaultContext";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import CredentialForm from "./CredentialForm";
import CredentialTable from "./CredentialTable";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIChatWidget from "./AIChatWidget";

export default function DashboardLayout() {
  const { user, authLoading, isLoaded, currentCategory, folders, vaultData } = useVault();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNavOpen]);

  const totalCredentials = useMemo(
    () => Object.values(vaultData).reduce((sum, list) => sum + list.length, 0),
    [vaultData]
  );

  if (authLoading || !isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen p-6">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-7 h-7 rounded-full animate-spin"
            style={{ border: "1.5px solid var(--line)", borderTopColor: "var(--text)" }}
          />
          <p className="mono text-[10.5px] uppercase tracking-[0.14em]" style={{ color: "var(--text-faint)" }}>
            Decrypting vault
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex w-full h-screen overflow-hidden p-3 md:p-4 gap-3 md:gap-4">
      {/* ══ Sidebar (desktop) ══ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 hidden md:block overflow-hidden h-full"
          >
            <div className="w-[256px] h-full">
              <Sidebar />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══ Sidebar (mobile drawer) ══ */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{ background: "rgba(6, 7, 9, 0.55)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={() => setMobileNavOpen(false)}
          >
            <motion.div
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", stiffness: 340, damping: 33 }}
              className="h-full w-[262px] max-w-[85vw] p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                onNavigate={() => setMobileNavOpen(false)}
                onClose={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Main column ══ */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        {/* ── Top bar ── */}
        <header className="glass rounded-xl px-2.5 sm:px-3.5 py-2.5 flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-icon hidden md:inline-flex"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
          </button>

          <button
            onClick={() => setMobileNavOpen(true)}
            className="btn-icon md:hidden"
            title="Open menu"
            aria-label="Open menu"
          >
            <Menu size={14} />
          </button>

          {/* Breadcrumb */}
          <div className="min-w-0 flex-1 flex items-center gap-2">
            <span className="mono text-[10.5px] uppercase tracking-[0.13em] hidden sm:inline" style={{ color: "var(--text-faint)" }}>
              Vault
            </span>
            <span className="hidden sm:inline" style={{ color: "var(--text-faint)" }}>/</span>
            <h1 className="text-[14px] font-semibold tracking-tight truncate" style={{ color: "var(--text)" }}>
              {currentCategory || "No folder selected"}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <span className="chip">{folders.length} folders</span>
            <span className="chip chip-accent">{totalCredentials} keys</span>
          </div>
        </header>

        {/* ── Scroll area ── */}
        <div className="flex-1 overflow-y-auto mt-3 md:mt-4 -mr-1 pr-1">
          <div className="flex flex-col gap-3 md:gap-4 max-w-4xl w-full mx-auto pb-32">
            <CredentialForm />
            <CredentialTable />
          </div>
        </div>
      </main>

      {/* ══ AI Widget ══ */}
      <AIChatWidget />
    </div>
  );
}
