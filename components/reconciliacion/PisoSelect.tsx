"use client";

import { useState } from "react";

interface Props {
  codigo: string;
  nroingreso: string;
  unidadesActuales: number | null;
  initialPiso: string | null;
  onSave: (codigo: string, nroingreso: string, unidades: number, piso: string | null) => void;
}

const PISO_OPTS = ["—", "A", "B", "C", "D", "E"] as const;

export function PisoSelect({ codigo, nroingreso, unidadesActuales, initialPiso, onSave }: Props) {
  const [piso, setPiso] = useState<string | null>(initialPiso ?? null);
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoPiso = e.target.value === "—" ? null : e.target.value;
    // Optimistic update
    setPiso(nuevoPiso);
    setSaving(true);

    try {
      const res = await fetch("/api/conteo-fisico-ingreso", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_producto: codigo,
          nroingreso,
          unidades_fisicas: unidadesActuales ?? 0,
          piso: nuevoPiso,
        }),
      });

      if (!res.ok) throw new Error("Error al guardar piso");

      onSave(codigo, nroingreso, unidadesActuales ?? 0, nuevoPiso);
    } catch {
      // Revertir en caso de error
      setPiso(initialPiso ?? null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-0.5">
      <select
        className="h-11 sm:h-8 w-20 sm:w-16 rounded-xl border-0 bg-[#e8ecef] px-2 sm:px-1.5 text-base sm:text-xs text-[#2d3748] shadow-neumorph-inset focus:outline-none focus:ring-2 focus:ring-[#38a169]/50 disabled:opacity-50"
        value={piso ?? "—"}
        onChange={handleChange}
        disabled={saving}
      >
        {PISO_OPTS.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <span className="text-[10px] text-[#718096] leading-none">piso</span>
    </div>
  );
}
