"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import type { ReconciliacionRow } from "@/db/vidadigital/queries";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface Props {
  data: ReconciliacionRow[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function fmt(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return num.toLocaleString("es-CL");
}

function fmtFecha(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function saldoZofriTotal(row: ReconciliacionRow): number {
  const ingresos = row.ingresos ?? [];
  if (ingresos.length === 0) return row.saldo_zofri_unidades;
  return ingresos.reduce((sum, ing) => sum + ing.saldo_zofri_unidades, 0);
}

function diffZofri(row: ReconciliacionRow, zofri: number): number {
  return zofri - row.total_unidades_compradas;
}

function correspondeAnil(row: ReconciliacionRow, conteo: number | undefined, zofri: number): number | null {
  if (conteo == null) return null;
  return Math.min(row.total_unidades_compradas, Math.max(0, conteo - zofri));
}

function cajasAnil(row: ReconciliacionRow, corresponde: number): number {
  if (!row.packing || row.packing <= 0) return 0;
  return Math.floor(corresponde / row.packing);
}

function diffColor(n: number): string {
  if (n > 0) return "text-[#38a169]";
  if (n < 0) return "text-[#e53e3e]";
  return "text-[#718096]";
}

function diffSign(n: number): string {
  if (n > 0) return `+${fmt(n)}`;
  return fmt(n);
}

interface EstadoAnil { color: string; tooltip: string; }

function estadoAnil(conteo: number | undefined, saldoZofri: number): EstadoAnil | null {
  if (conteo == null) return null;
  if (conteo > saldoZofri) return { color: "text-[#38a169]", tooltip: "Hay sobrante para Anil" };
  if (conteo > 0 && conteo < saldoZofri) return { color: "text-[#e53e3e]", tooltip: "Físico menor que Zofri, algo no cuadra" };
  if (conteo > 0 && conteo <= saldoZofri) return { color: "text-[#d69e2e]", tooltip: "Todo lo físico es de Vida Digital, Anil tiene 0 en bodega" };
  return null;
}

function fechaMasReciente(row: ReconciliacionRow): string {
  if (!row.compras || row.compras.length === 0) return "";
  return row.compras[0].fechanvt;
}

/** Suma el conteo físico desde los ingresos (nueva fuente: ubicaciones_bodega). */
function sumConteoFisico(row: ReconciliacionRow): number | undefined {
  const ingresos = row.ingresos ?? [];
  if (ingresos.length === 0) return undefined;
  let sum = 0;
  let any = false;
  for (const ing of ingresos) {
    if (ing.conteo_fisico_unidades != null) {
      sum += ing.conteo_fisico_unidades;
      any = true;
    }
  }
  return any ? sum : undefined;
}

/** Extraer número central del ingreso: "101-25-000123-01-GLP" → "000123" */
function numeroIngreso(nro: string): string {
  const parts = nro.split("-");
  if (parts.length >= 3) return parts[2];
  return nro;
}

// ── Componente ───────────────────────────────────────────────────────

function ProductImage({ codigo }: { codigo: string }) {
  const [error, setError] = useState(false);
  const url = `https://res.cloudinary.com/dxkidwxjl/image/upload/productos/${codigo}.jpg`;

  if (error) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#e8ecef]">
        <Package className="h-5 w-5 text-[#b8bec7]" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={codigo}
      className="h-12 w-12 shrink-0 rounded-lg object-cover"
      onError={() => setError(true)}
    />
  );
}

export function ReconciliacionTable({ data }: Props) {
  const [nvExpanded, setNvExpanded] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Cargar estado expandido desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("reconciliacion-expanded");
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) setExpandedProducts(new Set(arr));
      }
    } catch { /* noop */ }
  }, []);

  // ── Search & filters ─────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");        // "" = todos
  const [filtroBodega, setFiltroBodega] = useState("");     // "" = todas
  const [filtroUbicacion, setFiltroUbicacion] = useState("");   // texto libre, ILIKE parcial
  const [filtroSaldoZofri, setFiltroSaldoZofri] = useState(""); // "" | ">0" | "=0"
  const [filtroSaldoAnil, setFiltroSaldoAnil] = useState("");   // "" | "sobrante" | "sin" | "alerta"
  const [filtroConteo, setFiltroConteo] = useState("");         // "" | "con" | "sin"
  const filtersActive = search || filtroAnio || filtroBodega || filtroUbicacion ||
    filtroSaldoZofri || filtroSaldoAnil || filtroConteo;

  const clearFilters = useCallback(() => {
    setSearch("");
    setFiltroAnio("");
    setFiltroBodega("");
    setFiltroUbicacion("");
    setFiltroSaldoZofri("");
    setFiltroSaldoAnil("");
    setFiltroConteo("");
  }, []);

  const toggleExpand = useCallback((codigo: string) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(codigo)) next.delete(codigo);
      else next.add(codigo);
      try { localStorage.setItem("reconciliacion-expanded", JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  }, []);

  /** Extraer año de una fecha ISO: "2025-12-10" → "2025" */
  function anioDeFecha(iso: string): string {
    return iso.slice(0, 4);
  }

  // Años disponibles (de las notas de venta / compras), descendente
  const aniosUnicos = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => r.compras?.forEach((c) => {
      if (c.fechanvt) set.add(anioDeFecha(c.fechanvt));
    }));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [data]);

  // Filtrar + ordenar
  const sorted = useMemo(() => {
    const term = search.toLowerCase().trim();

    return [...data]
      .filter((row) => {
        // Búsqueda textual
        if (term) {
          const matchCodigo = row.codigo.toLowerCase().includes(term);
          const matchDetalle = row.detalle.toLowerCase().includes(term);
          if (!matchCodigo && !matchDetalle) return false;
        }

        // Filtros de ingreso: si están activos, al menos un ingreso debe pasar
        const ingresos = row.ingresos ?? [];
        const hasIngresos = ingresos.length > 0;

        // Año de compra (nota de venta)
        if (filtroAnio) {
          const compras = row.compras ?? [];
          if (!compras.some((c) => anioDeFecha(c.fechanvt) === filtroAnio)) return false;
        }

        // Ingresos (para filtros de bodega/piso)
        if (filtroBodega && hasIngresos) {
          if (!ingresos.some((ing) => ing.bodega_nombre === filtroBodega)) return false;
        }

        // Ubicación (texto libre, ILIKE parcial sobre ubicacion_bodega)
        if (filtroUbicacion && hasIngresos) {
          const term = filtroUbicacion.toLowerCase();
          if (!ingresos.some((ing) => (ing.ubicacion_bodega ?? "").toLowerCase().includes(term))) return false;
        }

        // Saldo Zofri (suma de ingresos)
        const zofriF = saldoZofriTotal(row);
        if (filtroSaldoZofri === ">0" && zofriF <= 0) return false;
        if (filtroSaldoZofri === "=0" && zofriF !== 0) return false;

        // Saldo Anil (basado en correspondeAnil)
        const conteoF = sumConteoFisico(row);
        const corrF = correspondeAnil(row, conteoF, zofriF);
        if (filtroSaldoAnil === "sobrante" && (corrF == null || corrF <= 0)) return false;
        if (filtroSaldoAnil === "sin" && (corrF == null || corrF > 0)) return false;
        if (filtroSaldoAnil === "alerta") {
          if (conteoF == null || conteoF >= zofriF) return false;
        }

        // Conteo físico
        if (filtroConteo === "con" && conteoF == null) return false;
        if (filtroConteo === "sin" && conteoF != null) return false;

        return true;
      })
      .sort((a, b) => {
        const aDate = fechaMasReciente(a);
        const bDate = fechaMasReciente(b);
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return bDate.localeCompare(aDate);
      });
  }, [data, search, filtroAnio, filtroBodega, filtroUbicacion, filtroSaldoZofri, filtroSaldoAnil, filtroConteo]);

  const totalConteos = data.filter((r) => sumConteoFisico(r) != null).length;
  const totalProducts = data.length;
  const visibleProducts = sorted.length;

  return (
    <div>
      {/* Search & Filters */}
      {/* Mobile: toggle + search */}
      <div className="mb-3 flex items-center gap-2 sm:hidden">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b8bec7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border-0 bg-[#e8ecef] pl-9 pr-8 text-base text-[#2d3748] shadow-neumorph-inset placeholder:text-[#b8bec7] focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b8bec7] hover:text-[#718096] text-lg leading-none cursor-pointer">×</button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters((p) => !p)}
          className="btn-neumorph flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8ecef] text-[#718096]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      </div>

      {/* Mobile: filter drawer */}
      {showFilters && (
        <div className="mb-3 sm:hidden">
          <div className="rounded-2xl bg-white shadow-neumorph p-4 space-y-3">{/* filter selects go here, copied below */}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)} className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"><option value="">Año</option>{aniosUnicos.map(a => <option key={a} value={a}>{a}</option>)}</select>
            <select value={filtroBodega} onChange={(e) => setFiltroBodega(e.target.value)} className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"><option value="">Bodega</option><option value="Bodega 1">Bodega 1</option><option value="Bodega 2">Bodega 2</option></select>
            <input type="text" placeholder="Ubicación…" value={filtroUbicacion} onChange={(e) => setFiltroUbicacion(e.target.value)} className="h-9 w-32 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-inset placeholder:text-[#b8bec7] focus:outline-none focus:ring-2 focus:ring-[#38a169]/50" />
            <select value={filtroSaldoZofri} onChange={(e) => setFiltroSaldoZofri(e.target.value)} className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"><option value="">Saldo Zofri</option><option value=">0">Con saldo &gt; 0</option><option value="=0">Sin saldo (= 0)</option></select>
            <select value={filtroSaldoAnil} onChange={(e) => setFiltroSaldoAnil(e.target.value)} className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"><option value="">Saldo Anil</option><option value="sobrante">A favor de Anil</option><option value="sin">Sin saldo Anil</option><option value="alerta">Alerta</option></select>
            <select value={filtroConteo} onChange={(e) => setFiltroConteo(e.target.value)} className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"><option value="">Conteo Físico</option><option value="con">Con conteo</option><option value="sin">Sin conteo</option></select>
            {filtersActive && <button type="button" onClick={clearFilters} className="h-9 rounded-xl bg-[#e8ecef] px-3 text-xs font-medium text-[#718096] shadow-neumorph-sm">Limpiar</button>}
          </div>
        </div>
      )}

      {/* Desktop: always-visible filters */}
      <div className="mb-3 hidden sm:flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b8bec7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-xl border-0 bg-[#e8ecef] pl-9 pr-8 text-sm text-[#2d3748] shadow-neumorph-inset placeholder:text-[#b8bec7] focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b8bec7] hover:text-[#718096] text-lg leading-none cursor-pointer"
              title="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>

        {/* Año */}
        <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
          className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50 cursor-pointer">
          <option value="">Todos los años</option>
          {aniosUnicos.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Bodega */}
        <select value={filtroBodega} onChange={(e) => setFiltroBodega(e.target.value)}
          className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50 cursor-pointer">
          <option value="">Todas las bodegas</option>
          <option value="Bodega 1">Bodega 1</option>
          <option value="Bodega 2">Bodega 2</option>
        </select>

        {/* Ubicación */}
        <input
          type="text"
          placeholder="Ubicación…"
          value={filtroUbicacion}
          onChange={(e) => setFiltroUbicacion(e.target.value)}
          className="h-9 w-36 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-inset placeholder:text-[#b8bec7] focus:outline-none focus:ring-2 focus:ring-[#38a169]/50"
        />

        {/* Saldo Zofri */}
        <select value={filtroSaldoZofri} onChange={(e) => setFiltroSaldoZofri(e.target.value)}
          className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50 cursor-pointer">
          <option value="">Saldo Zofri</option>
          <option value=">0">Con saldo Zofri &gt; 0</option>
          <option value="=0">Sin saldo Zofri (= 0)</option>
        </select>

        {/* Saldo Anil */}
        <select value={filtroSaldoAnil} onChange={(e) => setFiltroSaldoAnil(e.target.value)}
          className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50 cursor-pointer">
          <option value="">Saldo Anil</option>
          <option value="sobrante">Con saldo a favor de Anil</option>
          <option value="sin">Sin saldo para Anil</option>
          <option value="alerta">Alerta (físico &lt; Zofri)</option>
        </select>

        {/* Conteo físico */}
        <select value={filtroConteo} onChange={(e) => setFiltroConteo(e.target.value)}
          className="h-9 rounded-xl border-0 bg-[#e8ecef] px-2.5 text-xs text-[#2d3748] shadow-neumorph-sm focus:outline-none focus:ring-2 focus:ring-[#38a169]/50 cursor-pointer">
          <option value="">Conteo Físico</option>
          <option value="con">Con conteo ingresado</option>
          <option value="sin">Sin conteo ingresado</option>
        </select>

        {/* Clear filters */}
        {filtersActive && (
          <button type="button" onClick={clearFilters}
            className="h-9 rounded-xl bg-[#e8ecef] px-3 text-xs font-medium text-[#718096] shadow-neumorph-sm hover:bg-white hover:text-[#e53e3e] transition-all cursor-pointer whitespace-nowrap">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Filter badge */}
      {filtersActive && (
        <div className="mb-3 text-xs text-[#718096]">
          <span className="font-medium text-[#2d3748]">{visibleProducts}</span> de{" "}
          <span className="font-medium text-[#2d3748]">{totalProducts}</span> productos
        </div>
      )}

      {/* Leyenda */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-0.5 text-xs text-[#718096]">
        <span><span className="text-[#38a169]">●</span> Hay sobrante para Anil (físico &gt; Zofri)</span>
        <span><span className="text-[#d69e2e]">●</span> Todo de Vida Digital, Anil = 0 (físico ≤ Zofri)</span>
        <span><span className="text-[#e53e3e]">●</span> Algo no cuadra (físico &lt; Zofri)</span>
        <span>● Sin conteo físico</span>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-neumorph">
        <div className="overflow-x-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px] sticky left-0 bg-white z-10">Productos Comprados</TableHead>
                <TableHead className="w-[110px] text-right">Cantidad que Compró Anil</TableHead>
                <TableHead className="w-[110px] text-right">Saldo en Zofri</TableHead>
                <TableHead className="w-[140px] text-right">Conteo Físico</TableHead>
                <TableHead className="w-[110px] text-right">Zofri vs Anil</TableHead>
                <TableHead className="w-[110px] text-right">Físico vs Anil</TableHead>
                <TableHead className="w-[110px] text-right">Físico vs Zofri</TableHead>
                <TableHead className="w-[140px] text-right">Cuánto Corresponde a Anil</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.flatMap((row) => {
                const zofri = saldoZofriTotal(row);
                const ingresos = row.ingresos ?? [];

                // Total conteo físico = suma de conteos por ingreso
                const totalConteoFisico = sumConteoFisico(row);
                const hasConteoIngreso = totalConteoFisico != null;

                const diffZ = diffZofri(row, zofri);
                const corr = correspondeAnil(row, totalConteoFisico, zofri);
                const corrCajas = corr != null ? cajasAnil(row, corr) : null;
                const corrEstado = estadoAnil(totalConteoFisico, zofri);
                const diffF = totalConteoFisico != null ? totalConteoFisico - row.total_unidades_compradas : null;
                const diffFZ = totalConteoFisico != null ? totalConteoFisico - zofri : null;
                const isExpanded = expandedProducts.has(row.codigo);

                const rows: React.ReactNode[] = [];

                // ── Fila resumen ──
                rows.push(
                  <TableRow
                    key={row.codigo}
                    className="cursor-pointer hover:bg-[#e8ecef]/30 transition-colors"
                    onClick={() => ingresos.length > 0 && toggleExpand(row.codigo)}
                    title={ingresos.length > 0 ? (isExpanded ? "Ocultar ingresos" : "Mostrar ingresos") : undefined}
                  >
                    {/* Producto */}
                    <TableCell className="w-[340px] sticky left-0 bg-white z-10">
                      <div className="flex items-start gap-3">
                        <ProductImage codigo={row.codigo} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {ingresos.length > 0 && (
                              <span className="text-[10px] text-[#718096] shrink-0 transition-transform duration-150">
                                {isExpanded ? "▼" : "▶"}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate text-[#2d3748]" title={row.detalle}>
                                {row.detalle}
                              </div>
                              <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-[#718096]">
                                <span>Cód: {row.codigo}</span>
                                <span>Pack: {fmt(row.packing)}</span>
                                {row.umed && <span>{row.umed}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {row.compras && row.compras.length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {(nvExpanded.has(row.codigo) ? row.compras : row.compras.slice(0, 2)).map((c) => (
                            <div key={c.knumfoli} className="text-xs text-[#718096]">
                              <span className="font-mono tabular-nums">NV {c.knumfoli}</span>
                              {" "}— {fmtFecha(c.fechanvt)} ({c.empresa}) — {fmt(c.unidades)} unid
                            </div>
                          ))}
                          {row.compras.length > 2 && (
                            <button type="button" className="text-xs text-[#38a169]/70 hover:text-[#38a169] cursor-pointer"
                              onClick={(e) => { e.stopPropagation(); setNvExpanded((prev) => { const next = new Set(prev); if (next.has(row.codigo)) next.delete(row.codigo); else next.add(row.codigo); return next; }); }}>
                              {nvExpanded.has(row.codigo) ? "Mostrar menos" : `+${row.compras.length - 2} más`}
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>
                    {/* Compras Anil */}
                    <TableCell className="w-[110px] text-right tabular-nums">
                      <div className="text-sm">{fmt(row.total_unidades_compradas)} unid</div>
                      <div className="text-xs text-[#718096]">{fmt(row.total_cajas_compradas)} cajas</div>
                    </TableCell>
                    {/* Saldo Zofri */}
                    <TableCell className="w-[110px] text-right tabular-nums">
                      <div className="text-sm">{fmt(zofri)} unid</div>
                      <div className="text-xs text-[#718096]">
                        {fmt(row.packing > 0 ? Math.floor(zofri / row.packing) : 0)} cajas
                      </div>
                    </TableCell>
                    {/* Conteo físico */}
                    <TableCell className="w-[140px] text-right tabular-nums">
                      <span className="text-sm">{hasConteoIngreso ? `${fmt(totalConteoFisico)} unid` : "—"}</span>
                    </TableCell>
                    {/* Zofri vs Anil */}
                    <TableCell className={cn("w-[110px] text-right tabular-nums font-medium text-sm", diffColor(diffZ))}>
                      {diffSign(diffZ)} unid
                    </TableCell>
                    {/* Físico vs Anil */}
                    <TableCell className={cn("w-[110px] text-right tabular-nums font-medium text-sm", diffF != null && diffColor(diffF))}>
                      {diffF != null ? `${diffSign(diffF)} unid` : "—"}
                    </TableCell>
                    {/* Físico vs Zofri */}
                    <TableCell className={cn("w-[110px] text-right tabular-nums font-medium text-sm", diffFZ != null && diffColor(diffFZ))}>
                      {diffFZ != null ? `${diffSign(diffFZ)} unid` : "—"}
                    </TableCell>
                    {/* Corresponde a Anil */}
                    <TableCell className="w-[140px] text-right tabular-nums" onClick={(e) => e.stopPropagation()}>
                      {corr != null ? (
                        <div className="flex flex-col items-end gap-0.5" title={corrEstado?.tooltip}>
                          <div className={cn("text-sm font-medium", corrEstado?.color)}>
                            {corrEstado ? "● " : ""}{fmt(corr)} unid
                          </div>
                          {corrCajas != null && corrCajas > 0 && (
                            <div className="text-xs text-[#718096]">{fmt(corrCajas)} cajas</div>
                          )}
                        </div>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );

                // ── Sub-filas por ingreso ──
                if (isExpanded) {
                  ingresos.forEach((ing) => {
                    // Filtrar sub-filas por bodega y ubicación
                    if (filtroBodega && ing.bodega_nombre !== filtroBodega) return;

                    if (filtroUbicacion) {
                      const term = filtroUbicacion.toLowerCase();
                      if (!(ing.ubicacion_bodega ?? "").toLowerCase().includes(term)) return;
                    }

                    const ingFisico = ing.conteo_fisico_unidades;
                    const ingDiffFZ = ingFisico != null ? ingFisico - ing.saldo_zofri_unidades : null;

                    rows.push(
                      <TableRow key={`${row.codigo}-${ing.nroingreso}`} className="bg-[#f4f5f7] hover:bg-[#edf0f2] border-b border-[#dde1e6]/40 flex flex-col sm:table-row">
                        {/* Ingreso info */}
                        <TableCell className="sm:w-[280px] pl-10 border-l-2 border-[#38a169]/30 block sm:table-cell">
                          <div className="text-xs font-medium text-[#2d3748]">
                            Ingreso{" "}
                            <span className="font-mono tabular-nums">{numeroIngreso(ing.nroingreso)}</span>
                          </div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-[#718096]">
                            <span>Año: 20{ing.anio}</span>
                            <span>{ing.bodega_nombre}</span>
                          </div>
                        </TableCell>
                        {/* Compras Anil (no aplica) */}
                        <TableCell className="block sm:table-cell sm:w-[110px] text-right text-xs text-[#b8bec7] pt-1 sm:pt-0">—</TableCell>
                        {/* Saldo Zofri */}
                        <TableCell className="block sm:table-cell sm:w-[110px] text-right text-xs tabular-nums text-[#2d3748] pt-1 sm:pt-0">
                          <span className="sm:hidden text-[10px] text-[#718096] mr-1">Saldo Zofri:</span>
                          {fmt(ing.saldo_zofri_unidades)} unid
                        </TableCell>
                        {/* Conteo físico (read-only, desde Vida Digital) */}
                        <TableCell className="block sm:table-cell sm:w-[140px] text-right pt-1 sm:pt-0">
                          <div className="text-sm tabular-nums text-right">
                            {ingFisico != null ? (
                              <span className="font-medium text-[#2d3748]">{fmt(ingFisico)} unid</span>
                            ) : (
                              <span className="text-[#b8bec7]">Sin contar</span>
                            )}
                          </div>
                        </TableCell>
                        {/* Ubicación (read-only, desde Vida Digital) */}
                        <TableCell className="block sm:table-cell sm:w-[110px] text-right pt-1 sm:pt-0">
                          <div className="text-xs text-right">
                            {ing.ubicacion_bodega ? (
                              <span className="text-[#2d3748]">{ing.ubicacion_bodega}</span>
                            ) : (
                              <span className="text-[#b8bec7]">Sin ubicación registrada</span>
                            )}
                          </div>
                        </TableCell>
                        {/* Físico vs Anil (no aplica) — hidden on mobile */}
                        <TableCell className="hidden sm:table-cell sm:w-[110px] text-right text-xs text-[#b8bec7]">—</TableCell>
                        {/* Físico vs Zofri (ingreso) */}
                        <TableCell className={cn("block sm:table-cell sm:w-[110px] text-right text-xs tabular-nums font-medium pt-1 sm:pt-0", ingDiffFZ != null && diffColor(ingDiffFZ))}>
                          <span className="sm:hidden text-[10px] text-[#718096] mr-1">Físico vs Zofri:</span>
                          {ingDiffFZ != null ? `${diffSign(ingDiffFZ)} unid` : "—"}
                        </TableCell>
                        {/* Corresponde a Anil (no aplica) — hidden on mobile */}
                        <TableCell className="hidden sm:table-cell sm:w-[140px] text-right text-xs text-[#b8bec7]">—</TableCell>
                      </TableRow>
                    );
                  });
                }

                return rows;
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between border-t border-[#dde1e6] bg-[#e8ecef]/30 px-4 py-2.5 text-xs text-[#718096]">
          <span>{sorted.length} producto{sorted.length !== 1 ? "s" : ""}</span>
          <span>{totalConteos} contado{totalConteos !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}
