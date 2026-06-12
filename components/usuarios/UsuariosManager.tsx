"use client";

import { useState, useEffect, useCallback } from "react";

interface Usuario {
  id: number;
  username: string;
  rol: string;
  activo: boolean;
  createdAt: string;
}

interface Props {
  currentUserId: string;
}

export function UsuariosManager({ currentUserId }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRol, setNewRol] = useState("bodeguero");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error("Error al cargar");
      setUsuarios(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      setFormError("Completá usuario y contraseña");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername, password: newPassword, rol: newRol }),
      });
      if (!res.ok) {
        const b = await res.json();
        throw new Error(b.error ?? "Error");
      }
      setNewUsername("");
      setNewPassword("");
      setNewRol("bodeguero");
      await fetchUsuarios();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !u.activo }),
      });
      if (!res.ok) throw new Error("Error");
      setUsuarios((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, activo: !u.activo } : x)),
      );
    } catch { /* noop */ }
  };

  const handleDelete = async (u: Usuario) => {
    if (!confirm(`¿Eliminar a ${u.username}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const b = await res.json();
        alert(b.error ?? "Error al eliminar");
        return;
      }
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
    } catch { /* noop */ }
  };

  if (loading) return <p className="text-sm text-[#718096]">Cargando…</p>;
  if (error) return <p className="text-sm text-[#e53e3e]">{error}</p>;

  return (
    <div className="space-y-6">
      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-neumorph">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b border-[#dde1e6] bg-[#e8ecef]/40">
              <th className="px-4 py-3 text-left font-medium text-[#718096]">Usuario</th>
              <th className="px-4 py-3 text-left font-medium text-[#718096]">Rol</th>
              <th className="px-4 py-3 text-center font-medium text-[#718096] w-[80px]">Activo</th>
              <th className="px-4 py-3 text-right font-medium text-[#718096] w-[80px]"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-[#dde1e6]/50 hover:bg-[#e8ecef]/20">
                <td className="px-4 py-2.5 text-[#2d3748]">{u.username}</td>
                <td className="px-4 py-2.5 text-[#718096] capitalize">{u.rol}</td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => toggleActivo(u)}
                    className={`rounded-full px-3 py-0.5 text-xs font-medium transition-all ${
                      u.activo
                        ? "bg-[#38a169]/10 text-[#38a169] hover:bg-[#38a169]/20"
                        : "bg-[#e53e3e]/10 text-[#e53e3e] hover:bg-[#e53e3e]/20"
                    }`}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    className="text-xs text-[#e53e3e]/60 hover:text-[#e53e3e] transition-colors"
                    title="Eliminar usuario"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario */}
      <div className="rounded-2xl bg-white shadow-neumorph p-5">
        <h2 className="text-sm font-semibold text-[#2d3748] mb-3">Nuevo usuario</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[#718096] uppercase tracking-wider">Usuario</label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="h-9 w-36 rounded-xl border-0 bg-[#e8ecef] px-3 text-sm text-[#2d3748] shadow-neumorph-inset focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"
              placeholder="username"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[#718096] uppercase tracking-wider">Contraseña</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-9 w-36 rounded-xl border-0 bg-[#e8ecef] px-3 text-sm text-[#2d3748] shadow-neumorph-inset focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"
              placeholder="password"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-[#718096] uppercase tracking-wider">Rol</label>
            <select
              value={newRol}
              onChange={(e) => setNewRol(e.target.value)}
              className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-sm text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"
            >
              <option value="bodeguero">Bodeguero</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-neumorph h-9 rounded-xl bg-[#38a169] px-4 text-sm font-medium text-white hover:bg-[#38a169]/90 disabled:opacity-50 transition-all"
          >
            {saving ? "Guardando…" : "Agregar"}
          </button>
          {formError && <span className="text-xs text-[#e53e3e]">{formError}</span>}
        </form>
      </div>
    </div>
  );
}
