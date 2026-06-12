"use client";

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

interface Props {
  data: ReconciliacionRow[];
}

/** Formatea un número con separadores de miles. */
function fmt(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("es-CL");
}

/** Diferencia Zofri - Compras (columna 4). */
function diffZofri(row: ReconciliacionRow): number {
  return row.saldo_zofri_unidades - row.total_unidades_compradas;
}

/** Sugerencia de cajas completas de Anil (columna 6). */
function sugerenciaCajas(row: ReconciliacionRow): number {
  if (!row.packing || row.packing <= 0) return 0;
  return Math.floor(row.total_unidades_compradas / row.packing);
}

/** Color y signo para diferencias. */
function diffColor(n: number): string {
  if (n > 0) return "text-emerald-600";
  if (n < 0) return "text-red-600";
  return "text-muted-foreground";
}

function diffSign(n: number): string {
  if (n > 0) return `+${fmt(n)}`;
  return fmt(n);
}

export function ReconciliacionTable({ data }: Props) {
  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Producto</TableHead>
              <TableHead className="text-right">Compras Anil</TableHead>
              <TableHead className="text-right">Saldo Zofri</TableHead>
              <TableHead className="text-right">Conteo físico</TableHead>
              <TableHead className="text-right">
                Dif. Zofri vs Compras
              </TableHead>
              <TableHead className="text-right">
                Sugerencia cajas
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => {
              const diff = diffZofri(row);
              const cajas = sugerenciaCajas(row);

              return (
                <TableRow key={row.codigo}>
                  {/* Producto */}
                  <TableCell>
                    <div className="font-medium">{row.detalle}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>Cód: {row.codigo}</span>
                      <span>Pack: {fmt(row.packing)}</span>
                      {row.umed && <span>{row.umed}</span>}
                    </div>
                  </TableCell>

                  {/* Compras Anil */}
                  <TableCell className="text-right tabular-nums">
                    <div>{fmt(row.total_unidades_compradas)} unid</div>
                    <div className="text-xs text-muted-foreground">
                      {fmt(row.total_cajas_compradas)} cajas
                    </div>
                  </TableCell>

                  {/* Saldo Zofri */}
                  <TableCell className="text-right tabular-nums">
                    <div>{fmt(row.saldo_zofri_unidades)} unid</div>
                    <div className="text-xs text-muted-foreground">
                      {fmt(row.saldo_zofri_cajas)} cajas
                    </div>
                  </TableCell>

                  {/* Conteo físico — pendiente S05 */}
                  <TableCell className="text-center text-muted-foreground">
                    —
                  </TableCell>

                  {/* Diferencia Zofri - Compras */}
                  <TableCell
                    className={cn(
                      "text-right tabular-nums font-medium",
                      diffColor(diff),
                    )}
                  >
                    {diffSign(diff)} unid
                  </TableCell>

                  {/* Sugerencia cajas */}
                  <TableCell className="text-right tabular-nums">
                    {cajas > 0 ? `${fmt(cajas)} cajas` : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        {data.length} producto{data.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
