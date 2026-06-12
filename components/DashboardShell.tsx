"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";

interface Props {
  userName: string;
  userRol: string;
  children: React.ReactNode;
}

const STORAGE_KEY = "sidebar-collapsed";
const EXPANDED_ML = 260;
const COLLAPSED_ML = 72;

export function DashboardShell({ userName, userRol, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch { /* noop */ }
    setMounted(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setCollapsed(e.newValue === "true");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const onToggle = useCallback((nowCollapsed: boolean) => {
    setCollapsed(nowCollapsed);
  }, []);

  const ml = !mounted ? EXPANDED_ML : collapsed ? COLLAPSED_ML : EXPANDED_ML;

  return (
    <div className="flex min-h-screen bg-[#e8ecef]">
      <Sidebar
        userName={userName}
        userRol={userRol}
        collapsed={collapsed}
        onToggle={onToggle}
      />
      <main
        className="flex-1 p-6"
        style={{
          marginLeft: ml,
          transition: "margin-left 200ms ease",
        }}
      >
        {children}
      </main>
    </div>
  );
}
