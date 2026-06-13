"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  codigo: string;
  initialValue: number | null;
  onSave: (codigo: string, value: number) => void;
  /** Si se pasa, guarda en /api/conteo-fisico-ingreso en vez de /api/conteo-fisico */
  nroingreso?: string;
}

type Mode = "idle" | "editing" | "saving";

function fmt(n: number): string {
  return n.toLocaleString("es-CL");
}

export function ConteoFisicoInput({ codigo, initialValue, onSave, nroingreso }: Props) {
  const [mode, setMode] = useState<Mode>("idle");
  const [value, setValue] = useState<number | null>(initialValue);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input whenever mode transitions to "editing"
  useEffect(() => {
    if (mode === "editing" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [mode]);

  const enterEdit = useCallback(() => {
    setError(null);
    setDraft(value != null ? String(value) : "");
    setMode("editing");
  }, [value]);

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
      setError("Ingresá un número entero ≥ 0");
      inputRef.current?.focus();
      return;
    }

    setMode("saving");
    setError(null);

    try {
      const url = nroingreso
        ? "/api/conteo-fisico-ingreso"
        : "/api/conteo-fisico";
      const body = nroingreso
        ? { codigo_producto: codigo, nroingreso, unidades_fisicas: n, piso: null }
        : { codigo_producto: codigo, unidades_fisicas: n };

      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Error al guardar");
      }

      setValue(n);
      onSave(codigo, n);
      setMode("idle");
    } catch (e: any) {
      setError(e.message ?? "Error desconocido");
      setMode("editing");
      inputRef.current?.focus();
    }
  }, [draft, codigo, nroingreso, onSave, cancelEdit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [commit, cancelEdit],
  );

  // ── Editing / Saving ───────────────────────────────────────────

  if (mode === "editing" || mode === "saving") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className={cn(
              "min-h-[44px] sm:h-9 w-24 sm:w-24 rounded-xl border-0 bg-[#e8ecef] px-3 text-right text-base sm:text-sm tabular-nums text-[#2d3748]",
              "shadow-neumorph-inset placeholder:text-[#b8bec7]",
              "focus:outline-none focus:ring-2 focus:ring-[#38a169]/50",
              error && "ring-2 ring-[#e53e3e]/50",
              mode === "saving" && "opacity-60",
            )}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            disabled={mode === "saving"}
          />
          {mode === "saving" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
    );
  }

  // ── Idle ───────────────────────────────────────────────────────

  return (
    <button
      type="button"
      onClick={enterEdit}
      className={cn(
        "btn-neumorph inline-block min-w-[7rem] sm:min-w-[6rem] cursor-pointer rounded-xl bg-[#e8ecef]/60 px-3 py-2.5 sm:py-1.5 text-right text-base sm:text-sm tabular-nums text-[#2d3748] min-h-[44px] sm:min-h-0",
        "hover:bg-white",
        "focus:outline-none focus:ring-2 focus:ring-[#38a169]/50",
        value == null && "text-[#b8bec7]",
      )}
    >
      {value != null ? (
        <>
          <span className="font-medium">{fmt(value)}</span>
          <span className="ml-1 text-xs text-muted-foreground">unid</span>
        </>
      ) : (
        "—"
      )}
    </button>
  );
}
