"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  collapsed?: boolean;
}

export function LogoutButton({ collapsed = false }: Props) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="btn-neumorph inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dde1e6] bg-[#e8ecef] px-3 py-2 text-sm font-medium text-[#718096] transition-all hover:bg-white hover:text-[#e53e3e]"
      title={collapsed ? "Cerrar sesión" : undefined}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!collapsed && <span>Salir</span>}
    </button>
  );
}
