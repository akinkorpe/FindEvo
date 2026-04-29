"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

type ShellCtx = {
  navOpen: boolean;
  openNav: () => void;
  closeNav: () => void;
};

const Ctx = createContext<ShellCtx | null>(null);

export function useAppShell(): ShellCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Sayfa AppShell dışındaysa no-op döndür — Header güvenle çağırabilsin.
    return { navOpen: false, openNav: () => {}, closeNav: () => {} };
  }
  return ctx;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const openNav = useCallback(() => setNavOpen(true), []);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const pathname = usePathname();

  // Route değişince drawer'ı kapat.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Drawer açıkken body scroll'unu kilitle.
  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  return (
    <Ctx.Provider value={{ navOpen, openNav, closeNav }}>
      <div className="flex min-h-screen bg-surface-muted">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </Ctx.Provider>
  );
}
