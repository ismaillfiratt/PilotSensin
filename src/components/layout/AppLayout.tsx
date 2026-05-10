"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar           from "./Sidebar";
import Topbar            from "./Topbar";
import AlertMarquee      from "./AlertMarquee";
import MobileNav         from "./MobileNav";
import RealtimeProvider  from "@/components/providers/RealtimeProvider";
import DataProvider      from "@/components/providers/DataProvider";
import { useLayout }     from "@/store/layout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { mobileSidebarAcik, mobileSidebarKapat } = useLayout();
  const pathname = usePathname();

  // Sayfa değişince mobil sidebar'ı kapat
  useEffect(() => { mobileSidebarKapat(); }, [pathname, mobileSidebarKapat]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarAcik && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={mobileSidebarKapat}
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-64"
            >
              <Sidebar mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* İçerik */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6"
          style={{ background: "var(--bg-primary)", transition: "background 0.25s ease" }}
        >
          {children}
        </main>
        <AlertMarquee />
      </div>

      {/* Mobil Alt Navigasyon */}
      <MobileNav />

      {/* Supabase'den veri yükle + Realtime dinle */}
      <DataProvider />
      <RealtimeProvider />
    </div>
  );
}
