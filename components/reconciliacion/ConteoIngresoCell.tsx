"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  codigo: string;
  nroingreso: string;
  initialUnidades: number | null;
  initialPiso: string | null;
  onSave: (codigo: string, nroingreso: string, unidades: number, piso: string | null) => void;
}

type Mode = "idle" | "editing" | "saving";

const PISO_OPTS = ["—", "A", "B", "C", "D", "E"] as const;

function fmt(n: number): string {
  return n.toLocaleString("es-CL");
}

export function ConteoIngresoCell({
  codigo,
  nroingreso,
  initialUnidades,
  initialPiso,
  onSave,
}: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [unidades, setUnidades] = useState<number | null>(initialUnidades);
  const [piso, setPiso] = useState<string | null>(initialPiso ?? null);
  const [draft, setDraft] = useState("");
  const [draftPiso, setDraftPiso] = useState<string | null>(initialPiso ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "editing" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  const enterEdit = useCallback(() => {
    setError(null);
    setDraft(unidades != null ? String(unidades) : "");
    setDraftPiso(piso);
    setMode("editing");
  }, [unidades, piso]);

  const cancelEdit = useCallback(() => {
    setError(null);
    setMode("idle");
  }, []);

  const commit = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    const n = parseInt(trimmed, 10);
    if (isNaN(n) || n < 0) {
      setError("Número ≥ 0");
      inputRef.current?.focus();
      return;
    }

    const pisoVal = draftPiso === "—" ? null : draftPiso;

    setMode("saving");
    setError(null);

    try {
      const res = await fetch("/api/conteo-fisico-ingreso", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_producto: codigo,
          nroingreso,
          unidades_fisicas: n,
          piso: pisoVal,
        }),
      });

      if (!res.ok) {
        const b = await res.json().catch(() => null);
        throw new Error(b?.error ?? "Error al guardar");
      }

      setUnidades(n);
      setPiso(pisoVal);
      onSave(codigo, nroingreso, n, pisoVal);
      setMode("idle");
    } catch (e: any) {
      setError(e.message ?? "Error desconocido");
      setMode("editing");
      inputRef.current?.focus();
    }
  }, [draft, draftPiso, codigo, nroingreso, onSave, cancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); commit(); }
      else if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
    },
    [commit, cancelEdit],
  );

  if (mode === "editing" || mode === "saving") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <div className="flex flex-col items-end gap-0.5">
            <input
              ref={inputRef}
              type="number" min="0" step="1" inputMode="numeric"
              className={cn(
                "h-8 w-20 rounded-lg border-0 bg-[#e8ecef] px-2 text-right text-sm tabular-nums text-[#2d3748]",
                "shadow-neumorph-inset",
                "focus:outline-none focus:ring-2 focus:ring-[#38a169]/50",
                error && "ring-2 ring-[#e53e3e]/50",
                mode === "saving" && "opacity-60",
              )}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(null); }}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              disabled={mode === "saving"}
            />
            <span className="text-[10px] text-[#718096] leading-none">unid</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <select
              className="h-8 w-16 rounded-lg border-0 bg-[#e8ecef] px-1.5 text-xs text-[#2d3748] shadow-neumorph-inset focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"
              value={draftPiso ?? "—"}
              onChange={(e) => setDraftPiso(e.target.value === "—" ? null : e.target.value)}
              disabled={mode === "saving"}
            >
              {PISO_OPTS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <span className="text-[10px] text-[#718096] leading-none">piso</span>
          </div>
          {mode === "saving" && (
            <Loader2 className="h-4 w-4 animate-spin text-[#718096]" />
          )}
        </div>
        {error && (
          <span className="text-xs text-[#e53e3e]">{error}</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={enterEdit}
      className={cn(
        "btn-neumorph inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#e8ecef]/60 px-2.5 py-1.5 text-right tabular-nums text-[#2d3748]",
        "hover:bg-white",
        "focus:outline-none focus:ring-2 focus:ring-[#38a169]/50",
        unidades == null && "text-[#b8bec7]",
      )}
    >
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium tabular-nums">
          {unidades != null ? fmt(unidades) : "—"}
        </span>
        <span className="text-[10px] text-[#718096] leading-none">unid</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs tabular-nums">
          {piso ?? "—"}
        </span>
        <span className="text-[10px] text-[#718096] leading-none">piso</span>
      </div>
    </button>
  );
}
