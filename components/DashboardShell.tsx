"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";

interface Props {
  userName: string;
  userRol: string;
  children: React.ReactNode;
}

const STORAGE_KEY = "sidebar-collapsed";

export function DashboardShell({ userName, userRol, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setCollapsed(true);
    } catch { /* noop */ }
    setMounted(true);
  }, []);

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="flex min-h-screen bg-[#e8ecef]">
      <div style={{ display: mounted ? "contents" : "none" }}>
        <Sidebar
          userName={userName}
          userRol={userRol}
          collapsed={collapsed}
          onToggle={setCollapsed}
        />
      </div>
      <main
        className="flex-1 p-4 sm:p-6 pb-20 sm:pb-6"
        style={{ marginLeft: mounted ? sidebarWidth : 0, transition: "margin-left 200ms ease" }}
      >
        {children}
      </main>
    </div>
  );
}
