"use client";

import { ClipboardCheck, BarChart3, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

interface Props {
  userName: string;
  userRol: string;
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
}

const STORAGE_KEY = "sidebar-collapsed";
const EXPANDED_W = 260;
const COLLAPSED_W = 72;

export function Sidebar({ userName, userRol, collapsed, onToggle }: Props) {
  const width = collapsed ? COLLAPSED_W : EXPANDED_W;

  const handleToggle = () => {
    const next = !collapsed;
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* noop */ }
    onToggle(next);
  };

  return (
    <aside
      className="fixed left-0 top-0 z-40 flex h-full flex-col border-r border-[#dde1e6] bg-white shadow-neumorph-sm"
      style={{ width, transition: "width 200ms ease" }}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-[#dde1e6] bg-white text-[#718096] shadow-neumorph-sm hover:text-[#2d3748] transition-all"
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Logo */}
      <div
        className="flex items-center gap-3 overflow-hidden whitespace-nowrap py-6"
        style={{
          paddingLeft: collapsed ? 20 : 24,
          paddingRight: collapsed ? 8 : 24,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2d3748] text-white shadow-neumorph-sm">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <span
          className="text-sm font-bold tracking-tight text-[#2d3748]"
          style={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
            overflow: "hidden",
            transition: "opacity 150ms ease",
          }}
        >
          Arjun Inventory
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p
          className="overflow-hidden whitespace-nowrap px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[#718096]"
          style={{
            opacity: collapsed ? 0 : 1,
            height: collapsed ? 0 : "auto",
            marginBottom: collapsed ? 0 : undefined,
            transition: "opacity 150ms ease, height 150ms ease",
          }}
        >
          Navegación
        </p>
        <a
          href="/reconciliacion"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#2d3748] bg-[#e8ecef] transition-all hover:shadow-neumorph-sm overflow-hidden whitespace-nowrap"
          title="Reconciliación"
          style={{ justifyContent: collapsed ? "center" : "flex-start" }}
        >
          <BarChart3 className="h-4 w-4 shrink-0 text-[#38a169]" />
          <span
            style={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
              overflow: "hidden",
              transition: "opacity 150ms ease",
            }}
          >
            Reconciliación
          </span>
        </a>
          {userRol === "admin" && (
            <a
              href="/usuarios"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#2d3748] transition-all hover:bg-[#e8ecef] hover:shadow-neumorph-sm overflow-hidden whitespace-nowrap"
              title="Usuarios"
              style={{ justifyContent: collapsed ? "center" : "flex-start" }}
            >
              <Users className="h-4 w-4 shrink-0 text-[#d69e2e]" />
              <span
                style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : "auto",
                  overflow: "hidden",
                  transition: "opacity 150ms ease",
                }}
              >
                Usuarios
              </span>
            </a>
          )}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-[#dde1e6] overflow-hidden whitespace-nowrap">
        <div
          className="py-4"
          style={{
            paddingLeft: collapsed ? 20 : 16,
            paddingRight: collapsed ? 20 : 16,
          }}
        >
          <div
            className="mb-3"
            style={{
              opacity: collapsed ? 0 : 1,
              height: collapsed ? 0 : "auto",
              overflow: "hidden",
              transition: "opacity 150ms ease, height 150ms ease",
            }}
          >
            <p className="text-sm font-medium leading-none text-[#2d3748]">
              {userName}
            </p>
            <p className="text-xs text-[#718096] capitalize">{userRol}</p>
          </div>
          <LogoutButton collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}
